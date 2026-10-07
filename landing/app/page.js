'use client';
import { useLang } from './components/useLang';
import { Nav, Footer, PlayStoreIcon, AppleIcon } from './components/SharedComponents';
import { Founders } from './components/Founders';

const content = {
  ar: {
    heroBadge: '🎉 متاح الآن على جوجل بلاي!',
    heroTitle: 'اكتشف. اطلب. شارك رحلتك مع الأكل.',
    heroSubtitle: 'FeedYum سوق أكل قائم على الذكاء الاصطناعي للشرق الأوسط: اتفرج على ريلز من شيفات ومطاعم قريبة منك، اوصف الأكلة اللي نفسك فيها والذكاء الاصطناعي يلاقيهالك، واطلب من الفيديو على طول.',
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
    creatorsDesc: 'انضم لـ FeedYum واعرض إبداعاتك لآلاف العشاق. رسوم منصة بسيطة ٤ ج.م لكل طلب مؤكد فقط — بدون رسوم اشتراك شهرية!',
    creatorsBenefits: ['ترويج مجاني لأطباقك على التطبيق', 'طلبات مباشرة من الفيديوهات', 'ابني براندك في الأكل', 'تواصل مع زباين محليين', 'تحليلات وإحصائيات', 'رسوم منصة ٤ ج.م فقط لكل طلب — ومفيش اشتراك شهري'],
    creatorsBtn: 'انضم كشيف',
    creatorsHighlights: [
      { icon: '🎥', title: 'فيديوهات قصيرة', desc: 'اعرض أطباقك بفيديوهات جذابة' },
      { icon: '📦', title: 'طلبات مباشرة', desc: 'استقبل طلبات من الفيديو' },
      { icon: '📊', title: 'تحليلات', desc: 'تابع أداء محتواك' },
      { icon: '💰', title: '٤ ج.م لكل طلب', desc: 'رسوم منصة شفافة وبسيطة، بدون اشتراك شهري' },
    ],

    ctaTitle: 'مستعد تستكشف؟',
    ctaDesc: 'حمل FeedYum دلوقتي وابدأ رحلتك اللذيذة!',
    storeLabel: 'حمل من',
    storeName: 'جوجل بلاي',
    storeSoon: 'قريباً',
    storeApple: 'آب ستور',

    heroScreenAlt: 'تطبيق FeedYum: فيديوهات أكل مع زرار "شوف المنيو"',
    screensTitle: 'جوه التطبيق',
    screensSubtitle: 'لقطات حقيقية من FeedYum على أندرويد',
    screens: [
      { src: '/images/screens/feed.webp', caption: 'فيديوهات الأكل', alt: 'تطبيق FeedYum: صفحة فيديوهات الأكل' },
      { src: '/images/screens/dish.webp', caption: 'اطلب من صفحة الطبق', alt: 'تطبيق FeedYum: صفحة الطبق مع زرار الإضافة للسلة' },
      { src: '/images/screens/search.webp', caption: 'دوّر على أطباق ومطابخ وريلز', alt: 'تطبيق FeedYum: البحث في الأطباق والمطابخ والريلز' },
      { src: '/images/screens/kitchen.webp', caption: 'لوحة تحكم المطبخ للشيفات', alt: 'تطبيق FeedYum: لوحة تحكم المطبخ للشيفات' },
    ],

    howTitle: 'إزاي FeedYum بيشتغل؟',
    howSubtitle: 'من نفسك في أكلة لحد باب بيتك في ٣ خطوات',
    howGroups: [
      {
        icon: '😋',
        title: 'لعشاق الأكل',
        steps: [
          'اتفرج على فيديوهات قصيرة من شيفات ومطاعم قريبة منك',
          'دوس "اطلب" على أي طبق عجبك — من الفيديو على طول',
          'ادفع كاش عند الاستلام، وبعدها قيّم وجبتك',
        ],
      },
      {
        icon: '👨‍🍳',
        title: 'للشيفات والمطاعم',
        steps: [
          'اعمل بروفايلك وارفع المنيو بالصور والأسعار',
          'انشر ريلز وستوريز لأطباقك وهي بتتعمل',
          'استقبل الطلبات مباشرة — وادفع ٤ ج.م بس لكل طلب مؤكد',
        ],
      },
    ],

    aiTitle: 'الذكاء الاصطناعي في قلب FeedYum',
    aiDesc: 'FeedYum شغال ببحث ذكي بيفهم المعنى مش الكلمات بس. اوصف الأكلة اللي نفسك فيها بالعربي أو الإنجليزي، زي "حاجة حراقة بالجبنة" أو "spicy koshary"، وهو يلاقيلك الأطباق والريلز والمطابخ المناسبة، ومترتبة حسب اللي يقدر يوصلك فعلاً.',
    aiPoints: [
      { icon: '🧠', title: 'بحث بالمعنى', desc: 'بحث بالذكاء الاصطناعي في الأطباق والريلز والمطابخ بيفهم قصدك مش الكلمات بس' },
      { icon: '⚡', title: 'فهرسة فورية بالذكاء الاصطناعي', desc: 'أي طبق أو ريل أو مطبخ جديد بيتفهرس بالذكاء الاصطناعي أول ما يتنشر، فيبان في البحث على طول' },
      { icon: '🗣️', title: 'عربي وإنجليزي', desc: 'نماذج ذكاء اصطناعي متعددة اللغات بتفهم طلبك باللغتين، والمنيو بيتترجم أوتوماتيك' },
      { icon: '📍', title: 'ترتيب حسب التوصيل', desc: 'النتايج مترتبة حسب اللي يقدر يوصل لمكانك' },
    ],
    agentBadge: 'جاري التطوير',
    agentTitle: 'صوّر فيديو واحد. خُد متجر جاهز في ٦٠ ثانية.',
    agentDesc: 'الشيفات البيتيين في مصر بيبيعوا على واتساب وفيسبوك ومعندهمش وقت يكتبوا منيو. وكيل الذكاء الاصطناعي بتاعنا المبني على Claude بيتفرج على فيديو الطبخ ويعمل متجر جاهز للطلب أوتوماتيك.',
    agentPoints: [
      { icon: '👁️', title: 'التعرف على الطبق بالذكاء الاصطناعي', desc: 'بيعرف الطبق من الفيديو وصوت الشيف' },
      { icon: '✍️', title: 'وصف بالعربي والإنجليزي', desc: 'بيكتب وصف شهي للمنيو بالعامية المصرية والإنجليزي' },
      { icon: '🥗', title: 'المكونات ومسببات الحساسية', desc: 'بيكتب مكونات الطبق وينبه على مسببات الحساسية المعروفة' },
      { icon: '💰', title: 'تسعير بالذكاء الاصطناعي', desc: 'بيقترح سعر على أساس أطباق مشابهة في المنطقة' },
    ],
    roadmapTitle: 'الجاي',
    roadmapSubtitle: 'اللي بنبنيه فوق أساس الذكاء الاصطناعي بتاعنا',
    roadmap: [
      { icon: '🤖', title: 'مساعد أكل كامل بالذكاء الاصطناعي', desc: 'مساعد بتكلمه بالعامية أو الإنجليزي: قوله نفسك في إيه وميزانيتك ومكانك، يرشحلك أطباق حقيقية، يملالك السلة ويتابع طلبك' },
      { icon: '🛡️', title: 'مراجعة المحتوى بالعربي', desc: 'حماية الفيديوهات والتقييمات بالعامية المصرية والإنجليزي' },
    ],

    foundersTitle: 'تعرف على المؤسسين',
    foundersSubtitle: 'الفريق اللي بيبني FeedYum من القاهرة',

    faqTitle: 'أسئلة شائعة',
    faqs: [
      { q: 'يعني إيه FeedYum؟', a: 'FeedYum سوق أكل بالفيديو في مصر. بتتفرج على فيديوهات قصيرة من شيفات ومطاعم محلية وتطلب الأطباق اللي بتشوفها من التطبيق مباشرة.' },
      { q: 'الدفع بيتم إزاي؟', a: 'الدفع كاش عند الاستلام مباشرة للشيف أو المطعم. فيه رسوم خدمة بسيطة على كل طلب، والتفاصيل كاملة في صفحة "نبذة عنا".' },
      { q: 'الشيفات والمطاعم بيدفعوا كام؟', a: 'مفيش اشتراك ولا أي تكلفة مقدماً. FeedYum بياخد رسوم منصة ثابتة ٤ ج.م لكل طلب مؤكد.' },
      { q: 'أنزل التطبيق منين؟', a: 'FeedYum متاح دلوقتي على جوجل بلاي، ونسخة الآيفون قريباً.' },
      { q: 'FeedYum بيستخدم الذكاء الاصطناعي إزاي؟', a: 'كل طبق وريل ومطبخ على FeedYum بيتفهرس بالذكاء الاصطناعي أول ما يتنشر، فالبحث بيفهم قصدك بالعربي أو الإنجليزي بدل ما يدور على نفس الكلمات بالظبط. والمنيو بيتترجم أوتوماتيك، والنتايج مترتبة حسب التوصيل لمكانك.' },
      { q: 'مين ورا FeedYum؟', a: 'FeedYum منتج من Innovita Tech Ltd، شركة تكنولوجيا مسجلة سنة ٢٠٢٣ في القاهرة، مصر. أسسه محمد صلاح الدين ومحمد شومان.' },
    ],
  },
  en: {
    heroBadge: '🎉 Now available on Google Play!',
    heroTitle: 'Discover. Order. Share your food journey.',
    heroSubtitle: 'FeedYum is an AI-native food marketplace for the Middle East: watch reels from local chefs and restaurants, describe what you crave and let AI find it, then order straight from the video.',
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
    creatorsDesc: 'Join FeedYum and showcase your creations to thousands of food lovers. Just 4 EGP per confirmed order — no monthly subscription!',
    creatorsBenefits: ['Free promotion for your dishes on the app', 'Direct orders from videos', 'Build your food brand', 'Connect with local customers', 'Analytics & insights', 'Only 4 EGP per order — zero monthly fees'],
    creatorsBtn: 'Join as a chef',
    creatorsHighlights: [
      { icon: '🎥', title: 'Short Videos', desc: 'Showcase your dishes with engaging videos' },
      { icon: '📦', title: 'Direct Orders', desc: 'Receive orders from your videos' },
      { icon: '📊', title: 'Analytics', desc: 'Track your content performance' },
      { icon: '💰', title: '4 EGP per order', desc: 'Simple transparent fee, no monthly subscription' },
    ],

    ctaTitle: 'Ready to explore?',
    ctaDesc: 'Download FeedYum now and start your delicious journey!',
    storeLabel: 'Get it on',
    storeName: 'Google Play',
    storeSoon: 'Coming Soon',
    storeApple: 'App Store',

    heroScreenAlt: 'FeedYum app: food reels feed with a Visit Menu button',
    screensTitle: 'Inside the app',
    screensSubtitle: 'Real screens from FeedYum on Android',
    screens: [
      { src: '/images/screens/feed.webp', caption: 'Food reels feed', alt: 'FeedYum app: food reels feed' },
      { src: '/images/screens/dish.webp', caption: 'Order from the dish page', alt: 'FeedYum app: dish page with Add to Cart' },
      { src: '/images/screens/search.webp', caption: 'Search dishes, kitchens & reels', alt: 'FeedYum app: search across dishes, kitchens and reels' },
      { src: '/images/screens/kitchen.webp', caption: 'Kitchen dashboard for chefs', alt: 'FeedYum app: kitchen dashboard for chefs' },
    ],

    howTitle: 'How FeedYum works',
    howSubtitle: 'From a craving to your door in three steps',
    howGroups: [
      {
        icon: '😋',
        title: 'For food lovers',
        steps: [
          'Watch short videos from home chefs and restaurants near you',
          'Tap Order on any dish you like, straight from the video',
          'Pay cash on delivery, then rate and review your meal',
        ],
      },
      {
        icon: '👨‍🍳',
        title: 'For chefs & restaurants',
        steps: [
          'Create your profile and upload your menu with photos and prices',
          'Post reels and stories that show your dishes being made',
          'Receive orders directly and pay only 4 EGP per confirmed order',
        ],
      },
    ],

    aiTitle: 'AI at the heart of FeedYum',
    aiDesc: 'FeedYum runs on AI search that understands meaning, not just keywords. Describe a craving in Arabic or English, like "something spicy with cheese" or "كشري حار", and it finds the right dishes, reels and kitchens, ranked by what can actually be delivered to you.',
    aiPoints: [
      { icon: '🧠', title: 'Semantic search', desc: 'AI search across dishes, food reels and kitchens that matches meaning, not just keywords' },
      { icon: '⚡', title: 'Instant AI indexing', desc: 'Every new dish, reel and kitchen profile is embedded by AI the moment it is posted, so it is discoverable right away' },
      { icon: '🗣️', title: 'Arabic & English', desc: 'Multilingual AI models understand requests in both languages, and menus are translated automatically' },
      { icon: '📍', title: 'Delivery-aware ranking', desc: 'Results are ranked by what can actually reach your location' },
    ],
    agentBadge: 'In development',
    agentTitle: 'Film one video. Get a live storefront in 60 seconds.',
    agentDesc: 'Egypt\'s home cooks sell on WhatsApp and Facebook but don\'t have time to write menus. Our Claude-powered AI agent watches a chef\'s cooking video and builds a ready-to-order storefront automatically.',
    agentPoints: [
      { icon: '👁️', title: 'AI dish recognition', desc: 'Identifies the dish from the video frames and the chef\'s voice' },
      { icon: '✍️', title: 'Arabic & English descriptions', desc: 'Writes appetizing menu copy in Egyptian Arabic and English' },
      { icon: '🥗', title: 'Ingredients & allergens', desc: 'Lists what goes into the dish and flags common allergens' },
      { icon: '💰', title: 'AI pricing', desc: 'Suggests a price based on similar dishes in the area' },
    ],
    roadmapTitle: 'Coming next',
    roadmapSubtitle: 'What we are building on top of our AI foundation',
    roadmap: [
      { icon: '🤖', title: 'Full AI food assistant', desc: 'A conversational assistant in Egyptian Arabic and English: tell it what you crave, your budget and location, and it recommends real dishes, builds your cart and tracks your order' },
      { icon: '🛡️', title: 'Arabic content moderation', desc: 'Keep videos and reviews safe and on-topic, in Egyptian Arabic and English' },
    ],

    foundersTitle: 'Meet the founders',
    foundersSubtitle: 'The team building FeedYum in Cairo',

    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'What is FeedYum?', a: 'FeedYum is a food-video marketplace in Egypt. You watch short videos from local chefs and restaurants and order the dishes you see directly in the app.' },
      { q: 'How do I pay?', a: 'Payment is cash on delivery, made directly to the chef or restaurant. A small service fee applies to each order; the full breakdown is on our About page.' },
      { q: 'What does it cost chefs and restaurants?', a: 'No subscription and no upfront cost. FeedYum charges a flat 4 EGP platform fee per confirmed order.' },
      { q: 'Where can I get the app?', a: 'FeedYum is available now on Google Play. The iOS version is coming soon.' },
      { q: 'How does FeedYum use AI?', a: 'Every dish, reel and kitchen on FeedYum is indexed by AI when it is posted, so search understands what you mean in Arabic or English instead of matching exact words. Menus are translated automatically, and results are ranked by delivery to your location.' },
      { q: 'Who is behind FeedYum?', a: 'FeedYum is a product of Innovita Tech Ltd, a technology company registered in 2023 in Cairo, Egypt. FeedYum was co-founded by Mohamed Salaheldin and Mohamed Shoman.' },
    ],
  },
};

export default function Home() {
  const [lang, setLang] = useLang();
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
                  <img className="phone-screen-img" src="/images/screens/feed.webp" alt={t.heroScreenAlt} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App screens */}
      <section className="features" id="app-screens">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.screensTitle}</h2>
            <p className="section-subtitle">{t.screensSubtitle}</p>
          </div>
          <div className="screens-row">
            {t.screens.map((s) => (
              <figure className="screen-card" key={s.src}>
                <img src={s.src} alt={s.alt} loading="lazy" />
                <figcaption>{s.caption}</figcaption>
              </figure>
            ))}
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

      {/* How it works */}
      <section className="features" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.howTitle}</h2>
            <p className="section-subtitle">{t.howSubtitle}</p>
          </div>
          <div className="how-grid">
            {t.howGroups.map((g, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{g.icon}</div>
                <h3 className="feature-title">{g.title}</h3>
                <ol className="how-steps">
                  {g.steps.map((step, j) => (
                    <li key={j}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI search */}
      <section className="features" id="ai-search">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.aiTitle}</h2>
            <p className="section-subtitle">{t.aiDesc}</p>
          </div>
          <div className="features-grid">
            {t.aiPoints.map((p, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{p.icon}</div>
                <h3 className="feature-title">{p.title}</h3>
                <p className="feature-description">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI storefront agent */}
      <section className="creators" id="ai-agent">
        <div className="container">
          <div className="section-header">
            <div className="hero-badge"><span>🤖 {t.agentBadge}</span></div>
            <h2 className="section-title">{t.agentTitle}</h2>
            <p className="section-subtitle">{t.agentDesc}</p>
          </div>
          <div className="features-grid">
            {t.agentPoints.map((a, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{a.icon}</div>
                <h3 className="feature-title">{a.title}</h3>
                <p className="feature-description">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="features" id="roadmap">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.roadmapTitle}</h2>
            <p className="section-subtitle">{t.roadmapSubtitle}</p>
          </div>
          <div className="features-grid">
            {t.roadmap.map((r, i) => (
              <div className="feature-card roadmap-card" key={i}>
                <div className="feature-icon">{r.icon}</div>
                <h3 className="feature-title">{r.title}</h3>
                <p className="feature-description">{r.desc}</p>
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
                <a href="/join/" className="btn btn-primary">
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



      {/* Founders */}
      <section className="features" id="founders">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.foundersTitle}</h2>
            <p className="section-subtitle">{t.foundersSubtitle}</p>
          </div>
          <Founders lang={lang} />
        </div>
      </section>

      {/* FAQ */}
      <section className="features" id="faq">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.faqTitle}</h2>
          </div>
          <div className="faq-list">
            {t.faqs.map((f, i) => (
              <details className="faq-item" key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
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
