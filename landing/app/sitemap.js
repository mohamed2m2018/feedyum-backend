export const dynamic = 'force-static';

const SITE_URL = 'https://feedyum.com';
const ROUTES = ['/', '/explore/', '/join/', '/about/', '/contact/', '/privacy-policy/', '/terms-of-service/', '/delivery-policy/', '/refund-policy/'];

export default function sitemap() {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
