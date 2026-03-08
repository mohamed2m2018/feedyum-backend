const axios = require('axios');
const crypto = require('crypto');
const keys = require('../config/keys');
const PaymobTransaction = require('../models/paymobTransaction');
const ChefWallet = require('../models/chefWallet');

const PAYMOB_BASE_URL = 'https://accept.paymob.com';

/**
 * Create a payment intention for wallet top-up
 * POST /api/paymob/create-intention
 */
const createPaymentIntention = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = req.user;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        if (amount < 10) {
            return res.status(400).json({
                success: false,
                message: 'Minimum charge amount is 10 EGP',
            });
        }

        if (amount > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum charge amount is 50,000 EGP',
            });
        }

        const amountCents = Math.round(amount * 100);

        // Create the intention via Paymob API
        const intentionPayload = {
            amount: amountCents,
            currency: 'EGP',
            payment_methods: [parseInt(keys.paymobIntegrationId)],
            items: [
                {
                    name: 'Wallet Top-up',
                    amount: amountCents,
                    description: `Wallet charge of ${amount} EGP`,
                    quantity: 1,
                },
            ],
            billing_data: {
                first_name: user.fullName?.split(' ')[0] || 'User',
                last_name: user.fullName?.split(' ').slice(1).join(' ') || 'N/A',
                email: user.email || 'NA@NA.com',
                phone_number: user.phone || '+201000000000',
                apartment: 'NA',
                floor: 'NA',
                street: 'NA',
                building: 'NA',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'NA',
                country: 'EG',
                state: 'NA',
            },
            customer: {
                first_name: user.fullName?.split(' ')[0] || 'User',
                last_name: user.fullName?.split(' ').slice(1).join(' ') || 'N/A',
                email: user.email || 'NA@NA.com',
            },
            extras: {
                userId: user._id.toString(),
            },
        };

        // Add notification URL if server has a public URL
        if (keys.paymobCallbackUrl || process.env.API_BASE_URL) {
            const baseUrl = keys.paymobCallbackUrl || process.env.API_BASE_URL;
            intentionPayload.notification_url = `${baseUrl}/api/paymob/callback`;
            intentionPayload.redirection_url = `${baseUrl}/api/paymob/redirect`;
        }

        const response = await axios.post(
            `${PAYMOB_BASE_URL}/v1/intention/`,
            intentionPayload,
            {
                headers: {
                    'Authorization': `Token ${keys.paymobSecretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { client_secret, id: paymobOrderId } = response.data;

        // Build the checkout URL using the iframe
        const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${keys.paymobPublicKey}&clientSecret=${client_secret}`;

        // Save transaction record
        const transaction = new PaymobTransaction({
            user: user._id,
            amount,
            amountCents,
            paymobOrderId: paymobOrderId?.toString(),
            clientSecret: client_secret,
            status: 'pending',
            description: `Wallet top-up of ${amount} EGP`,
        });
        await transaction.save();

        res.json({
            success: true,
            checkoutUrl,
            clientSecret: client_secret,
            transactionId: transaction._id,
            publicKey: keys.paymobPublicKey,
        });
    } catch (error) {
        console.error('Paymob create intention error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intention',
            error: error.response?.data?.message || error.message,
        });
    }
};

/**
 * Handle Paymob transaction callback (called by Paymob servers)
 * POST /api/paymob/callback
 */
const handleCallback = async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('[Paymob Callback] Received:', JSON.stringify(callbackData).substring(0, 500));

        // Extract transaction data from callback
        const obj = callbackData.obj || callbackData;
        const transactionId = obj.id?.toString();
        const orderId = obj.order?.id?.toString() || obj.order?.toString();
        const isSuccess = obj.success === true || obj.success === 'true';
        const amountCents = obj.amount_cents || obj.amount;
        const extras = obj.order?.extras || {};

        // Verify HMAC if secret is configured
        if (keys.paymobHmacSecret) {
            const hmac = req.query.hmac || req.body.hmac;
            if (hmac) {
                // Paymob HMAC verification
                const data = callbackData.obj || callbackData;
                const concatenatedString = [
                    data.amount_cents,
                    data.created_at,
                    data.currency,
                    data.error_occured,
                    data.has_parent_transaction,
                    data.id,
                    data.integration_id,
                    data.is_3d_secure,
                    data.is_auth,
                    data.is_capture,
                    data.is_refunded,
                    data.is_standalone_payment,
                    data.is_voided,
                    data.order?.id || data.order,
                    data.owner,
                    data.pending,
                    data.source_data?.pan,
                    data.source_data?.sub_type,
                    data.source_data?.type,
                    data.success,
                ].join('');

                const calculatedHmac = crypto
                    .createHmac('sha512', keys.paymobHmacSecret)
                    .update(concatenatedString)
                    .digest('hex');

                if (calculatedHmac !== hmac) {
                    console.error('[Paymob Callback] HMAC verification failed');
                    return res.status(401).json({ success: false, message: 'HMAC verification failed' });
                }
            }
        }

        // Find the transaction by paymob order ID
        let transaction = null;
        if (orderId) {
            transaction = await PaymobTransaction.findOne({ paymobOrderId: orderId });
        }

        if (!transaction && transactionId) {
            transaction = await PaymobTransaction.findOne({ paymobTransactionId: transactionId });
        }

        if (transaction) {
            transaction.paymobTransactionId = transactionId;
            transaction.status = isSuccess ? 'success' : 'failed';
            transaction.callbackData = callbackData;
            transaction.updated_at = new Date();
            await transaction.save();

            // If payment successful, credit the wallet
            if (isSuccess) {
                const amount = transaction.amount;
                let wallet = await ChefWallet.findOne({ chef: transaction.user });

                if (!wallet) {
                    wallet = new ChefWallet({ chef: transaction.user });
                    await wallet.save();
                }

                const description = `Wallet top-up via Paymob (Transaction #${transactionId})`;
                await wallet.processPayment(amount, description);
                console.log(`[Paymob Callback] Wallet credited: ${amount} EGP for user ${transaction.user}`);
            }
        } else {
            console.warn('[Paymob Callback] No matching transaction found for orderId:', orderId);
        }

        // Always respond with 200 to Paymob
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[Paymob Callback] Error:', error.message);
        // Still return 200 to prevent Paymob from retrying
        res.status(200).json({ success: false, error: error.message });
    }
};

/**
 * Handle Paymob redirect (user returns from checkout)
 * GET /api/paymob/redirect
 */
const handleRedirect = async (req, res) => {
    const { success, id, order } = req.query;
    const isSuccess = success === 'true';

    // Update transaction if we can find it
    if (order) {
        try {
            const transaction = await PaymobTransaction.findOne({ paymobOrderId: order.toString() });
            if (transaction && transaction.status === 'pending') {
                transaction.paymobTransactionId = id?.toString();
                transaction.status = isSuccess ? 'success' : 'failed';
                transaction.updated_at = new Date();
                await transaction.save();

                // Credit wallet if not already done by callback
                if (isSuccess) {
                    const existingCredit = await ChefWallet.findOne({
                        chef: transaction.user,
                        'transactions.description': { $regex: `Transaction #${id}` }
                    });

                    if (!existingCredit) {
                        let wallet = await ChefWallet.findOne({ chef: transaction.user });
                        if (!wallet) {
                            wallet = new ChefWallet({ chef: transaction.user });
                            await wallet.save();
                        }
                        await wallet.processPayment(transaction.amount, `Wallet top-up via Paymob (Transaction #${id})`);
                    }
                }
            }
        } catch (err) {
            console.error('[Paymob Redirect] Error updating transaction:', err.message);
        }
    }

    // Return an HTML page that the WebView can detect
    const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Payment ${isSuccess ? 'Successful' : 'Failed'}</title></head>
    <body>
      <script>
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMOB_PAYMENT_RESULT',
          success: ${isSuccess},
          transactionId: '${id || ''}',
          orderId: '${order || ''}'
        }));
      </script>
      <h2>${isSuccess ? '✅ Payment Successful!' : '❌ Payment Failed'}</h2>
      <p>${isSuccess ? 'Your wallet has been charged. You can close this page.' : 'Payment was not completed. Please try again.'}</p>
    </body>
    </html>
  `;
    res.send(html);
};

/**
 * Verify payment status
 * GET /api/paymob/verify/:transactionId
 */
const verifyPayment = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const userId = req.user._id;

        const transaction = await PaymobTransaction.findOne({
            _id: transactionId,
            user: userId,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        res.json({
            success: true,
            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                status: transaction.status,
                paymentMethod: transaction.paymentMethod,
                createdAt: transaction.created_at,
                updatedAt: transaction.updated_at,
            },
        });
    } catch (error) {
        console.error('Verify payment error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
        });
    }
};

module.exports = {
    createPaymentIntention,
    handleCallback,
    handleRedirect,
    verifyPayment,
};
