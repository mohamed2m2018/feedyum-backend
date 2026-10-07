import ExploreContent from './ExploreContent';

const API_BASE = process.env.FEEDYUM_API_URL || 'https://feedyum.com';
const DISHES_PER_CHEF = 12;

export const metadata = {
    title: 'Explore Kitchens | FeedYum',
    description: 'Browse the home chefs and restaurants on FeedYum and some of their dishes. Order in the FeedYum app.',
    alternates: { canonical: '/explore/' },
};

// Fetched at build time so the static page ships real chefs and dishes.
// If the API is unreachable the page still builds and shows the app CTA.
async function loadKitchens() {
    try {
        const res = await fetch(`${API_BASE}/api/dishes?limit=1000&page=1`, {
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) return [];
        const body = await res.json();
        return groupByChef(body?.data?.dishes || []);
    } catch (error) {
        console.warn('[explore] Could not load dishes at build time:', error.message);
        return [];
    }
}

function groupByChef(dishes) {
    const chefs = new Map();
    for (const dish of dishes) {
        const chef = dish.chef;
        if (dish.visible === false || !chef?._id || !chef.fullName) continue;
        if (!chefs.has(chef._id)) {
            chefs.set(chef._id, { id: chef._id, name: chef.fullName.trim(), avatar: chef.avatar || null, dishes: [] });
        }
        chefs.get(chef._id).dishes.push({
            id: dish._id,
            nameEn: (dish.nameEnglish || dish.name || '').trim(),
            nameAr: (dish.nameArabic || dish.name || '').trim(),
            price: dish.price,
            image: dish.image || null,
        });
    }

    return [...chefs.values()]
        .map((chef) => {
            // Dishes with photos first, then keep a short preview per kitchen.
            const sorted = [...chef.dishes].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)));
            return {
                ...chef,
                dishCount: chef.dishes.length,
                dishes: sorted.slice(0, DISHES_PER_CHEF),
                photoCount: chef.dishes.filter((d) => d.image).length,
            };
        })
        .sort((a, b) => b.photoCount - a.photoCount || b.dishCount - a.dishCount);
}

export default async function ExplorePage() {
    const kitchens = await loadKitchens();
    return <ExploreContent kitchens={kitchens} />;
}
