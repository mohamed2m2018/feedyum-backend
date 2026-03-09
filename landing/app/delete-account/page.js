'use client';

import { useState } from 'react';
import { Nav, Footer } from '../components/SharedComponents';

export default function DeleteAccount() {
    const [lang, setLang] = useState('ar');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState('');
    const isAr = lang === 'ar';

    const t = {
        title: isAr ? 'حذف الحساب' : 'Delete Account',
        subtitle: isAr ? 'Delete Account' : 'حذف الحساب',
        description: isAr
            ? 'إذا كنت ترغب في حذف حسابك وجميع البيانات المرتبطة به، يرجى إدخال بريدك الإلكتروني وكلمة المرور أدناه. سيتم حذف حسابك وجميع بياناتك بشكل نهائي خلال ٣٠ يومًا.'
            : 'If you wish to delete your account and all associated data, please enter your email and password below. Your account and all data will be permanently deleted within 30 days.',
        deletedDataTitle: isAr ? 'البيانات التي سيتم حذفها:' : 'Data that will be deleted:',
        deletedItems: isAr
            ? ['معلومات الملف الشخصي', 'الطلبات والسجل', 'المحادثات والرسائل', 'التقييمات والتعليقات', 'المنشورات والفيديوهات', 'العناوين المحفوظة']
            : ['Profile information', 'Orders & history', 'Chats & messages', 'Reviews & comments', 'Posts & videos', 'Saved addresses'],
        emailLabel: isAr ? 'البريد الإلكتروني' : 'Email',
        passwordLabel: isAr ? 'كلمة المرور' : 'Password',
        submitBtn: isAr ? '🗑️ حذف حسابي' : '🗑️ Delete My Account',
        loadingBtn: isAr ? '⏳ جاري المعالجة...' : '⏳ Processing...',
        disclaimer: isAr ? 'هذا الإجراء لا يمكن التراجع عنه' : 'This action cannot be undone',
        successTitle: isAr ? 'تم استلام طلبك' : 'Request Received',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/user/request-deletion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.message || (isAr
                    ? 'تم استلام طلب حذف حسابك. سيتم حذف حسابك وجميع البيانات المرتبطة به خلال ٣٠ يومًا.'
                    : 'Your account deletion request has been submitted. Your account and all associated data will be deleted within 30 days.'));
            } else {
                setStatus('error');
                setMessage(data.error || (isAr
                    ? 'فشل في معالجة طلبك. يرجى التحقق من بياناتك والمحاولة مرة أخرى.'
                    : 'Failed to process your request. Please check your credentials and try again.'));
            }
        } catch (err) {
            setStatus('error');
            setMessage(isAr ? 'خطأ في الشبكة. يرجى المحاولة لاحقًا.' : 'Network error. Please try again later.');
        }
    };

    return (
        <div className={isAr ? 'rtl' : ''} style={{ direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang={lang} />

            <section className="privacy-page">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="section-header">
                        <h1 className="section-title">{t.title}</h1>
                        <p className="section-subtitle">{t.subtitle}</p>
                    </div>

                    {/* Language Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
                        <button
                            onClick={() => setLang('ar')}
                            style={{
                                padding: '10px 28px',
                                borderRadius: '50px',
                                border: 'none',
                                background: isAr ? 'var(--primary)' : 'var(--dark-secondary)',
                                color: isAr ? 'white' : 'var(--light-muted)',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                        >
                            🇪🇬 العربية
                        </button>
                        <button
                            onClick={() => setLang('en')}
                            style={{
                                padding: '10px 28px',
                                borderRadius: '50px',
                                border: 'none',
                                background: !isAr ? 'var(--primary)' : 'var(--dark-secondary)',
                                color: !isAr ? 'white' : 'var(--light-muted)',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                            }}
                        >
                            🇬🇧 English
                        </button>
                    </div>

                    {/* Description */}
                    <div className="privacy-section" style={{ marginBottom: '24px' }}>
                        <p>{t.description}</p>
                    </div>

                    {/* What gets deleted */}
                    <div style={{
                        background: 'var(--dark-secondary)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>{t.deletedDataTitle}</h3>
                        <ul style={{ color: 'var(--light-muted)', fontSize: '0.9rem', lineHeight: 2, paddingRight: isAr ? '20px' : '0', paddingLeft: isAr ? '0' : '20px' }}>
                            {t.deletedItems.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    {status === 'success' ? (
                        <div style={{
                            background: 'rgba(76, 175, 80, 0.15)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            borderRadius: '16px',
                            padding: '32px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
                            <h3 style={{ marginBottom: '8px' }}>{t.successTitle}</h3>
                            <p style={{ color: 'var(--light-muted)', fontSize: '0.9rem' }}>{message}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--light-muted)' }}>
                                    {t.emailLabel}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="your@email.com"
                                    dir="ltr"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        background: 'var(--dark-secondary)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'var(--light)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        textAlign: 'left',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--light-muted)' }}>
                                    {t.passwordLabel}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    dir="ltr"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        background: 'var(--dark-secondary)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'var(--light)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        textAlign: 'left',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            {status === 'error' && (
                                <div style={{
                                    background: 'rgba(244, 67, 54, 0.15)',
                                    border: '1px solid rgba(244, 67, 54, 0.3)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    marginBottom: '20px',
                                    color: '#f44336',
                                    fontSize: '0.9rem',
                                }}>
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                style={{
                                    width: '100%',
                                    padding: '14px 24px',
                                    background: status === 'loading' ? 'var(--dark-tertiary)' : '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {status === 'loading' ? t.loadingBtn : t.submitBtn}
                            </button>

                            <p style={{
                                textAlign: 'center',
                                color: 'var(--light-muted)',
                                fontSize: '0.8rem',
                                marginTop: '16px',
                            }}>
                                {t.disclaimer}
                            </p>
                        </form>
                    )}
                </div>
            </section>

            <Footer lang={lang} />
        </div>
    );
}
