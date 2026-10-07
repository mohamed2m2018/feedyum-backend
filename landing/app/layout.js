import './globals.css';

const SITE_URL = 'https://feedyum.com';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.feedyum';
const LINKEDIN_URL = 'https://www.linkedin.com/company/feedyum';

const companyAddress = {
  '@type': 'PostalAddress',
  streetAddress: '6 Mohamed Tawfik Diab St.',
  addressLocality: 'Nasr City',
  addressRegion: 'Cairo',
  addressCountry: 'EG',
};

export const metadata = {
  title: 'FeedYum - Food Reels & Ordering in Egypt | فيد يم',
  description: 'FeedYum is an AI-powered food-video marketplace in Egypt: AI search across dishes, reels and kitchens in Arabic and English, and ordering straight from the video. A product of Innovita Tech Ltd, Cairo.',
  authors: [{ name: 'FeedYum' }],
  keywords: 'FeedYum,food app,food videos,order food,home chefs,restaurants,food reviews,Egypt,Cairo,TikTok for food,تطبيق أكل,فيديوهات أكل,طلب أكل,مطاعم,شيفات,فود يم,فيد يم',
  creator: 'FeedYum',
  publisher: 'Innovita Tech Ltd',
  robots: 'index, follow',
  category: 'Food & Drink',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: { 'en-US': '/', 'ar-EG': '/?lang=ar' },
  },
  openGraph: {
    title: 'FeedYum - Food Reels & Ordering',
    description: 'Watch food videos from local chefs and restaurants in Egypt and order straight from the video.',
    url: `${SITE_URL}/`,
    siteName: 'FeedYum',
    locale: 'en_US',
    alternateLocale: ['ar_EG'],
    images: [{ url: '/images/logo.png', width: 512, height: 512, alt: 'FeedYum Logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@feedyum',
    title: 'FeedYum - Food Reels & Ordering',
    description: 'Watch food videos from local chefs and restaurants in Egypt and order straight from the video.',
    images: ['/images/logo.png'],
  },
  other: {
    'al:android:package': 'com.feedyum',
    'al:android:app_name': 'FeedYum',
    'theme-color': '#FF4D67',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
    shortcut: '/images/logo.png',
  },
  manifest: '/manifest.json',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'FeedYum',
      description: 'Food-video marketplace in Egypt: watch, order and review food from local chefs and restaurants.',
      inLanguage: ['en-US', 'ar-EG'],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'FeedYum',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
      description: 'FeedYum is a food-video marketplace in Egypt where people watch short videos from local chefs and restaurants and order directly from the video.',
      email: 'mohamed.salah@feedyum.com',
      telephone: '+20 109 253 2376',
      address: companyAddress,
      areaServed: { '@type': 'Country', name: 'Egypt' },
      founder: [
        {
          '@type': 'Person',
          name: 'Mohamed Salaheldin',
          jobTitle: 'Co-founder',
          email: 'mohamed.salah@feedyum.com',
          sameAs: ['https://www.linkedin.com/in/muhammad-salah-eldin/'],
        },
        {
          '@type': 'Person',
          name: 'Mohamed Shoman',
          jobTitle: 'Co-founder',
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: 'Ain Shams University, Faculty of Engineering',
          },
        },
      ],
      parentOrganization: {
        '@type': 'Organization',
        name: 'Innovita Tech Ltd',
        foundingDate: '2023',
        address: companyAddress,
      },
      sameAs: [
        LINKEDIN_URL,
        'https://www.facebook.com/FeedYum',
        'https://instagram.com/feedyum.app',
        PLAY_STORE_URL,
      ],
    },
    {
      '@type': 'MobileApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'FeedYum: Food Reels & Ordering',
      operatingSystem: 'Android',
      applicationCategory: 'LifestyleApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' },
      downloadUrl: PLAY_STORE_URL,
      publisher: { '@type': 'Organization', name: 'Innovita Tech Ltd' },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/images/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
