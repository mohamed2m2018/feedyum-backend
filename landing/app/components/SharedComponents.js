import Link from 'next/link';

const PlayStoreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
);

const AppleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
);

const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const InstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

export function Nav({ lang = 'ar', onLangChange }) {
    const isAr = lang === 'ar';
    const handleToggle = () => {
        if (onLangChange) onLangChange(isAr ? 'en' : 'ar');
    };
    return (
        <nav className="nav">
            <div className="container nav-content">
                <Link href="/" className="logo">
                    <img src="/images/logo.png" alt="FeedYum" />
                    <span>FeedYum</span>
                </Link>
                <div className="nav-right">
                    <ul className="nav-links">
                        <li><a href="/#features">{isAr ? 'المميزات' : 'Features'}</a></li>
                        <li><a href="/#creators">{isAr ? 'للشيفات' : 'For Chefs'}</a></li>
                        <li><Link href="/about">{isAr ? 'عنّا' : 'About'}</Link></li>
                        <li><Link href="/contact">{isAr ? 'تواصل معنا' : 'Contact'}</Link></li>
                    </ul>
                    <button className="lang-switch" aria-label="Switch language" onClick={handleToggle}>
                        {isAr ? '🇬🇧 EN' : '🇪🇬 عربي'}
                    </button>
                </div>
                <div className="mobile-nav">
                    <button className="lang-switch" aria-label="Switch language" onClick={handleToggle}>
                        {isAr ? '🇬🇧' : '🇪🇬'}
                    </button>
                </div>
            </div>
        </nav>
    );
}

export function Footer({ lang = 'ar' }) {
    const isAr = lang === 'ar';
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <Link href="/" className="footer-logo">
                        <img src="/images/logo.png" alt="FeedYum" />
                        <span>FeedYum</span>
                    </Link>
                    <div className="footer-links">
                        <Link href="/about">{isAr ? 'نبذة عنا' : 'About Us'}</Link>
                        <Link href="/delivery-policy">{isAr ? 'سياسة التوصيل' : 'Delivery Policy'}</Link>
                        <Link href="/refund-policy">{isAr ? 'سياسة الاسترداد' : 'Refund Policy'}</Link>
                        <Link href="/privacy-policy">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
                        <Link href="/terms-of-service">{isAr ? 'الشروط والأحكام' : 'Terms of Service'}</Link>
                        <Link href="/contact">{isAr ? 'تواصل معنا' : 'Contact Us'}</Link>
                        <Link href="/delete-account">{isAr ? 'حذف الحساب' : 'Delete Account'}</Link>
                    </div>
                    <div className="social-links">
                        <a href="https://www.facebook.com/FeedYum" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <FacebookIcon />
                        </a>
                        <a href="https://instagram.com/feedyum.app" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <InstagramIcon />
                        </a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 FeedYum. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
                </div>
            </div>
        </footer>
    );
}

export { PlayStoreIcon, AppleIcon };
