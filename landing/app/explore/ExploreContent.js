'use client';

import { useLang } from '../components/useLang';
import { Nav, Footer, PlayStoreIcon } from '../components/SharedComponents';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.feedyum';

const content = {
    en: {
        title: 'Explore FeedYum kitchens',
        subtitle: 'Real home chefs and restaurants on FeedYum, with some of their dishes. Open the app to see their videos and order.',
        dishes: (n) => `${n} dishes`,
        price: (p) => `${p} EGP`,
        order: 'Order in the app',
        more: (n) => `+${n} more dishes in the app`,
        empty: 'Open the FeedYum app to explore kitchens near you.',
        getApp: 'Get FeedYum on Google Play',
        joinTitle: 'Cook something people love?',
        joinBtn: 'Join as a chef',
    },
    ar: {
        title: 'استكشف مطابخ FeedYum',
        subtitle: 'شيفات بيتيين ومطاعم حقيقية على FeedYum، مع شوية من أطباقهم. افتح التطبيق تشوف فيديوهاتهم وتطلب.',
        dishes: (n) => `${n} طبق`,
        price: (p) => `${p} ج.م`,
        order: 'اطلب من التطبيق',
        more: (n) => `+${n} طبق كمان في التطبيق`,
        empty: 'افتح تطبيق FeedYum واستكشف المطابخ القريبة منك.',
        getApp: 'حمل FeedYum من جوجل بلاي',
        joinTitle: 'بتطبخ أكل الناس بتحبه؟',
        joinBtn: 'انضم كشيف',
    },
};

export default function ExploreContent({ kitchens }) {
    const [lang, setLang] = useLang();
    const isAr = lang === 'ar';
    const t = content[lang];

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} onLangChange={setLang} />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">{t.title}</h1>
                        <p className="section-subtitle">{t.subtitle}</p>
                    </div>

                    {kitchens.length === 0 && <p className="explore-empty">{t.empty}</p>}

                    {kitchens.map((kitchen) => (
                        <article className="kitchen" key={kitchen.id} id={`kitchen-${kitchen.id}`}>
                            <header className="kitchen-header">
                                {kitchen.avatar ? (
                                    <img className="kitchen-avatar" src={kitchen.avatar} alt={kitchen.name} loading="lazy" />
                                ) : (
                                    <div className="kitchen-avatar kitchen-avatar-empty" aria-hidden="true">👨‍🍳</div>
                                )}
                                <div>
                                    <h2 className="kitchen-name">{kitchen.name}</h2>
                                    <div className="kitchen-meta">{t.dishes(kitchen.dishCount)}</div>
                                </div>
                            </header>

                            <div className="dish-grid">
                                {kitchen.dishes.map((dish) => {
                                    const name = (isAr ? dish.nameAr : dish.nameEn) || dish.nameEn || dish.nameAr;
                                    return (
                                        <a className="dish-card" key={dish.id} href={`/dish/${dish.id}`}>
                                            {dish.image ? (
                                                <img className="dish-image" src={dish.image} alt={name} loading="lazy" />
                                            ) : (
                                                <div className="dish-image dish-image-empty" aria-hidden="true">🍽️</div>
                                            )}
                                            <div className="dish-body">
                                                <div className="dish-name">{name}</div>
                                                {typeof dish.price === 'number' && <div className="dish-price">{t.price(dish.price)}</div>}
                                                <div className="dish-order">{t.order}</div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>

                            {kitchen.dishCount > kitchen.dishes.length && (
                                <p className="kitchen-more">{t.more(kitchen.dishCount - kitchen.dishes.length)}</p>
                            )}
                        </article>
                    ))}

                    <div className="explore-cta">
                        <a href={PLAY_STORE_URL} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                            <PlayStoreIcon />
                            {t.getApp}
                        </a>
                        <div className="explore-join">
                            <span>{t.joinTitle}</span>
                            <a href="/join/" className="btn btn-secondary">{t.joinBtn}</a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
