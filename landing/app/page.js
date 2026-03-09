import { Nav, Footer, PlayStoreIcon, AppleIcon } from './components/SharedComponents';

export default function Home() {
  return (
    <div className="rtl" style={{ direction: 'rtl', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
      <div className="animated-bg" />
      <Nav lang="ar" />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <span>🎉 متاح الآن على جوجل بلاي!</span>
              </div>
              <h1 className="hero-title">اكتشف. اطلب. شارك رحلتك مع الأكل.</h1>
              <p className="hero-subtitle">
                FeedYum هي المنصة المثالية لعشاق الأكل! شاهد فيديوهات شهية، اطلب مباشرة من الشيفات والمطاعم، وشارك تقييماتك الصادقة.
              </p>
              <div className="hero-buttons">
                <a href="https://play.google.com/store/apps/details?id=com.feedyum" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  <PlayStoreIcon />
                  حمل من جوجل بلاي
                </a>
                <a href="#features" className="btn btn-secondary">اعرف أكتر</a>
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
            <h2 className="section-title">ليه FeedYum؟</h2>
            <p className="section-subtitle">استمتع بمحتوى الأكل بطريقة مختلفة تماماً</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '📱', title: 'شاهد واكتشف', desc: 'تصفح فيديوهات لا نهائية من شيفات محليين ومطاعم. اكتشف وجبتك المفضلة القادمة!' },
              { icon: '🛒', title: 'اطلب مباشرة', desc: 'شفت حاجة لذيذة؟ اطلبها من الفيديو مباشرة! مش محتاج تروح تطبيق تاني.' },
              { icon: '⭐', title: 'شارك تقييمك', desc: 'قيم طلباتك وشارك فيديوهات تقييم. ساعد غيرك يكتشفوا أحسن أكل في منطقتك.' },
              { icon: '👨‍🍳', title: 'ادعم المحلي', desc: 'تواصل مباشرة مع الشيفات المحليين. ادعم المشاريع الصغيرة في مجتمعك.' },
              { icon: '🔥', title: 'الترند', desc: 'اعرف إيه الترند في منطقتك. متفوتش أي محتوى أكل فايرل.' },
              { icon: '💬', title: 'مجتمع', desc: 'انضم لمجتمع متزايد من عشاق الأكل. اتكلم وتابع وتفاعل مع الفوديز.' },
            ].map((f, i) => (
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
              <h2>أنت شيف أو مطعم؟</h2>
              <p>انضم لـ FeedYum واعرض إبداعاتك لآلاف العشاق. احنا بنروج لأطباقك مجاناً!</p>
              <ul className="creators-benefits">
                <li>ترويج مجاني لأطباقك</li>
                <li>طلبات مباشرة من الفيديوهات</li>
                <li>ابني براندك في الأكل</li>
                <li>تواصل مع زباين محليين</li>
                <li>تحليلات وإحصائيات</li>
              </ul>
              <div style={{ marginTop: '32px' }}>
                <a href="https://www.facebook.com/FeedYum" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  تواصل معنا
                </a>
              </div>
            </div>
            <div className="creators-visual">
              {[
                { icon: '🎥', title: 'فيديوهات قصيرة', desc: 'اعرض أطباقك بفيديوهات جذابة' },
                { icon: '📦', title: 'طلبات مباشرة', desc: 'استقبل طلبات من الفيديو' },
                { icon: '📊', title: 'تحليلات', desc: 'تابع أداء محتواك' },
                { icon: '🔔', title: 'إشعارات', desc: 'تنبيهات فورية للطلبات' },
              ].map((h, i) => (
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

      {/* Note */}
      <section className="note-section">
        <div className="container">
          <div className="note-card">
            <div className="note-icon">📌</div>
            <div className="note-content">
              <h3>ملاحظة مهمة</h3>
              <p>بعض حسابات المطاعم والشيفات تعتبر حسابات غير رسمية تعلن عن أطباقك مجاناً. لجعلها حسابات رسمية والحصول على التحكم الكامل فيها برجاء التواصل معنا.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="download">
        <div className="container">
          <div className="cta-content">
            <h2>مستعد تستكشف؟</h2>
            <p>حمل FeedYum دلوقتي وابدأ رحلتك اللذيذة!</p>
            <div className="cta-buttons">
              <a href="https://play.google.com/store/apps/details?id=com.feedyum" className="store-btn" target="_blank" rel="noopener noreferrer">
                <PlayStoreIcon />
                <span>
                  <div className="small">حمل من</div>
                  <div className="large">جوجل بلاي</div>
                </span>
              </a>
              <a href="#" className="store-btn disabled">
                <AppleIcon />
                <span>
                  <div className="small">قريباً</div>
                  <div className="large">آب ستور</div>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer lang="ar" />
    </div>
  );
}
