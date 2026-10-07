'use client';

import { useLang } from '../components/useLang';
import { Nav, Footer } from '../components/SharedComponents';
import FeeBreakdown from '../components/FeeBreakdown';
import feeConfig from '../../config/feeConfig';

const refundSections = {
    ar: [
        {
            title: '١. سياسة الإلغاء',
            text: 'يمكن للعميل إلغاء الطلب مجاناً قبل تأكيد المطعم أو الطباخ للطلب. بعد تأكيد الطلب من المطعم أو الطباخ، قد لا يكون الإلغاء ممكناً حيث يكون قد تم البدء في تحضير الطعام.',
        },
        {
            title: '٢. إلغاء الطلب من قبل المطعم',
            text: 'قد يقوم المطعم أو الطباخ بإلغاء الطلب في بعض الحالات مثل عدم توفر المكونات أو الإغلاق المفاجئ. في هذه الحالة، يتم إخطار العميل فوراً عبر التطبيق. بما أن الدفع يتم عند الاستلام (كاش)، لا يتم تحصيل أي مبلغ من العميل.',
        },
        {
            title: '٣. مشاكل الطلب',
            text: 'في حالة وجود مشكلة في الطلب (مثل طلب خاطئ، طعام تالف، أو كمية ناقصة)، يجب على العميل التواصل مباشرة مع المطعم أو الطباخ لحل المشكلة. يمكن أيضاً التواصل مع فريق دعم FeedYum للمساعدة في حل النزاع.',
        },
        {
            title: '٤. دور FeedYum في النزاعات',
            text: 'FeedYum تعمل كوسيط بين العملاء والمطاعم والطباخين. في حالة وجود نزاع، نسعى للتوسط وإيجاد حل مرضٍ لجميع الأطراف. القرار النهائي بخصوص الاسترداد يعتمد على طبيعة المشكلة وظروف كل حالة.',
        },
        {
            title: '٥. الاسترداد المالي',
            text: 'بما أن الدفع يتم عند الاستلام (كاش) مباشرة للمطعم أو الطباخ، فإن أي استرداد مالي يتم التعامل معه مباشرة بين العميل والمطعم. FeedYum تساعد في تسهيل عملية التواصل وحل المشكلة.',
        },
        {
            title: '٦. شكاوى الجودة',
            text: 'نحن نأخذ جودة الطعام على محمل الجد. إذا تكررت الشكاوى تجاه مطعم أو طباخ معين، تقوم FeedYum بمراجعة حسابه وقد تتخذ إجراءات مناسبة لضمان جودة الخدمة المقدمة على المنصة.',
        },
        {
            title: '٧. استرداد رسوم الخدمة',
            text: 'في حالة إلغاء الطلب قبل تأكيد الطباخ، يتم إلغاء الطلب كاملاً ولا يُحصَّل أي مبلغ من العميل لأن الدفع عند الاستلام. في حالة إلغاء الطلب بعد التأكيد وتم دفع أي مبلغ، يتم التفاوض مباشرة مع الطباخ لاسترداد رسوم الخدمة المدفوعة. تفاصيل رسوم الخدمة في الجدول أدناه.',
            isFeeSection: true,
        },
        {
            title: '٨. استرداد رسوم المنصة للطباخ',
            text: 'يحق للمطعم أو الطباخ طلب استرداد المبالغ المدفوعة كرسوم منصة (شحن المحفظة) خلال ١٤ يوماً من تاريخ الدفع، بشرط عدم استخدام الرصيد المشحون في أي معاملات على المنصة. في حالة الموافقة، يتم رد المبلغ بالكامل. لا يمكن استرداد أي رصيد تم استخدامه بالفعل حيث تكون الخدمة قد تم تقديمها. لطلب الاسترداد، يرجى التواصل معنا عبر البريد الإلكتروني mohamed.salah@feedyum.com مع ذكر بيانات الحساب ورقم المعاملة.',
        },
        {
            title: '٩. التواصل معنا',
            text: 'لأي استفسار أو شكوى بخصوص الاسترداد أو الإلغاء، يمكنك التواصل معنا عبر البريد الإلكتروني mohamed.salah@feedyum.com أو عبر صفحة "تواصل معنا" على الموقع.',
        },
    ],
    en: [
        {
            title: '1. Cancellation Policy',
            text: 'The customer can cancel the order for free before the restaurant or chef confirms the order. After the order has been confirmed by the restaurant or chef, cancellation may not be possible as food preparation may have already begun.',
        },
        {
            title: '2. Order Cancellation by Restaurant',
            text: 'The restaurant or chef may cancel the order in some cases, such as unavailability of ingredients or unexpected closure. In this case, the customer is notified immediately through the app. Since payment is made upon delivery (cash on delivery), no amount is charged to the customer.',
        },
        {
            title: '3. Order Issues',
            text: 'In case of an issue with the order (such as a wrong order, damaged food, or missing items), the customer should contact the restaurant or chef directly to resolve the issue. You can also contact the FeedYum support team for assistance in resolving the dispute.',
        },
        {
            title: '4. FeedYum\'s Role in Disputes',
            text: 'FeedYum acts as an intermediary between customers and restaurants/chefs. In case of a dispute, we strive to mediate and find a satisfactory solution for all parties. The final decision regarding refunds depends on the nature of the problem and the circumstances of each case.',
        },
        {
            title: '5. Financial Refunds',
            text: 'Since payment is made upon delivery (cash on delivery) directly to the restaurant or chef, any financial refund is handled directly between the customer and the restaurant. FeedYum helps facilitate communication and problem resolution.',
        },
        {
            title: '6. Quality Complaints',
            text: 'We take food quality seriously. If complaints against a specific restaurant or chef are repeated, FeedYum reviews their account and may take appropriate measures to ensure the quality of service provided on the platform.',
        },
        {
            title: '7. Service Fee Refund',
            text: 'If the order is cancelled before chef confirmation, no amount is charged since payment is cash on delivery. If cancelled after confirmation and any amount was paid, the service fee refund is negotiated directly with the chef. See the service fee breakdown below.',
            isFeeSection: true,
        },
        {
            title: '8. Restaurant & Chef Platform Fee Refund',
            text: 'Restaurants and chefs have the right to request a refund of platform fees paid (wallet top-up) within 14 days of the payment date, provided the charged balance has not been used in any transactions on the platform. If the refund is approved, the full amount will be refunded. Any balance that has already been used cannot be refunded as the service has been rendered. To request a refund, please contact us at mohamed.salah@feedyum.com with your account details and transaction number.',
        },
        {
            title: '9. Contact Us',
            text: 'For any inquiries or complaints regarding refunds or cancellations, you can reach us via email at mohamed.salah@feedyum.com or through the "Contact Us" page on our website.',
        },
    ],
};

export default function RefundPolicyPage() {
    const [lang, setLang] = useLang();
    const isAr = lang === 'ar';
    const sections = isAr ? refundSections.ar : refundSections.en;
    const orderFee = feeConfig.CHEF_ORDER_FEE;
    const feeTiers = feeConfig.SERVICE_FEE_TIERS;

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} onLangChange={setLang} />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">{isAr ? 'سياسة الاسترداد والإلغاء' : 'Refund & Cancellation Policy'}</h1>
                    </div>

                    <div dir={isAr ? 'rtl' : 'ltr'} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {sections.map((s, i) => (
                            <div key={i}>
                                <div className="privacy-section">
                                    <h3>{s.title}</h3>
                                    <p>{s.text}</p>
                                </div>
                                {s.isFeeSection && (
                                    <FeeBreakdown
                                        lang={lang}
                                        orderFee={orderFee}
                                        feeTiers={feeTiers}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'var(--light-muted)', fontSize: '0.85rem' }}>
                        <p>{isAr ? 'آخر تحديث: مارس ٢٠٢٦' : 'Last updated: March 2026'}</p>
                        <p>{isAr ? 'تواصل معنا: ' : 'Contact us: '}<a href="mailto:mohamed.salah@feedyum.com" style={{ color: 'var(--primary)' }}>mohamed.salah@feedyum.com</a></p>
                    </div>
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
