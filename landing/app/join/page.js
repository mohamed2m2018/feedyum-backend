'use client';

import { useState } from 'react';
import { useLang } from '../components/useLang';
import { Nav, Footer, COMPANY } from '../components/SharedComponents';

const content = {
    en: {
        title: 'Join FeedYum as a chef',
        subtitle: 'Home chef or restaurant? Tell us about your kitchen and we\'ll help you get set up. No subscription, just 4 EGP per confirmed order.',
        benefits: ['Free promotion for your dishes', 'Orders straight from your videos', 'Kitchen dashboard to manage menu and orders', 'Cash on delivery, paid directly to you'],
        labels: {
            name: 'Your name',
            businessName: 'Kitchen or restaurant name (optional)',
            businessType: 'I am a',
            phone: 'Phone / WhatsApp',
            email: 'Email (optional)',
            area: 'Area / city',
            cuisine: 'What do you cook?',
            socialLink: 'Instagram or Facebook page (optional)',
            notes: 'Anything else? (optional)',
        },
        placeholders: { cuisine: 'e.g. Egyptian home food, desserts', area: 'e.g. Nasr City, Cairo' },
        types: { home_chef: 'Home chef', restaurant: 'Restaurant' },
        submit: 'Send request',
        sending: 'Sending…',
        success: 'Thanks! We received your request and will contact you soon.',
        fieldError: 'Please check this field',
        rateLimited: 'Too many requests. Please try again later.',
        error: `Something went wrong. Please try again or email ${COMPANY.email}.`,
    },
    ar: {
        title: 'انضم لـ FeedYum كشيف',
        subtitle: 'شيف بيتي أو مطعم؟ احكيلنا عن مطبخك وهنساعدك تبدأ. مفيش اشتراك، بس ٤ ج.م لكل طلب مؤكد.',
        benefits: ['ترويج مجاني لأطباقك', 'طلبات مباشرة من الفيديوهات', 'لوحة تحكم للمطبخ لإدارة المنيو والطلبات', 'الدفع كاش عند الاستلام ليك مباشرة'],
        labels: {
            name: 'اسمك',
            businessName: 'اسم المطبخ أو المطعم (اختياري)',
            businessType: 'أنا',
            phone: 'رقم الموبايل / واتساب',
            email: 'الإيميل (اختياري)',
            area: 'المنطقة / المدينة',
            cuisine: 'بتطبخ إيه؟',
            socialLink: 'صفحة إنستجرام أو فيسبوك (اختياري)',
            notes: 'حاجة تانية؟ (اختياري)',
        },
        placeholders: { cuisine: 'مثلاً: أكل بيتي مصري، حلويات', area: 'مثلاً: مدينة نصر، القاهرة' },
        types: { home_chef: 'شيف بيتي', restaurant: 'مطعم' },
        submit: 'ابعت الطلب',
        sending: 'جاري الإرسال…',
        success: 'شكراً! وصلنا طلبك وهنتواصل معاك قريب.',
        fieldError: 'راجع الخانة دي',
        rateLimited: 'طلبات كتير. حاول تاني بعد شوية.',
        error: `حصلت مشكلة. حاول تاني أو ابعتلنا على ${COMPANY.email}.`,
    },
};

const EMPTY_FORM = {
    name: '',
    businessName: '',
    businessType: 'home_chef',
    phone: '',
    email: '',
    area: '',
    cuisine: '',
    socialLink: '',
    notes: '',
    website: '', // honeypot, hidden from people
};

const TEXT_FIELDS = ['name', 'businessName', 'phone', 'email', 'area', 'cuisine', 'socialLink'];
const REQUIRED = new Set(['name', 'phone', 'area']);

export default function JoinPage() {
    const [lang, setLang] = useLang();
    const isAr = lang === 'ar';
    const t = content[lang];
    const [form, setForm] = useState(EMPTY_FORM);
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [message, setMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setMessage('');
        setFieldErrors({});
        try {
            const res = await fetch('/api/chef-applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, language: lang }),
            });
            if (res.ok) {
                setStatus('success');
                setForm(EMPTY_FORM);
                return;
            }
            const body = await res.json().catch(() => ({}));
            setStatus('error');
            if (res.status === 400 && body.errors) {
                setFieldErrors(body.errors);
            } else {
                setMessage(res.status === 429 ? t.rateLimited : t.error);
            }
        } catch {
            setStatus('error');
            setMessage(t.error);
        }
    };

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

                    <ul className="join-benefits">
                        {t.benefits.map((b) => <li key={b}>{b}</li>)}
                    </ul>

                    {status === 'success' ? (
                        <div className="join-success" role="status">{t.success}</div>
                    ) : (
                        <form className="join-form" onSubmit={handleSubmit} noValidate>
                            {TEXT_FIELDS.slice(0, 2).map((field) => (
                                <Field key={field} field={field} t={t} form={form} update={update} fieldErrors={fieldErrors} />
                            ))}

                            <fieldset className="join-field">
                                <legend>{t.labels.businessType}</legend>
                                <div className="join-choice">
                                    {Object.entries(t.types).map(([value, label]) => (
                                        <label key={value}>
                                            <input
                                                type="radio"
                                                name="businessType"
                                                value={value}
                                                checked={form.businessType === value}
                                                onChange={update('businessType')}
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            {TEXT_FIELDS.slice(2).map((field) => (
                                <Field key={field} field={field} t={t} form={form} update={update} fieldErrors={fieldErrors} />
                            ))}

                            <div className="join-field">
                                <label htmlFor="notes">{t.labels.notes}</label>
                                <textarea id="notes" rows={3} maxLength={1000} value={form.notes} onChange={update('notes')} />
                            </div>

                            {/* Honeypot: hidden from people, bots tend to fill it */}
                            <div className="join-hp" aria-hidden="true">
                                <label htmlFor="website">Website</label>
                                <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
                            </div>

                            {message && <p className="join-error" role="alert">{message}</p>}

                            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                                {status === 'sending' ? t.sending : t.submit}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}

function Field({ field, t, form, update, fieldErrors }) {
    const type = field === 'email' ? 'email' : field === 'phone' ? 'tel' : field === 'socialLink' ? 'url' : 'text';
    return (
        <div className="join-field">
            <label htmlFor={field}>{t.labels[field]}</label>
            <input
                id={field}
                type={type}
                required={REQUIRED.has(field)}
                value={form[field]}
                onChange={update(field)}
                placeholder={t.placeholders[field] || ''}
                aria-invalid={Boolean(fieldErrors[field])}
            />
            {fieldErrors[field] && <span className="join-field-error">{t.fieldError}</span>}
        </div>
    );
}
