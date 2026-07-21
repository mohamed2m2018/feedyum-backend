'use client';

import { useState } from 'react';
import { Nav, Footer } from '../components/SharedComponents';
import FeeBreakdown from '../components/FeeBreakdown';

const getAboutContent = (orderFee) => ({
    ar: {
        title: 'نبذة عنا',
        subtitle: 'تعرف على FeedYum ورؤيتنا',
        sections: [
            {
                title: '🍽️ من نحن؟',
                text: 'FeedYum هي منصة إلكترونية (سوق إلكتروني) تربط بين الطباخين والمطاعم من جهة والعملاء من جهة أخرى. نوفر مساحة يقدر فيها كل شيف أو مطعم يعرض أطباقه ويوصلها للعملاء مباشرة، بينما نحن نسهل عملية الاكتشاف والطلب.',
            },
            {
                title: '🎯 رؤيتنا',
                text: 'نسعى لبناء أكبر مجتمع لعشاق الأكل في المنطقة، حيث يقدر أي طباخ موهوب أو مطعم يوصل أكله لأكبر عدد من الناس من خلال منصة سهلة وممتعة.',
            },
            {
                title: '⚙️ إزاي بنشتغل؟',
                text: `FeedYum منصة وساطة - العميل بيتصفح الأطباق والمطاعم على التطبيق، بيختار اللي عايزه، وبيطلب مباشرة من المطعم أو الطباخ. الدفع بيتم عند الاستلام (كاش) مباشرة للمطعم. FeedYum بتحصّل رسوم منصة ثابتة ${orderFee} ج.م لكل طلب من المطاعم والطباخين، بالإضافة إلى رسوم خدمة يتحملها العميل — التفاصيل في الجدول أدناه.`,
            },
            {
                title: '📱 مميزات المنصة',
                text: 'تصفح الأطباق من خلال فيديوهات قصيرة (Reels) - اكتشاف مطاعم وطباخين جدد قريبين منك - نظام تقييمات ومراجعات - متابعة الطباخين المفضلين - طلب مباشر مع تتبع حالة الطلب - قوائم طعام متكاملة مع صور وأسعار.',
            },
            {
                title: '🤝 للمطاعم والطباخين',
                text: 'FeedYum بتوفر للمطاعم والطباخين منصة لعرض أطباقهم وبناء قاعدة عملاء. كل مطعم أو طباخ يقدر ينشئ بروفايل خاص، يرفع قائمة الطعام، ينشر فيديوهات وقصص، ويستقبل طلبات مباشرة من العملاء.',
            },
        ],
    },
    en: {
        title: 'About Us',
        subtitle: 'Learn about FeedYum and our vision',
        sections: [
            {
                title: '🍽️ Who We Are',
                text: 'FeedYum is an online food marketplace that connects chefs and restaurants with customers. We provide a platform where every chef or restaurant can showcase their dishes and deliver them directly to customers, while we facilitate the discovery and ordering process.',
            },
            {
                title: '🎯 Our Vision',
                text: 'We aim to build the largest food lovers community in the region, where any talented chef or restaurant can reach the widest audience through an easy and enjoyable platform.',
            },
            {
                title: '⚙️ How It Works',
                text: `FeedYum is an intermediary platform – customers browse dishes and restaurants on the app, choose what they want, and order directly from the restaurant or chef. Payment is made upon delivery (cash on delivery) directly to the restaurant. FeedYum charges a fixed ${orderFee} EGP platform fee per order from restaurants and chefs, plus a service fee paid by the customer — see the breakdown below.`,
            },
            {
                title: '📱 Platform Features',
                text: 'Browse dishes through short videos (Reels) - Discover new nearby restaurants and chefs - Ratings and reviews system - Follow your favorite chefs - Direct ordering with order status tracking - Complete food menus with photos and prices.',
            },
            {
                title: '🤝 For Restaurants & Chefs',
                text: 'FeedYum provides restaurants and chefs with a platform to showcase their dishes and build a customer base. Each restaurant or chef can create a dedicated profile, upload their food menu, post videos and stories, and receive orders directly from customers.',
            },
        ],
    },
});

// Index of the "How It Works" section — fee breakdown is injected right after it
const FEE_SECTION_INDEX = 2;

export default function AboutContent({ orderFee, feeTiers = [] }) {
    const [lang, setLang] = useState('ar');
    const isAr = lang === 'ar';
    const aboutContent = getAboutContent(orderFee);
    const content = isAr ? aboutContent.ar : aboutContent.en;

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} onLangChange={setLang} />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">{content.title}</h1>
                        <p className="section-subtitle">{content.subtitle}</p>
                    </div>

                    <div dir={isAr ? 'rtl' : 'ltr'} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        {content.sections.map((s, i) => (
                            <div key={i}>
                                <div className="privacy-section">
                                    <h3>{s.title}</h3>
                                    <p>{s.text}</p>
                                </div>
                                {i === FEE_SECTION_INDEX && (
                                    <FeeBreakdown
                                        lang={lang}
                                        orderFee={orderFee}
                                        feeTiers={feeTiers}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
