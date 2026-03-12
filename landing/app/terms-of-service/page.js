'use client';

import { useState } from 'react';
import { Nav, Footer } from '../components/SharedComponents';

const termsSections = {
    ar: [
        {
            title: '١. مقدمة',
            text: 'مرحبًا بك في FeedYum. باستخدامك لتطبيق FeedYum أو موقعنا الإلكتروني، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام التطبيق أو الموقع.',
        },
        {
            title: '٢. تعريف الخدمة',
            text: 'FeedYum هو تطبيق ومنصة إلكترونية تربط العملاء بالمطاعم والطباخين المنزليين. نحن نعمل كوسيط تقني لتسهيل عملية طلب وتوصيل الطعام. FeedYum ليست مطعمًا ولا تقوم بتحضير أو طهي أي أطعمة بنفسها.',
        },
        {
            title: '٣. حساب المستخدم',
            text: 'يجب أن يكون عمرك ١٣ عامًا أو أكثر لاستخدام التطبيق. أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور الخاصة بك. أنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك. يجب عليك إخطارنا فورًا في حالة أي استخدام غير مصرح به لحسابك.',
        },
        {
            title: '٤. الطلبات والدفع',
            text: 'عند تقديم طلب عبر FeedYum، فإنك تدخل في اتفاقية مباشرة مع المطعم أو الطباخ. الأسعار المعروضة يتم تحديدها من قبل المطعم أو الطباخ وقد تتغير دون إشعار مسبق. يتم الدفع عند الاستلام (كاش) أو عبر بوابة الدفع الإلكتروني حسب الطريقة المتاحة. FeedYum غير مسؤولة عن أي أخطاء في الأسعار من قبل المطعم.',
        },
        {
            title: '٥. الإلغاء والاسترداد',
            text: 'تخضع عمليات الإلغاء والاسترداد لسياسة الاسترداد والإلغاء الخاصة بنا المنشورة على الموقع. يمكن إلغاء الطلب مجانًا قبل تأكيد المطعم. بعد التأكيد، قد لا يكون الإلغاء ممكنًا. يرجى مراجعة سياسة الاسترداد والإلغاء للتفاصيل الكاملة.',
        },
        {
            title: '٦. مسؤولية المطاعم والطباخين',
            text: 'المطاعم والطباخون المسجلون على المنصة هم المسؤولون عن جودة وسلامة الطعام المقدم، والامتثال لجميع القوانين واللوائح المحلية المتعلقة بتحضير وبيع الطعام، ودقة المعلومات المعروضة في قوائمهم بما في ذلك المكونات والمواد المسببة للحساسية.',
        },
        {
            title: '٧. حدود المسؤولية',
            text: 'FeedYum تعمل كوسيط تقني فقط. لا نتحمل أي مسؤولية عن جودة الطعام أو سلامته، أو تأخر التوصيل أو عدم إتمامه، أو أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدام التطبيق، أو أي نزاعات بين العملاء والمطاعم أو الطباخين. نحن نبذل قصارى جهدنا لتوفير منصة موثوقة ولكن لا نقدم أي ضمانات بخصوص توفر الخدمة بشكل مستمر دون انقطاع.',
        },
        {
            title: '٨. الملكية الفكرية',
            text: 'جميع المحتويات المتاحة على التطبيق والموقع، بما في ذلك العلامات التجارية والشعارات والتصميمات والنصوص والرسومات، هي ملكية حصرية لـ FeedYum أو مرخصيها. لا يجوز لك نسخ أو تعديل أو توزيع أو استخدام أي من هذه المحتويات دون إذن كتابي مسبق.',
        },
        {
            title: '٩. السلوك المحظور',
            text: 'يُحظر عليك استخدام التطبيق لأي أغراض غير قانونية أو غير مصرح بها. يشمل ذلك على سبيل المثال لا الحصر: إساءة استخدام التطبيق أو التلاعب بالنظام، أو انتحال شخصية مستخدم آخر، أو إنشاء حسابات متعددة بقصد الاحتيال، أو مضايقة المطاعم أو الطباخين أو المستخدمين الآخرين.',
        },
        {
            title: '١٠. إنهاء الحساب',
            text: 'يحق لـ FeedYum إنهاء أو تعليق حسابك في أي وقت ودون إشعار مسبق إذا انتهكت أي من هذه الشروط أو إذا رأينا أن ذلك ضروري لحماية المنصة أو المستخدمين الآخرين. يمكنك أيضًا حذف حسابك في أي وقت من خلال التطبيق.',
        },
        {
            title: '١١. التعديلات على الشروط',
            text: 'تحتفظ FeedYum بالحق في تعديل هذه الشروط والأحكام في أي وقت. سنقوم بإخطارك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد نشر التعديلات يعني موافقتك على الشروط المحدثة.',
        },
        {
            title: '١٢. القانون الواجب التطبيق',
            text: 'تخضع هذه الشروط والأحكام لقوانين جمهورية مصر العربية وتفسر وفقًا لها. أي نزاع ينشأ عن أو يتعلق بهذه الشروط يخضع للولاية القضائية الحصرية للمحاكم المصرية المختصة.',
        },
        {
            title: '١٣. التواصل معنا',
            text: 'إذا كان لديك أي أسئلة أو استفسارات بخصوص هذه الشروط والأحكام، يرجى التواصل معنا عبر البريد الإلكتروني support@feedyum.com أو عبر صفحة "تواصل معنا" على الموقع.',
        },
    ],
    en: [
        {
            title: '1. Introduction',
            text: 'Welcome to FeedYum. By using the FeedYum application or our website, you agree to be bound by these Terms of Service. Please read them carefully before using our services. If you do not agree to any of these terms, please do not use the app or website.',
        },
        {
            title: '2. Service Definition',
            text: 'FeedYum is an application and online platform that connects customers with restaurants and home chefs. We operate as a technology intermediary to facilitate food ordering and delivery. FeedYum is not a restaurant and does not prepare or cook any food itself.',
        },
        {
            title: '3. User Account',
            text: 'You must be 13 years of age or older to use the app. You are responsible for maintaining the confidentiality of your account information and password. You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.',
        },
        {
            title: '4. Orders and Payment',
            text: 'When placing an order through FeedYum, you enter into a direct agreement with the restaurant or chef. Prices displayed are set by the restaurant or chef and may change without prior notice. Payment is made upon delivery (cash on delivery) or through the electronic payment gateway depending on available methods. FeedYum is not responsible for any pricing errors by the restaurant.',
        },
        {
            title: '5. Cancellation and Refunds',
            text: 'Cancellations and refunds are subject to our Refund & Cancellation Policy published on our website. Orders can be cancelled for free before restaurant confirmation. After confirmation, cancellation may not be possible. Please refer to our Refund & Cancellation Policy for full details.',
        },
        {
            title: '6. Responsibility of Restaurants and Chefs',
            text: 'Restaurants and chefs registered on the platform are responsible for the quality and safety of food provided, compliance with all local laws and regulations relating to food preparation and sale, and the accuracy of information displayed in their menus including ingredients and allergens.',
        },
        {
            title: '7. Limitation of Liability',
            text: 'FeedYum operates as a technology intermediary only. We are not liable for food quality or safety, delivery delays or non-completion, any direct or indirect losses resulting from the use of the app, or any disputes between customers and restaurants or chefs. We strive to provide a reliable platform but make no guarantees regarding continuous and uninterrupted service availability.',
        },
        {
            title: '8. Intellectual Property',
            text: 'All content available on the app and website, including trademarks, logos, designs, text, and graphics, are the exclusive property of FeedYum or its licensors. You may not copy, modify, distribute, or use any of this content without prior written permission.',
        },
        {
            title: '9. Prohibited Conduct',
            text: 'You are prohibited from using the app for any unlawful or unauthorized purposes. This includes, but is not limited to: misusing the app or manipulating the system, impersonating another user, creating multiple accounts with fraudulent intent, or harassing restaurants, chefs, or other users.',
        },
        {
            title: '10. Account Termination',
            text: 'FeedYum reserves the right to terminate or suspend your account at any time without prior notice if you violate any of these terms or if we deem it necessary to protect the platform or other users. You may also delete your account at any time through the app.',
        },
        {
            title: '11. Changes to Terms',
            text: 'FeedYum reserves the right to modify these Terms of Service at any time. We will notify you of any material changes through the app or email. Your continued use of the app after posting modifications constitutes your acceptance of the updated terms.',
        },
        {
            title: '12. Governing Law',
            text: 'These Terms of Service are governed by and construed in accordance with the laws of the Arab Republic of Egypt. Any dispute arising out of or relating to these terms is subject to the exclusive jurisdiction of the competent Egyptian courts.',
        },
        {
            title: '13. Contact Us',
            text: 'If you have any questions or inquiries regarding these Terms of Service, please contact us at support@feedyum.com or through the "Contact Us" page on our website.',
        },
    ],
};

export default function TermsOfServicePage() {
    const [lang, setLang] = useState('ar');
    const isAr = lang === 'ar';
    const sections = isAr ? termsSections.ar : termsSections.en;

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} onLangChange={setLang} />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">{isAr ? 'الشروط والأحكام' : 'Terms of Service'}</h1>
                    </div>

                    <div dir={isAr ? 'rtl' : 'ltr'} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {sections.map((s, i) => (
                            <div className="privacy-section" key={i}>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'var(--light-muted)', fontSize: '0.85rem' }}>
                        <p>{isAr ? 'آخر تحديث: مارس ٢٠٢٦' : 'Last updated: March 2026'}</p>
                        <p>{isAr ? 'تواصل معنا: ' : 'Contact us: '}<a href="mailto:support@feedyum.com" style={{ color: 'var(--primary)' }}>support@feedyum.com</a></p>
                    </div>
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
