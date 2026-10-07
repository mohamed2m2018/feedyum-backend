'use client';

import { useLang } from '../components/useLang';
import { Nav, Footer, COMPANY } from '../components/SharedComponents';

const contactContent = {
    ar: {
        title: 'تواصل معنا',
        subtitle: 'نحن هنا لمساعدتك! تواصل معنا بأي طريقة تناسبك',
        phone: {
            label: '📞 رقم الهاتف',
            value: '01092532376',
            displayValue: '٠١٠٩٢٥٣٢٣٧٦',
        },
        email: {
            label: '📧 البريد الإلكتروني',
            value: 'mohamed.salah@feedyum.com',
        },
        address: {
            label: '📍 عنوان العمل',
            value: '٦ ش محمد توفيق دياب، المنطقة السادسة، مدينة نصر، القاهرة، مصر',
        },
        company: {
            label: '🏢 الشركة',
            value: 'FeedYum منتج من Innovita Tech Ltd، مسجلة سنة ٢٠٢٣',
        },
        social: {
            label: '🌐 تابعنا على',
        },
        hours: {
            label: '🕐 ساعات العمل',
            value: 'متاحين يومياً من ٩ صباحاً حتى ١١ مساءً',
        },
        supportNote: 'للاستفسارات العاجلة المتعلقة بالطلبات، يرجى التواصل مباشرة مع المطعم أو الطباخ من خلال التطبيق.',
    },
    en: {
        title: 'Contact Us',
        subtitle: 'We\'re here to help! Reach out to us through any channel that suits you',
        phone: {
            label: '📞 Phone Number',
            value: '01092532376',
            displayValue: '01092532376',
        },
        email: {
            label: '📧 Email',
            value: 'mohamed.salah@feedyum.com',
        },
        address: {
            label: '📍 Business Address',
            value: '6 Mohamed Tawfik Diab St., 6th District, Nasr City, Cairo, Egypt',
        },
        company: {
            label: '🏢 Company',
            value: 'FeedYum is a product of Innovita Tech Ltd, registered 2023',
        },
        social: {
            label: '🌐 Follow Us',
        },
        hours: {
            label: '🕐 Working Hours',
            value: 'Available daily from 9 AM to 11 PM',
        },
        supportNote: 'For urgent order-related inquiries, please contact the restaurant or chef directly through the app.',
    },
};

export default function ContactPage() {
    const [lang, setLang] = useLang();
    const isAr = lang === 'ar';
    const content = isAr ? contactContent.ar : contactContent.en;

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} onLangChange={setLang} />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">{content.title}</h1>
                        <p className="section-subtitle">{content.subtitle}</p>
                    </div>

                    <div className="contact-grid" dir={isAr ? 'rtl' : 'ltr'}>
                        {/* Phone */}
                        <div className="contact-card">
                            <h3>{content.phone.label}</h3>
                            <a href={`tel:+2${content.phone.value}`} className="contact-value contact-link">
                                {content.phone.displayValue}
                            </a>
                        </div>

                        {/* Email */}
                        <div className="contact-card">
                            <h3>{content.email.label}</h3>
                            <a href={`mailto:${content.email.value}`} className="contact-value contact-link">
                                {content.email.value}
                            </a>
                        </div>

                        {/* Address */}
                        <div className="contact-card">
                            <h3>{content.address.label}</h3>
                            <p className="contact-value">{content.address.value}</p>
                        </div>

                        {/* Company */}
                        <div className="contact-card">
                            <h3>{content.company.label}</h3>
                            <p className="contact-value">{content.company.value}</p>
                        </div>

                        {/* Working Hours */}
                        <div className="contact-card">
                            <h3>{content.hours.label}</h3>
                            <p className="contact-value">{content.hours.value}</p>
                        </div>

                        {/* Social Media */}
                        <div className="contact-card contact-card-wide">
                            <h3>{content.social.label}</h3>
                            <div className="contact-social-links">
                                <a href="https://www.facebook.com/FeedYum" target="_blank" rel="noopener noreferrer" className="contact-social-btn">
                                    Facebook
                                </a>
                                <a href="https://instagram.com/feedyum.app" target="_blank" rel="noopener noreferrer" className="contact-social-btn">
                                    Instagram
                                </a>
                                <a href={COMPANY.linkedin} target="_blank" rel="noopener noreferrer" className="contact-social-btn">
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Support Note */}
                    <div className="note-section">
                        <div className="note-card">
                            <div className="note-icon">💡</div>
                            <div className="note-content">
                                <h3>{isAr ? 'ملاحظة' : 'Note'}</h3>
                                <p>{content.supportNote}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
