'use client';
import { useState } from 'react';
import { Nav, Footer, PlayStoreIcon, AppleIcon } from './components/SharedComponents';

const content = {
  ar: {
    heroBadge: '🎉 متاح الآن على جوجل بلاي!',
    heroTitle: 'اكتشف. اطلب. شارك رحلتك مع الأكل.',
    heroSubtitle: 'FeedYum هي المنصة المثالية لعشاق الأكل! شاهد فيديوهات شهية، اطلب مباشرة من الشيفات والمطاعم، وشارك تقييماتك الصادقة.',
    heroBtn: 'حمل من جوجل بلاي',
    heroSecondary: 'اعرف أكتر',
    sectionTitle: 'ليه FeedYum؟',
    sectionSubtitle: 'استمتع بمحتوى الأكل بطريقة مختلفة تماماً',
    features: [
      { icon: '📱', title: 'شاهد واكتشف', desc: 'تصفح فيديوهات لا نهائية من شيفات محليين ومطاعم. اكتشف وجبتك المفضلة القادمة!' },
      { icon: '🛒', title: 'اطلب مباشرة', desc: 'شفت حاجة لذيذة؟ اطلبها من الفيديو مباشرة! مش محتاج تروح تطبيق تاني.' },
      { icon: '⭐', title: 'شارك تقييمك', desc: 'قيم طلباتك وشارك فيديوهات تقييم. ساعد غيرك يكتشفوا أحسن أكل في منطقتك.' },
      { icon: '👨‍🍳', title: 'ادعم المحلي', desc: 'تواصل مباشرة مع الشيفات المحليين. ادعم المشاريع الصغيرة في مجتمعك.' },
      { icon: '🔥', title: 'الترند', desc: 'اعرف إيه الترند في منطقتك. متفوتش أي محتوى أكل فايرل.' },
      { icon: '💬', title: 'مجتمع', desc: 'انضم لمجتمع متزايد من عشاق الأكل. اتكلم وتابع وتفاعل مع الفوديز.' },
    ],
    creatorsTitle: 'أنت شيف أو مطعم؟',
    creatorsDesc: 'انضم لـ FeedYum واعرض إبداعاتك لآلاف العشاق. احنا بنروج لأطباقك مجاناً!',
    creatorsBenefits: ['ترويج مجاني لأطباقك', 'طلبات مباشرة من الفيديوهات', 'ابني براندك في الأكل', 'تواصل مع زباين محليين', 'تحليلات وإحصائيات'],
    creatorsBtn: 'تواصل معنا',
    creatorsHighlights: [
      { icon: '🎥', title: 'فيديوهات قصيرة', desc: 'اعرض أطباقك بفيديوهات جذابة' },
      { icon: '📦', title: 'طلبات مباشرة', desc: 'استقبل طلبات من الفيديو' },
      { icon: '📊', title: 'تحليلات', desc: 'تابع أداء محتواك' },
      { icon: '🔔', title: 'إشعارات', desc: 'تنبيهات فورية للطلبات' },
    ],

    ctaTitle: 'مستعد تستكشف؟',
    ctaDesc: 'حمل FeedYum دلوقتي وابدأ رحلتك اللذيذة!',
    storeLabel: 'حمل من',
    storeName: 'جوجل بلاي',
    storeSoon: 'قريباً',
    storeApple: 'آب ستور',
  },
  en: {
    heroBadge: '🎉 Now available on Google Play!',
    heroTitle: 'Discover. Order. Share your food journey.',
    heroSubtitle: 'FeedYum is the ultimate platform for food lovers! Watch mouthwatering videos, order directly from chefs and restaurants, and share your honest reviews.',
    heroBtn: 'Download on Google Play',
    heroSecondary: 'Learn More',
    sectionTitle: 'Why FeedYum?',
    sectionSubtitle: 'Enjoy food content like never before',
    features: [
      { icon: '📱', title: 'Watch & Discover', desc: 'Browse endless videos from local chefs and restaurants. Discover your next favorite meal!' },
      { icon: '🛒', title: 'Order Directly', desc: 'Saw something delicious? Order it right from the video! No need to switch apps.' },
      { icon: '⭐', title: 'Share Reviews', desc: 'Rate your orders and share review videos. Help others discover the best food in your area.' },
      { icon: '👨‍🍳', title: 'Support Local', desc: 'Connect directly with local chefs. Support small businesses in your community.' },
      { icon: '🔥', title: 'Trending', desc: 'Find out what\'s trending in your area. Never miss viral food content.' },
      { icon: '💬', title: 'Community', desc: 'Join a growing community of food lovers. Chat, follow, and engage with fellow foodies.' },
    ],
    creatorsTitle: 'Are you a chef or restaurant?',
    creatorsDesc: 'Join FeedYum and showcase your creations to thousands of food lovers. We promote your dishes for free!',
    creatorsBenefits: ['Free promotion for your dishes', 'Direct orders from videos', 'Build your food brand', 'Connect with local customers', 'Analytics & insights'],
    creatorsBtn: 'Contact Us',
    creatorsHighlights: [
      { icon: '🎥', title: 'Short Videos', desc: 'Showcase your dishes with engaging videos' },
      { icon: '📦', title: 'Direct Orders', desc: 'Receive orders from your videos' },
      { icon: '📊', title: 'Analytics', desc: 'Track your content performance' },
      { icon: '🔔', title: 'Notifications', desc: 'Instant alerts for orders' },
    ],

    ctaTitle: 'Ready to explore?',
    ctaDesc: 'Download FeedYum now and start your delicious journey!',
    storeLabel: 'Get it on',
    storeName: 'Google Play',
    storeSoon: 'Coming Soon',
    storeApple: 'App Store',
  },
};

export default function Home() {
  const [lang, setLang] = useState('ar');
  const isAr = lang === 'ar';
  const t = content[lang];

  return (
    <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
      <div className="animated-bg" />
      <Nav lang={lang} onLangChange={setLang} />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span>{t.heroBadge}</span>
              </div>
              <h1 className="hero-title">{t.heroTitle}</h1>
              <p className="hero-subtitle">{t.heroSubtitle}</p>
              <div className="hero-buttons">
                <a href="https://play.google.com/store/apps/details?id=com.feedyum" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  <PlayStoreIcon />
                  {t.heroBtn}
                </a>
                <a href="#features" className="btn btn-secondary">{t.heroSecondary}</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <span style={{ fontSize: '4rem' }}>🍽️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.sectionTitle}</h2>
            <p className="section-subtitle">{t.sectionSubtitle}</p>
          </div>
          <div className="features-grid">
            {t.features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-description">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creators */}
      <section className="creators" id="creators">
        <div className="container">
          <div className="creators-content">
            <div className="creators-text">
              <h2>{t.creatorsTitle}</h2>
              <p>{t.creatorsDesc}</p>
              <ul className="creators-benefits">
                {t.creatorsBenefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <div style={{ marginTop: '32px' }}>
                <a href="https://www.facebook.com/FeedYum" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  {t.creatorsBtn}
                </a>
              </div>
            </div>
            <div className="creators-visual">
              {t.creatorsHighlights.map((h, i) => (
                <div className="creator-highlight" key={i}>
                  <div className="highlight-icon">{h.icon}</div>
                  <div className="highlight-title">{h.title}</div>
                  <div className="highlight-desc">{h.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="cta" id="download">
        <div className="container">
          <div className="cta-content">
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaDesc}</p>
            <div className="cta-buttons">
              <a href="https://play.google.com/store/apps/details?id=com.feedyum" className="store-btn" target="_blank" rel="noopener noreferrer">
                <PlayStoreIcon />
                <span>
                  <div className="small">{t.storeLabel}</div>
                  <div className="large">{t.storeName}</div>
                </span>
              </a>
              <a href="#" className="store-btn disabled">
                <AppleIcon />
                <span>
                  <div className="small">{t.storeSoon}</div>
                  <div className="large">{t.storeApple}</div>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
