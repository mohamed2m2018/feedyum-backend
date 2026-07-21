const cron = require('node-cron');
const mongoose = require('mongoose');
const AmbassadorWallet = mongoose.model('ambassadorWallet');

/**
 * Cron job: Confirm pending commissions past their grace period
 * Runs every hour at :00
 *
 * Finds all ambassador wallet transactions with status 'pending' where
 * gracePeriodEnds has passed, then confirms them (moves from pendingBalance
 * to balance).
 */
function startConfirmPendingCommissions() {
    cron.schedule('0 * * * *', async () => {
        const now = new Date();

        try {
            const wallets = await AmbassadorWallet.find({
                'transactions': {
                    $elemMatch: {
                        status: 'pending',
                        gracePeriodEnds: { $lte: now }
                    }
                }
            });

            let confirmed = 0;
            for (const wallet of wallets) {
                for (const tx of wallet.transactions) {
                    if (tx.status === 'pending' && tx.gracePeriodEnds && tx.gracePeriodEnds <= now) {
                        const result = await AmbassadorWallet.updateOne(
                            {
                                _id: wallet._id,
                                transactions: { $elemMatch: { _id: tx._id, status: 'pending', gracePeriodEnds: { $lte: now } } },
                            },
                            {
                                $set: { 'transactions.$.status': 'confirmed' },
                                $inc: { pendingBalance: -tx.amount, balance: tx.amount, lifetimeEarnings: tx.amount },
                            },
                        );
                        if (result.modifiedCount) confirmed++;
                    }
                }
            }

            if (confirmed > 0) {
                console.log(`[CRON] Confirmed ${confirmed} pending commissions`);
            }
        } catch (err) {
            console.error('[CRON] Confirm pending commissions failed:', err.message);
        }
    });

    console.log('[CRON] Confirm pending commissions scheduled (every hour at :00)');
}

module.exports = { startConfirmPendingCommissions };
