'use client';

import { useState } from 'react';
import { Nav, Footer } from '../components/SharedComponents';

export default function DeleteAccount() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState(null); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

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
                setMessage(data.message || 'Your account deletion request has been submitted. Your account and all associated data will be deleted within 30 days.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to process your request. Please check your credentials and try again.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Please try again later.');
        }
    };

    return (
        <div className="rtl" style={{ direction: 'rtl', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang="ar" />

            <section className="privacy-page">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="section-header">
                        <h1 className="section-title">حذف الحساب</h1>
                        <p className="section-subtitle">Delete Account</p>
                    </div>

                    {/* Arabic description */}
                    <div className="privacy-section" style={{ marginBottom: '16px' }}>
                        <p>إذا كنت ترغب في حذف حسابك وجميع البيانات المرتبطة به، يرجى إدخال بريدك الإلكتروني وكلمة المرور أدناه. سيتم حذف حسابك وجميع بياناتك بشكل نهائي خلال ٣٠ يومًا.</p>
                    </div>

                    {/* English description */}
                    <div className="privacy-section" dir="ltr" style={{ textAlign: 'left', marginBottom: '32px' }}>
                        <p>If you wish to delete your account and all associated data, please enter your email and password below. Your account and all data will be permanently deleted within 30 days.</p>
                    </div>

                    {/* What gets deleted */}
                    <div style={{
                        background: 'var(--dark-secondary)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>البيانات التي سيتم حذفها | Data that will be deleted:</h3>
                        <ul style={{ color: 'var(--light-muted)', fontSize: '0.9rem', lineHeight: 2, paddingRight: '20px' }}>
                            <li>معلومات الملف الشخصي | Profile information</li>
                            <li>الطلبات والسجل | Orders & history</li>
                            <li>المحادثات والرسائل | Chats & messages</li>
                            <li>التقييمات والتعليقات | Reviews & comments</li>
                            <li>المنشورات والفيديوهات | Posts & videos</li>
                            <li>العناوين المحفوظة | Saved addresses</li>
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
                            <h3 style={{ marginBottom: '8px' }}>تم استلام طلبك | Request Received</h3>
                            <p style={{ color: 'var(--light-muted)', fontSize: '0.9rem' }}>{message}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} dir="ltr" style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--light-muted)' }}>
                                    Email / البريد الإلكتروني
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="your@email.com"
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
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--light-muted)' }}>
                                    Password / كلمة المرور
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
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
                                {status === 'loading' ? '⏳ جاري المعالجة... | Processing...' : '🗑️ حذف حسابي | Delete My Account'}
                            </button>

                            <p style={{
                                textAlign: 'center',
                                color: 'var(--light-muted)',
                                fontSize: '0.8rem',
                                marginTop: '16px',
                            }}>
                                هذا الإجراء لا يمكن التراجع عنه | This action cannot be undone
                            </p>
                        </form>
                    )}
                </div>
            </section>

            <Footer lang="ar" />
        </div>
    );
}
