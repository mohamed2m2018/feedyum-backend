'use client';

/**
 * FeeBreakdown — reusable component that clearly explains FeedYum's fee structure.
 *
 * Props:
 *   lang        — 'ar' | 'en'
 *   orderFee    — CHEF_ORDER_FEE from feeConfig (e.g. 4)
 *   feeTiers    — SERVICE_FEE_TIERS array from feeConfig
 *   variant     — 'card' (default, used inside policy pages) | 'highlight' (used on home/about hero)
 */
export default function FeeBreakdown({ lang = 'en', orderFee = 4, feeTiers = [], variant = 'card' }) {
    const isAr = lang === 'ar';

    const copy = {
        ar: {
            customerTitle: '💸 رسوم الخدمة على العميل',
            customerDesc: 'رسوم بسيطة يتحملها العميل عند الطلب، تُضاف لإجمالي الطلب ويدفعها كاش للطباخ مع قيمة الطلب — FeedYum بتحصّلها بعد كده من الطباخ.',
            orderRange: 'قيمة الطلب',
            fee: 'رسوم الخدمة',
            upTo: 'حتى',
            above: 'أكثر من',
            egp: 'ج.م',
            chefTitle: '🏪 رسوم المنصة على الطباخ / المطعم',
            chefDesc: `رسوم ثابتة ${orderFee} ج.م لكل طلب مؤكد، تُخصم تلقائياً من محفظة الطباخ داخل التطبيق بعد استلام قيمة الطلب من العميل.`,
            howTitle: '🔄 كيف تسير المدفوعات؟',
            howSteps: [
                'العميل يدفع كاش للطباخ: قيمة الطلب + رسوم التوصيل + رسوم الخدمة',
                `الطباخ يحتفظ بالمبلغ كله ثم FeedYum تخصم ${orderFee} ج.م + رسوم الخدمة من محفظته`,
                'بكده الطباخ مش بيتحمل حاجة تانية — كل حاجة واضحة من الأول',
            ],
        },
        en: {
            customerTitle: '💸 Customer Service Fee',
            customerDesc: `A small fee added to each order, paid by the customer in cash to the chef along with the order total — FeedYum then collects it from the chef's wallet.`,
            orderRange: 'Order Amount',
            fee: 'Service Fee',
            upTo: 'Up to',
            above: 'Above',
            egp: 'EGP',
            chefTitle: '🏪 Platform Fee for Chefs & Restaurants',
            chefDesc: `A flat ${orderFee} EGP fee per confirmed order, automatically deducted from the chef's in-app wallet after receiving the order payment from the customer.`,
            howTitle: '🔄 How Payments Flow',
            howSteps: [
                'Customer pays cash to chef: order subtotal + delivery fee + service fee',
                `Chef keeps the full amount, then FeedYum deducts ${orderFee} EGP + service fee from their wallet`,
                'No surprises for the chef — everything is transparent from the start',
            ],
        },
    };

    const t = isAr ? copy.ar : copy.en;

    // Build human-readable tier labels from the tiers array
    const tierLabels = feeTiers.map((tier, index) => {
        const prevMax = index === 0 ? 0 : feeTiers[index - 1].maxSubtotal;
        const isLast = tier.maxSubtotal === Infinity;
        let range;
        if (isLast) {
            range = isAr
                ? `${t.above} ${prevMax} ${t.egp}`
                : `${t.above} ${prevMax} ${t.egp}`;
        } else if (index === 0) {
            range = isAr
                ? `${t.upTo} ${tier.maxSubtotal} ${t.egp}`
                : `${t.upTo} ${tier.maxSubtotal} ${t.egp}`;
        } else {
            range = isAr
                ? `${prevMax + 1} – ${tier.maxSubtotal} ${t.egp}`
                : `${prevMax + 1} – ${tier.maxSubtotal} ${t.egp}`;
        }
        return { range, fee: tier.fee };
    });

    const containerStyle = {
        background: 'var(--dark-secondary)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '28px 32px',
        direction: isAr ? 'rtl' : 'ltr',
        textAlign: isAr ? 'right' : 'left',
        marginBottom: '24px',
    };

    const sectionLabelStyle = {
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--primary)',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const descStyle = {
        color: 'var(--light-muted)',
        fontSize: '0.9rem',
        lineHeight: 1.7,
        marginBottom: '18px',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '8px',
        fontSize: '0.9rem',
    };

    const thStyle = {
        background: 'rgba(255,77,103,0.1)',
        color: 'var(--light)',
        fontWeight: 600,
        padding: '10px 14px',
        borderRadius: '8px',
        textAlign: isAr ? 'right' : 'left',
    };

    const tdStyle = {
        padding: '10px 14px',
        color: 'var(--light-muted)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    };

    const feeValueStyle = {
        color: 'var(--secondary)',
        fontWeight: 700,
        fontSize: '1rem',
    };

    const dividerStyle = {
        borderTop: '1px solid rgba(255,255,255,0.07)',
        margin: '22px 0',
    };

    const stepStyle = {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '10px',
        color: 'var(--light-muted)',
        fontSize: '0.9rem',
        lineHeight: 1.6,
    };

    const dotStyle = {
        minWidth: 22,
        height: 22,
        borderRadius: '50%',
        background: 'rgba(255,77,103,0.15)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.75rem',
        marginTop: 2,
    };

    return (
        <div style={containerStyle}>
            {/* Customer service fee */}
            <div style={sectionLabelStyle}>{t.customerTitle}</div>
            <p style={descStyle}>{t.customerDesc}</p>

            {feeTiers.length > 0 && (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>{t.orderRange}</th>
                            <th style={{ ...thStyle, textAlign: isAr ? 'left' : 'right' }}>{t.fee}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tierLabels.map((tier, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                <td style={tdStyle}>{tier.range}</td>
                                <td style={{ ...tdStyle, textAlign: isAr ? 'left' : 'right', ...feeValueStyle }}>
                                    {tier.fee} {t.egp}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div style={dividerStyle} />

            {/* Chef platform fee */}
            <div style={sectionLabelStyle}>{t.chefTitle}</div>
            <p style={descStyle}>{t.chefDesc}</p>

            <div style={dividerStyle} />

            {/* Flow */}
            <div style={{ ...sectionLabelStyle, color: 'var(--secondary)' }}>{t.howTitle}</div>
            {t.howSteps.map((step, i) => (
                <div key={i} style={stepStyle}>
                    <span style={dotStyle}>{i + 1}</span>
                    <span>{step}</span>
                </div>
            ))}
        </div>
    );
}
