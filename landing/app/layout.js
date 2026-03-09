import './globals.css';

export const metadata = {
  title: 'FeedYum - اكتشف محتوى الأكل | منصة فيديو للأكل',
  description: 'FeedYum هي منصة فيديو لعشاق الأكل. شاهد فيديوهات الأكل، اطلب مباشرة من الشيفات والمطاعم، وشارك تقييماتك. حمل التطبيق مجاناً!',
  authors: [{ name: 'FeedYum' }],
  keywords: 'FeedYum,تطبيق أكل,فيديوهات أكل,طلب أكل,مطاعم,شيفات,تقييم أكل,food app,food videos,order food,restaurants,chefs,food reviews,TikTok for food,فود يم,فيد يم',
  creator: 'FeedYum',
  publisher: 'FeedYum',
  robots: 'index, follow',
  category: 'Food & Drink',
  metadataBase: new URL('https://feedyum.com'),
  alternates: {
    canonical: '/',
    languages: { 'ar-EG': '/', 'en-US': '/?lang=en' },
  },
  openGraph: {
    title: 'FeedYum - اكتشف محتوى الأكل',
    description: 'FeedYum هي منصة فيديو لعشاق الأكل! شاهد واطلب وقيم الأكل من شيفات ومطاعم.',
    url: 'https://feedyum.com/',
    siteName: 'FeedYum',
    locale: 'ar_EG',
    images: [{ url: '/images/logo.png', width: 512, height: 512, alt: 'FeedYum Logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@feedyum',
    title: 'FeedYum - اكتشف محتوى الأكل',
    description: 'FeedYum منصة فيديو لعشاق الأكل! شاهد واطلب وقيم الأكل.',
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

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/images/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://feedyum.com/#website',
                  url: 'https://feedyum.com',
                  name: 'FeedYum',
                  description: 'منصة فيديو لعشاق الأكل - شاهد واطلب وقيم',
                  inLanguage: ['ar-EG', 'en-US'],
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://feedyum.com/#organization',
                  name: 'FeedYum',
                  url: 'https://feedyum.com',
                  logo: { '@type': 'ImageObject', url: 'https://feedyum.com/images/logo.png' },
                  sameAs: ['https://www.facebook.com/FeedYum', 'https://instagram.com/feedyum.app'],
                },
                {
                  '@type': 'MobileApplication',
                  '@id': 'https://feedyum.com/#app',
                  name: 'FeedYum',
                  operatingSystem: 'Android',
                  applicationCategory: 'FoodEstablishmentReservation',
                  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                  downloadUrl: 'https://play.google.com/store/apps/details?id=com.feedyum',
                },
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
