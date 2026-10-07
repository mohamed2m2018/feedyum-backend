'use client';
import { useLang } from './components/useLang';
import { Nav, Footer, PlayStoreIcon, AppleIcon } from './components/SharedComponents';
import { Founders } from './components/Founders';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.feedyum';

const content = {
  en: {
    heroBadge: '🤖 AI-native · Live on Google Play',
    heroTitle: 'The AI-native food marketplace for the Middle East.',
    heroSubtitle: 'FeedYum uses AI to understand what you crave, in Arabic or English, and match you with home chefs and restaurants that can actually deliver it. Every dish, food reel and kitchen is indexed by AI the moment it is posted.',
    heroBtn: 'Try AI food search on Google Play',
    heroSecondary: 'How our AI works',
    heroScreenAlt: 'FeedYum app: AI-indexed food reels feed with a Visit Menu button',

    stats: [
      { value: '380+', label: 'dishes indexed by AI' },
      { value: '100%', label: 'of dishes, reels and kitchens AI-indexed on publish' },
      { value: '2', label: 'languages understood: Arabic and English' },
      { value: 'Live', label: 'AI semantic search in production' },
    ],

    aiTitle: 'AI at the heart of FeedYum',
    aiDesc: 'FeedYum is not a menu app with AI added on top. Discovery on FeedYum runs on AI: it reads meaning, not keywords, across every dish, reel and kitchen on the platform.',
    aiPoints: [
      { icon: '🧠', title: 'Semantic AI search', desc: 'Vector search across dishes, food reels and kitchens that matches what you mean, not just the words you typed.' },
      { icon: '⚡', title: 'Instant AI indexing', desc: 'Every new dish, reel and kitchen profile is turned into an AI embedding the moment it is posted, so it is searchable within seconds.' },
      { icon: '🗣️', title: 'Multilingual AI', desc: 'Multilingual AI models understand requests in Arabic and English, and menus are translated automatically between the two.' },
      { icon: '📍', title: 'Delivery-aware AI ranking', desc: 'Results are ranked so the dishes that can actually reach your location come first.' },
      { icon: '🔀', title: 'Hybrid retrieval', desc: 'AI semantic matching is combined with classic text search, so exact names and loose descriptions both find the right food.' },
      { icon: '🛟', title: 'Resilient AI stack', desc: 'Cloud embeddings with an on-device multilingual model as a fallback, so AI search keeps working even when a provider is down.' },
    ],

    pipelineTitle: 'How our AI works',
    pipelineSubtitle: 'From a chef pressing "publish" to a hungry customer finding the dish',
    pipeline: [
      { step: '01', title: 'Language detection', desc: 'Every new dish, reel and kitchen profile is analysed to detect whether it was written in Arabic or English.' },
      { step: '02', title: 'Automatic translation', desc: 'Dish names, descriptions and menu sections are translated automatically, so every item exists in both Arabic and English.' },
      { step: '03', title: 'AI embeddings', desc: 'The content is converted into a semantic vector with OpenAI text-embedding-3-large, with a multilingual E5 model as an on-device fallback.' },
      { step: '04', title: 'Vector index', desc: 'Embeddings are stored in a Pinecone vector database, ready for meaning-based search the moment the item is published.' },
      { step: '05', title: 'Hybrid AI search', desc: 'A customer\'s query is embedded the same way and matched by meaning, then blended with text search for exact names.' },
      { step: '06', title: 'Delivery-aware ranking', desc: 'Results are re-ranked by distance and delivery coverage, so the top results are food that can reach you tonight.' },
    ],

    examplesTitle: 'Search the way you talk',
    examplesSubtitle: 'Our AI understands meaning across Arabic and English. Some examples of what customers type:',
    examples: [
      { query: 'حاجة حراقة بالجبنة', meaning: 'Spicy, cheesy dishes, in any language they were written in' },
      { query: 'koshary / كشري', meaning: 'The same Egyptian classic, whichever script you search in' },
      { query: 'something light for dinner', meaning: 'Soups, salads and lighter dishes, even if they never say "light"' },
      { query: 'أكل بيتي', meaning: 'Home-style dishes from home chefs near you' },
    ],

    arabicTitle: 'AI built for Arabic first',
    arabicText: 'Most food platforms bolt English search onto Arabic menus. FeedYum is designed the other way round: every menu exists in Arabic and English, every query is understood by multilingual AI, and the same dish is found whether a customer types in Arabic script, English or a mix of both. That matters in Egypt, where people write menus and messages the way they speak.',

    screensTitle: 'Inside the app',
    screensSubtitle: 'Real screens from FeedYum on Android',
    screens: [
      { src: '/images/screens/feed.webp', caption: 'Food reels from local kitchens', alt: 'FeedYum app: food reels feed' },
      { src: '/images/screens/dish.webp', caption: 'Order from the dish page', alt: 'FeedYum app: dish page with Add to Cart' },
      { src: '/images/screens/search.webp', caption: 'AI search across dishes, kitchens & reels', alt: 'FeedYum app: AI search across dishes, kitchens and reels' },
      { src: '/images/screens/kitchen.webp', caption: 'Kitchen dashboard for chefs', alt: 'FeedYum app: kitchen dashboard for chefs' },
    ],

    visionTitle: 'Where our AI is going',
    visionText: 'Egypt\'s home cooks sell on WhatsApp but don\'t have time to write menus. We\'re building a Claude-powered AI agent that turns a chef\'s simple description of their food into a live storefront in 60 seconds, with Arabic and English descriptions, ingredients, allergens and AI-suggested prices. FeedYum is already live on Google Play with real chefs and orders, and our AI semantic search is in production.',

    roadmapTitle: 'Next on our AI roadmap',
    roadmapSubtitle: 'In development, built on Claude',
    roadmap: [
      { icon: '🤖', title: 'Full AI food assistant', desc: 'A conversational assistant in Egyptian Arabic and English: tell it what you crave, your budget and location, and it recommends real dishes, builds your cart and tracks your order.' },
      { icon: '🏪', title: 'AI storefront agent', desc: 'A chef describes their food in a message and the agent builds a ready-to-order storefront: dishes, descriptions, ingredients, allergens and suggested prices.' },
      { icon: '🛡️', title: 'Arabic AI moderation', desc: 'Keeps food videos and reviews safe and on-topic, in Egyptian Arabic and English.' },
    ],

    principlesTitle: 'Our AI principles',
    principles: [
      { icon: '👩‍🍳', title: 'Chefs stay in control', desc: 'AI suggests, chefs decide. Nothing AI-generated about a chef\'s food is published without the chef reviewing it.' },
      { icon: '🎯', title: 'Accuracy where it matters', desc: 'Prices, ingredients and allergens reach real customers, so we measure AI quality on exactly those fields.' },
      { icon: '🌍', title: 'Arabic first', desc: 'Our AI is designed and tested for Arabic and Egyptian everyday language, not translated from English as an afterthought.' },
    ],

    flowTitle: 'From craving to doorstep, guided by AI',
    flowGroups: [
      {
        icon: '😋',
        title: 'For food lovers',
        steps: [
          'Describe what you crave or scroll AI-indexed food reels from kitchens near you',
          'AI search surfaces dishes that match your meaning and can be delivered to you',
          'Order straight from the video, pay cash on delivery, then rate your meal',
        ],
      },
      {
        icon: '👨‍🍳',
        title: 'For chefs & restaurants',
        steps: [
          'Create your kitchen and upload your menu with photos and prices',
          'AI indexes every dish and reel instantly and translates your menu into Arabic and English',
          'Hungry customers find you through AI search; pay only 4 EGP per confirmed order',
        ],
      },
    ],

    creatorsTitle: 'Let AI bring customers to your kitchen',
    creatorsDesc: 'Every dish you post is indexed by AI and matched to people searching for food like yours, in Arabic or English. No subscription, no upfront cost: just 4 EGP per confirmed order.',
    creatorsBenefits: [
      'Your dishes and reels are AI-indexed the moment you post them',
      'Automatic Arabic and English menu translation',
      'AI search sends you customers who are looking for exactly what you cook',
      'Delivery-aware ranking shows you to people you can actually reach',
      'Kitchen dashboard with orders and analytics',
      'Only 4 EGP per confirmed order, with no monthly fees',
    ],
    creatorsBtn: 'Join as a chef',

    foundersTitle: 'Meet the founders',
    foundersSubtitle: 'The team building AI-native food commerce in Cairo',

    faqTitle: 'AI questions, answered',
    faqs: [
      { q: 'How does FeedYum use AI?', a: 'Every dish, reel and kitchen on FeedYum is indexed by AI when it is posted. Search understands what you mean in Arabic or English instead of matching exact words, menus are translated automatically, and results are ranked by delivery to your location.' },
      { q: 'Which AI models does FeedYum use?', a: 'Our semantic search uses OpenAI\'s text-embedding-3-large model with a multilingual E5 model running on our own servers as a fallback, and a Pinecone vector database. Our next AI features, the food assistant and storefront agent, are being built on Anthropic\'s Claude.' },
      { q: 'Does the AI understand Arabic?', a: 'Yes. Every menu exists in Arabic and English, and our multilingual AI matches the same dish whether you search in Arabic script, English or a mix of both.' },
      { q: 'Does AI decide what chefs publish?', a: 'No. AI indexes and translates what chefs publish, and future AI suggestions will always be reviewed by the chef before going live.' },
      { q: 'What is FeedYum?', a: 'FeedYum is an AI-native food-video marketplace in Egypt. You watch short videos from local chefs and restaurants and order the dishes you see directly in the app.' },
      { q: 'How do I pay?', a: 'Payment is cash on delivery, made directly to the chef or restaurant. A small service fee applies to each order; the full breakdown is on our About page.' },
      { q: 'What does it cost chefs and restaurants?', a: 'No subscription and no upfront cost. FeedYum charges a flat 4 EGP platform fee per confirmed order.' },
      { q: 'Who is behind FeedYum?', a: 'FeedYum is a product of Innovita Tech Ltd, a technology company registered in 2023 in Cairo, Egypt. FeedYum was co-founded by Mohamed Salaheldin and Mohamed Shoman.' },
    ],

    ctaTitle: 'Try AI food search',
    ctaDesc: 'Download FeedYum and describe what you crave. Our AI will find it.',
    storeLabel: 'Get it on',
    storeName: 'Google Play',
    storeSoon: 'Coming Soon',
    storeApple: 'App Store',
  },
  ar: {
    heroBadge: '🤖 قائم على الذكاء الاصطناعي · متاح على جوجل بلاي',
    heroTitle: 'سوق الأكل القائم على الذكاء الاصطناعي في الشرق الأوسط.',
    heroSubtitle: 'FeedYum بيستخدم الذكاء الاصطناعي عشان يفهم نفسك في إيه، بالعربي أو الإنجليزي، ويوصلك بشيفات ومطاعم يقدروا يوصلولك فعلاً. كل طبق وريل ومطبخ بيتفهرس بالذكاء الاصطناعي أول ما يتنشر.',
    heroBtn: 'جرّب البحث الذكي على جوجل بلاي',
    heroSecondary: 'إزاي الذكاء الاصطناعي بتاعنا بيشتغل',
    heroScreenAlt: 'تطبيق FeedYum: فيديوهات أكل مفهرسة بالذكاء الاصطناعي',

    stats: [
      { value: '+380', label: 'طبق متفهرس بالذكاء الاصطناعي' },
      { value: '100%', label: 'من الأطباق والريلز والمطابخ بتتفهرس أول ما تتنشر' },
      { value: '2', label: 'لغتين: عربي وإنجليزي' },
      { value: 'شغال', label: 'بحث ذكي بالذكاء الاصطناعي شغال فعلاً' },
    ],

    aiTitle: 'الذكاء الاصطناعي في قلب FeedYum',
    aiDesc: 'FeedYum مش تطبيق منيو متحط عليه ذكاء اصطناعي. الاكتشاف في FeedYum قائم على الذكاء الاصطناعي: بيفهم المعنى مش الكلمات بس، في كل طبق وريل ومطبخ على المنصة.',
    aiPoints: [
      { icon: '🧠', title: 'بحث بالمعنى بالذكاء الاصطناعي', desc: 'بحث متجهي في الأطباق والريلز والمطابخ بيفهم قصدك مش الكلمات اللي كتبتها بس.' },
      { icon: '⚡', title: 'فهرسة فورية بالذكاء الاصطناعي', desc: 'أي طبق أو ريل أو مطبخ جديد بيتحول لتمثيل ذكي أول ما يتنشر، فيبان في البحث خلال ثواني.' },
      { icon: '🗣️', title: 'ذكاء اصطناعي متعدد اللغات', desc: 'نماذج ذكاء اصطناعي بتفهم طلبك بالعربي والإنجليزي، والمنيو بيتترجم أوتوماتيك بين اللغتين.' },
      { icon: '📍', title: 'ترتيب ذكي حسب التوصيل', desc: 'النتايج مترتبة بحيث الأطباق اللي تقدر توصلك تظهر الأول.' },
      { icon: '🔀', title: 'بحث هجين', desc: 'الفهم بالمعنى متجمّع مع البحث العادي بالنص، فالأسامي بالظبط والوصف التقريبي الاتنين يوصلوك للأكل الصح.' },
      { icon: '🛟', title: 'منظومة ذكاء اصطناعي ثابتة', desc: 'تمثيلات من السحابة مع نموذج متعدد اللغات على سيرفراتنا كاحتياطي، فالبحث الذكي يفضل شغال حتى لو مزود وقع.' },
    ],

    pipelineTitle: 'إزاي الذكاء الاصطناعي بتاعنا بيشتغل',
    pipelineSubtitle: 'من أول ما الشيف يدوس "نشر" لحد ما الزبون الجعان يلاقي الطبق',
    pipeline: [
      { step: '01', title: 'اكتشاف اللغة', desc: 'كل طبق وريل وبروفايل مطبخ جديد بيتحلل عشان نعرف اتكتب بالعربي ولا بالإنجليزي.' },
      { step: '02', title: 'ترجمة أوتوماتيك', desc: 'أسامي الأطباق ووصفها وأقسام المنيو بتتترجم أوتوماتيك، فكل حاجة موجودة بالعربي والإنجليزي.' },
      { step: '03', title: 'تمثيلات بالذكاء الاصطناعي', desc: 'المحتوى بيتحول لمتجه دلالي بنموذج OpenAI text-embedding-3-large، ونموذج E5 متعدد اللغات على سيرفراتنا كاحتياطي.' },
      { step: '04', title: 'فهرس متجهي', desc: 'التمثيلات بتتخزن في قاعدة بيانات متجهية Pinecone، جاهزة للبحث بالمعنى أول ما الطبق يتنشر.' },
      { step: '05', title: 'بحث هجين بالذكاء الاصطناعي', desc: 'كلام الزبون بيتحول لتمثيل بنفس الطريقة ويتطابق بالمعنى، ومعاه بحث نصي للأسامي بالظبط.' },
      { step: '06', title: 'ترتيب حسب التوصيل', desc: 'النتايج بتترتب حسب المسافة ومنطقة التوصيل، فأول نتايج تكون أكل يقدر يوصلك النهارده.' },
    ],

    examplesTitle: 'دوّر بالطريقة اللي بتتكلم بيها',
    examplesSubtitle: 'الذكاء الاصطناعي بتاعنا بيفهم المعنى بالعربي والإنجليزي. أمثلة من اللي الناس بتكتبه:',
    examples: [
      { query: 'حاجة حراقة بالجبنة', meaning: 'أطباق حراقة بالجبنة، بأي لغة اتكتبت' },
      { query: 'koshary / كشري', meaning: 'نفس الأكلة المصرية، بأي حروف دوّرت' },
      { query: 'something light for dinner', meaning: 'شوربة وسلطات وأكل خفيف، حتى لو مكتوبش فيها "خفيف"' },
      { query: 'أكل بيتي', meaning: 'أكل بيتي من شيفات بيتيين قريبين منك' },
    ],

    arabicTitle: 'ذكاء اصطناعي معمول للعربي الأول',
    arabicText: 'أغلب منصات الأكل بتركّب بحث إنجليزي على منيو عربي. FeedYum متصمم بالعكس: كل منيو موجود بالعربي والإنجليزي، كل طلب بيفهمه ذكاء اصطناعي متعدد اللغات، ونفس الطبق بيظهر سواء الزبون كتب بالعربي أو الإنجليزي أو خليط. ده مهم في مصر، لأن الناس بتكتب المنيو والرسايل زي ما بتتكلم.',

    screensTitle: 'جوه التطبيق',
    screensSubtitle: 'لقطات حقيقية من FeedYum على أندرويد',
    screens: [
      { src: '/images/screens/feed.webp', caption: 'فيديوهات أكل من مطابخ قريبة', alt: 'تطبيق FeedYum: صفحة فيديوهات الأكل' },
      { src: '/images/screens/dish.webp', caption: 'اطلب من صفحة الطبق', alt: 'تطبيق FeedYum: صفحة الطبق مع زرار الإضافة للسلة' },
      { src: '/images/screens/search.webp', caption: 'بحث ذكي في الأطباق والمطابخ والريلز', alt: 'تطبيق FeedYum: البحث الذكي' },
      { src: '/images/screens/kitchen.webp', caption: 'لوحة تحكم المطبخ للشيفات', alt: 'تطبيق FeedYum: لوحة تحكم المطبخ' },
    ],

    visionTitle: 'رايحين فين بالذكاء الاصطناعي',
    visionText: 'الشيفات البيتيين في مصر بيبيعوا على واتساب ومعندهمش وقت يكتبوا منيو. بنبني وكيل ذكاء اصطناعي مبني على Claude بيحوّل وصف بسيط من الشيف لأكله لمتجر جاهز في ٦٠ ثانية، بوصف بالعربي والإنجليزي ومكونات ومسببات حساسية وأسعار مقترحة بالذكاء الاصطناعي. FeedYum شغال دلوقتي على جوجل بلاي بشيفات وطلبات حقيقية، والبحث الذكي بالذكاء الاصطناعي شغال فعلاً.',

    roadmapTitle: 'الجاي في خطة الذكاء الاصطناعي',
    roadmapSubtitle: 'جاري التطوير، مبني على Claude',
    roadmap: [
      { icon: '🤖', title: 'مساعد أكل كامل بالذكاء الاصطناعي', desc: 'مساعد بتكلمه بالعامية أو الإنجليزي: قوله نفسك في إيه وميزانيتك ومكانك، يرشحلك أطباق حقيقية، يملالك السلة ويتابع طلبك.' },
      { icon: '🏪', title: 'وكيل متجر بالذكاء الاصطناعي', desc: 'الشيف يوصف أكله في رسالة، والوكيل يعمله متجر جاهز للطلب: أطباق ووصف ومكونات ومسببات حساسية وأسعار مقترحة.' },
      { icon: '🛡️', title: 'مراجعة المحتوى بالعربي بالذكاء الاصطناعي', desc: 'بيحمي فيديوهات الأكل والتقييمات بالعامية المصرية والإنجليزي.' },
    ],

    principlesTitle: 'مبادئنا في الذكاء الاصطناعي',
    principles: [
      { icon: '👩‍🍳', title: 'الشيف هو اللي بيقرر', desc: 'الذكاء الاصطناعي بيقترح والشيف بيقرر. مفيش حاجة متولدة بالذكاء الاصطناعي عن أكل الشيف بتتنشر من غير ما يراجعها.' },
      { icon: '🎯', title: 'الدقة في المهم', desc: 'الأسعار والمكونات ومسببات الحساسية بتوصل لزباين حقيقيين، فبنقيس جودة الذكاء الاصطناعي على الحاجات دي بالظبط.' },
      { icon: '🌍', title: 'العربي الأول', desc: 'الذكاء الاصطناعي بتاعنا متصمم ومتجرب للعربي واللغة المصرية اليومية، مش مترجم من الإنجليزي في الآخر.' },
    ],

    flowTitle: 'من النفس للباب، والذكاء الاصطناعي معاك',
    flowGroups: [
      {
        icon: '😋',
        title: 'لعشاق الأكل',
        steps: [
          'اوصف نفسك في إيه أو اتفرج على ريلز مفهرسة بالذكاء الاصطناعي من مطابخ قريبة',
          'البحث الذكي يطلعلك أطباق تطابق قصدك وتقدر توصلك',
          'اطلب من الفيديو على طول، ادفع كاش عند الاستلام، وقيّم وجبتك',
        ],
      },
      {
        icon: '👨‍🍳',
        title: 'للشيفات والمطاعم',
        steps: [
          'اعمل مطبخك وارفع المنيو بالصور والأسعار',
          'الذكاء الاصطناعي بيفهرس كل طبق وريل فوراً ويترجم المنيو عربي وإنجليزي',
          'الزباين يلاقوك من البحث الذكي، وتدفع ٤ ج.م بس لكل طلب مؤكد',
        ],
      },
    ],

    creatorsTitle: 'خلي الذكاء الاصطناعي يجيبلك زباين',
    creatorsDesc: 'كل طبق بتنشره بيتفهرس بالذكاء الاصطناعي ويتطابق مع الناس اللي بتدور على أكل زي أكلك، بالعربي أو الإنجليزي. مفيش اشتراك ولا تكلفة مقدماً: بس ٤ ج.م لكل طلب مؤكد.',
    creatorsBenefits: [
      'أطباقك وريلزك بتتفهرس بالذكاء الاصطناعي أول ما تنشرها',
      'ترجمة المنيو أوتوماتيك عربي وإنجليزي',
      'البحث الذكي بيبعتلك زباين بيدوروا على اللي بتطبخه بالظبط',
      'ترتيب حسب التوصيل بيظهرك للناس اللي تقدر توصلهم',
      'لوحة تحكم للمطبخ بالطلبات والإحصائيات',
      '٤ ج.م بس لكل طلب مؤكد، ومفيش اشتراك شهري',
    ],
    creatorsBtn: 'انضم كشيف',

    foundersTitle: 'تعرف على المؤسسين',
    foundersSubtitle: 'الفريق اللي بيبني تجارة أكل قائمة على الذكاء الاصطناعي من القاهرة',

    faqTitle: 'أسئلة عن الذكاء الاصطناعي',
    faqs: [
      { q: 'FeedYum بيستخدم الذكاء الاصطناعي إزاي؟', a: 'كل طبق وريل ومطبخ على FeedYum بيتفهرس بالذكاء الاصطناعي أول ما يتنشر. البحث بيفهم قصدك بالعربي أو الإنجليزي بدل ما يدور على نفس الكلمات، والمنيو بيتترجم أوتوماتيك، والنتايج مترتبة حسب التوصيل لمكانك.' },
      { q: 'FeedYum بيستخدم أنهي نماذج ذكاء اصطناعي؟', a: 'البحث الدلالي بيستخدم نموذج OpenAI text-embedding-3-large مع نموذج E5 متعدد اللغات على سيرفراتنا كاحتياطي، وقاعدة بيانات متجهية Pinecone. ومميزاتنا الجاية، مساعد الأكل ووكيل المتجر، بتتبني على Claude من Anthropic.' },
      { q: 'الذكاء الاصطناعي بيفهم عربي؟', a: 'أيوه. كل منيو موجود بالعربي والإنجليزي، والذكاء الاصطناعي متعدد اللغات بيلاقي نفس الطبق سواء دورت بالعربي أو الإنجليزي أو خليط.' },
      { q: 'الذكاء الاصطناعي بيقرر الشيف ينشر إيه؟', a: 'لأ. الذكاء الاصطناعي بيفهرس ويترجم اللي الشيف بينشره، وأي اقتراحات ذكاء اصطناعي جاية لازم الشيف يراجعها قبل ما تتنشر.' },
      { q: 'يعني إيه FeedYum؟', a: 'FeedYum سوق أكل بالفيديو قائم على الذكاء الاصطناعي في مصر. بتتفرج على فيديوهات قصيرة من شيفات ومطاعم محلية وتطلب الأطباق اللي بتشوفها من التطبيق مباشرة.' },
      { q: 'الدفع بيتم إزاي؟', a: 'الدفع كاش عند الاستلام مباشرة للشيف أو المطعم. فيه رسوم خدمة بسيطة على كل طلب، والتفاصيل كاملة في صفحة "نبذة عنا".' },
      { q: 'الشيفات والمطاعم بيدفعوا كام؟', a: 'مفيش اشتراك ولا أي تكلفة مقدماً. FeedYum بياخد رسوم منصة ثابتة ٤ ج.م لكل طلب مؤكد.' },
      { q: 'مين ورا FeedYum؟', a: 'FeedYum منتج من Innovita Tech Ltd، شركة تكنولوجيا مسجلة سنة ٢٠٢٣ في القاهرة، مصر. أسسه محمد صلاح الدين ومحمد شومان.' },
    ],

    ctaTitle: 'جرّب البحث الذكي',
    ctaDesc: 'حمل FeedYum واوصف نفسك في إيه، والذكاء الاصطناعي هيلاقيه.',
    storeLabel: 'حمل من',
    storeName: 'جوجل بلاي',
    storeSoon: 'قريباً',
    storeApple: 'آب ستور',
  },
};

function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}

function CardGrid({ items, cardClassName = 'feature-card' }) {
  return (
    <div className="features-grid">
      {items.map((item) => (
        <div className={cardClassName} key={item.title}>
          <div className="feature-icon">{item.icon}</div>
          <h3 className="feature-title">{item.title}</h3>
          <p className="feature-description">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

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
                <a href={PLAY_STORE_URL} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  <PlayStoreIcon />
                  {t.heroBtn}
                </a>
                <a href="#how-ai-works" className="btn btn-secondary">{t.heroSecondary}</a>
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

      {/* AI stats */}
      <section className="ai-stats">
        <div className="container">
          <div className="stats-grid">
            {t.stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI at the heart */}
      <section className="features" id="features">
        <div className="container">
          <SectionHeader title={t.aiTitle} subtitle={t.aiDesc} />
          <CardGrid items={t.aiPoints} />
        </div>
      </section>

      {/* How our AI works */}
      <section className="creators" id="how-ai-works">
        <div className="container">
          <SectionHeader title={t.pipelineTitle} subtitle={t.pipelineSubtitle} />
          <ol className="pipeline">
            {t.pipeline.map((p) => (
              <li className="pipeline-step" key={p.step}>
                <span className="pipeline-num">{p.step}</span>
                <div>
                  <h3 className="feature-title">{p.title}</h3>
                  <p className="feature-description">{p.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Search examples */}
      <section className="features" id="ai-search">
        <div className="container">
          <SectionHeader title={t.examplesTitle} subtitle={t.examplesSubtitle} />
          <div className="examples-list">
            {t.examples.map((e) => (
              <div className="example-row" key={e.query}>
                <code className="example-query">{e.query}</code>
                <span className="example-arrow" aria-hidden="true">→</span>
                <span className="example-meaning">{e.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arabic first */}
      <section className="features" id="arabic-ai">
        <div className="container">
          <div className="section-header vision-text">
            <h2 className="section-title">{t.arabicTitle}</h2>
            <p className="section-subtitle">{t.arabicText}</p>
          </div>
        </div>
      </section>

      {/* App screens */}
      <section className="features" id="app-screens">
        <div className="container">
          <SectionHeader title={t.screensTitle} subtitle={t.screensSubtitle} />
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

      {/* AI vision */}
      <section className="creators" id="ai-vision">
        <div className="container">
          <div className="section-header vision-text">
            <h2 className="section-title">{t.visionTitle}</h2>
            <p className="section-subtitle">{t.visionText}</p>
          </div>
        </div>
      </section>

      {/* AI roadmap */}
      <section className="features" id="roadmap">
        <div className="container">
          <SectionHeader title={t.roadmapTitle} subtitle={t.roadmapSubtitle} />
          <CardGrid items={t.roadmap} cardClassName="feature-card roadmap-card" />
        </div>
      </section>

      {/* AI principles */}
      <section className="features" id="ai-principles">
        <div className="container">
          <SectionHeader title={t.principlesTitle} />
          <CardGrid items={t.principles} />
        </div>
      </section>

      {/* Craving to doorstep */}
      <section className="features" id="how-it-works">
        <div className="container">
          <SectionHeader title={t.flowTitle} />
          <div className="how-grid">
            {t.flowGroups.map((g) => (
              <div className="feature-card" key={g.title}>
                <div className="feature-icon">{g.icon}</div>
                <h3 className="feature-title">{g.title}</h3>
                <ol className="how-steps">
                  {g.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
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
                {t.creatorsBenefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div style={{ marginTop: '32px' }}>
                <a href="/join/" className="btn btn-primary">{t.creatorsBtn}</a>
              </div>
            </div>
            <div className="creators-visual">
              <figure className="screen-card">
                <img src="/images/screens/kitchen.webp" alt={t.screens[3].alt} loading="lazy" />
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="features" id="founders">
        <div className="container">
          <SectionHeader title={t.foundersTitle} subtitle={t.foundersSubtitle} />
          <Founders lang={lang} />
        </div>
      </section>

      {/* FAQ */}
      <section className="features" id="faq">
        <div className="container">
          <SectionHeader title={t.faqTitle} />
          <div className="faq-list">
            {t.faqs.map((f) => (
              <details className="faq-item" key={f.q}>
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
              <a href={PLAY_STORE_URL} className="store-btn" target="_blank" rel="noopener noreferrer">
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
