'use client';

import { useLang } from '../components/useLang';
import { Nav, Footer } from '../components/SharedComponents';
import FeeBreakdown from '../components/FeeBreakdown';
import feeConfig from '../../config/feeConfig';

const deliverySections = {
    ar: [
        {
            title: '١. نظام التوصيل',
            text: 'FeedYum هي منصة وساطة إلكترونية تربط بين المطاعم والطباخين والعملاء. خدمة التوصيل يتم تقديمها وإدارتها بالكامل من قبل المطعم أو الطباخ مباشرة. FeedYum لا تقوم بعمليات التوصيل بنفسها.',
        },
        {
            title: '٢. رسوم التوصيل',
            text: 'رسوم التوصيل يتم تحديدها من قبل كل مطعم أو طباخ على حدة بناءً على المسافة بين الفرع وعنوان التوصيل. يتم عرض رسوم التوصيل بشكل واضح قبل تأكيد الطلب حتى يتمكن العميل من مراجعتها.',
        },
        {
            title: '٣. رسوم الخدمة',
            text: 'بالإضافة إلى رسوم التوصيل، يتحمل العميل رسوم خدمة بسيطة لصالح المنصة، تُضاف إلى إجمالي الطلب وتُدفع كاش للطباخ مع قيمة الطلب — تفاصيلها في الجدول أدناه.',
            isFeeSection: true,
        },
        {
            title: '٤. نطاق التوصيل',
            text: 'لكل مطعم أو طباخ نطاق توصيل محدد (بالكيلومترات) يتم تحديده من قبلهم. يمكن للعميل رؤية المطاعم والطباخين المتاحين للتوصيل في منطقته فقط.',
        },
        {
            title: '٥. وقت التوصيل المتوقع',
            text: 'وقت التوصيل يعتمد على المطعم أو الطباخ وعلى المسافة. يتم تقدير وقت التوصيل عند تأكيد الطلب، لكنه قد يختلف حسب ظروف الطريق أو حجم الطلبات.',
        },
        {
            title: '٦. طريقة الدفع',
            text: 'الدفع يتم عند الاستلام (كاش) مباشرة للمطعم أو الطباخ. المبلغ الإجمالي = قيمة الطلب + رسوم التوصيل + رسوم الخدمة. لا يوجد حالياً دفع إلكتروني للطلبات عبر المنصة.',
        },
        {
            title: '٧. عنوان التوصيل',
            text: 'العميل مسؤول عن تقديم عنوان توصيل صحيح ودقيق. في حالة تقديم عنوان خاطئ أو غير كامل، قد يتأخر التوصيل أو يتعذر إتمامه، وFeedYum غير مسؤولة عن أي تأخير ناتج عن ذلك.',
        },
        {
            title: '٨. الحد الأدنى للطلب',
            text: 'بعض المطاعم والطباخين قد يضعون حداً أدنى لقيمة الطلب لخدمة التوصيل. يتم عرض الحد الأدنى (إن وجد) بوضوح عند تصفح قائمة الطعام.',
        },
    ],
    en: [
        {
            title: '1. Delivery System',
            text: 'FeedYum is an online intermediary platform that connects restaurants and chefs with customers. Delivery service is provided and managed entirely by the restaurant or chef directly. FeedYum does not carry out delivery operations itself.',
        },
        {
            title: '2. Delivery Fees',
            text: 'Delivery fees are determined by each restaurant or chef individually based on the distance between their branch and the delivery address. Delivery fees are clearly displayed before order confirmation so the customer can review them.',
        },
        {
            title: '3. Service Fee',
            text: 'In addition to the delivery fee, a small service fee is charged to the customer by the platform. It is added to the order total and paid in cash to the chef along with the order — details are in the breakdown below.',
            isFeeSection: true,
        },
        {
            title: '4. Delivery Coverage',
            text: 'Each restaurant or chef has a specific delivery radius (in kilometers) set by them. Customers can only see restaurants and chefs available for delivery in their area.',
        },
        {
            title: '5. Estimated Delivery Time',
            text: 'Delivery time depends on the restaurant or chef and the distance. Estimated delivery time is provided upon order confirmation, but may vary depending on traffic conditions or order volume.',
        },
        {
            title: '6. Payment Method',
            text: 'Payment is made upon delivery (cash on delivery) directly to the restaurant or chef. The total = order subtotal + delivery fee + service fee. There is currently no online payment for orders through the platform.',
        },
        {
            title: '7. Delivery Address',
            text: 'The customer is responsible for providing a correct and accurate delivery address. In case of an incorrect or incomplete address, delivery may be delayed or fail, and FeedYum is not responsible for any delays resulting from this.',
        },
        {
            title: '8. Minimum Order Amount',
            text: 'Some restaurants and chefs may set a minimum order value for delivery service. The minimum amount (if applicable) is clearly displayed when browsing the food menu.',
        },
    ],
};

export default function DeliveryPolicyPage() {
    const [lang, setLang] = useLang();
    const isAr = lang === 'ar';
    const sections = isAr ? deliverySections.ar : deliverySections.en;
    const orderFee = feeConfig.CHEF_ORDER_FEE;
    const feeTiers = feeConfig.SERVICE_FEE_TIERS;

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} onLangChange={setLang} />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">{isAr ? 'سياسة التوصيل والشحن' : 'Delivery & Shipping Policy'}</h1>
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
