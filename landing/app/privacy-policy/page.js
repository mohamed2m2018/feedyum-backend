import { Nav, Footer } from '../components/SharedComponents';

export const metadata = {
    title: 'FeedYum - سياسة الخصوصية | Privacy Policy',
    description: 'سياسة الخصوصية لتطبيق FeedYum - Privacy Policy for FeedYum app',
};

const policySections = {
    ar: [
        { title: '١. جمع المعلومات الشخصية', text: 'يقوم FeedYum بجمع المعلومات الشخصية التي تقدمها طوعًا عند استخدام التطبيق. قد تشمل هذه المعلومات اسمك، وعنوان بريدك الإلكتروني، ورقم هاتفك، وعنوان التوصيل، وصورة ملفك الشخصي، وأي معلومات إضافية تختار مشاركتها. نقوم بجمع المعلومات الضرورية فقط لتشغيل التطبيق وتوفير تجربة مخصصة لك.' },
        { title: '٢. استخدام المعلومات', text: 'يستخدم FeedYum المعلومات المجمعة لتعزيز تجربتك في التطبيق. قد نستخدم معلوماتك الشخصية لإنشاء وصيانة حساب المستخدم الخاص بك، ومعالجة وتوصيل الطلبات، وتقديم دعم فني، وإرسال تحديثات وإشعارات ذات صلة، وتخصيص المحتوى والتوصيات التي تظهر في التطبيق.' },
        { title: '٣. مشاركة المعلومات', text: 'قد يشارك FeedYum معلوماتك الشخصية مع مقدمي خدمات طرف ثالث موثوق بهم لمساعدتنا في تقديم وتحسين ميزات التطبيق، مثل معالجي الدفع وخدمات التوصيل. يتعين على هؤلاء مقدمي الخدمات الالتزام بالحفاظ على سرية وأمان معلوماتك.' },
        { title: '٤. بيانات الموقع', text: 'يقوم FeedYum بجمع بيانات موقعك لعرض المطابخ القريبة، وحساب مسافات التوصيل، وتوفير خدمات توصيل دقيقة. تُستخدم بيانات الموقع فقط أثناء استخدام التطبيق ولا تتم مشاركتها مع أطراف ثالثة إلا مقدمي خدمات التوصيل حسب الحاجة لتنفيذ طلباتك.' },
        { title: '٥. أمان البيانات', text: 'تولي FeedYum أهمية بالغة لأمان البيانات وتنفيذ تدابير قياسية لحماية معلوماتك الشخصية من الوصول غير المصرح به والكشف عنه والتعديل عليه والتدمير. نستخدم التشفير وممارسات تخزين البيانات الآمنة لحماية بياناتك.' },
        { title: '٦. روابط الأطراف الثالثة', text: 'قد يحتوي تطبيق FeedYum على روابط إلى مواقع وخدمات طرف ثالث. نحن غير مسؤولين عن ممارسات الخصوصية أو محتوى هذه المواقع والخدمات. نشجعك على مراجعة سياسات الخصوصية لهذه الأطراف الثالثة قبل التفاعل معها.' },
        { title: '٧. خصوصية الأطفال', text: 'صُمم تطبيق FeedYum للمستخدمين الذين تبلغ أعمارهم ١٣ عامًا أو أكثر. نحن لا نقوم بجمع معلومات شخصية عن الأطفال الذين تقل أعمارهم عن ١٣ عامًا بشكل عمد. إذا أدركنا أننا قمنا بجمع معلومات شخصية عن طفل دون سن ١٣ عامًا، سنقوم بحذف المعلومات من سجلاتنا على الفور.' },
        { title: '٨. تغييرات على سياسة الخصوصية', text: 'تحتفظ FeedYum بالحق في تحديث أو تعديل سياسة الخصوصية هذه من وقت لآخر. عندما نقوم بإجراء تغييرات، سنُخطرك من خلال التطبيق أو عن طريق وسائل أخرى. سيُعد استمرار استخدام تطبيق FeedYum بعد تنفيذ التغييرات مؤشرًا على قبولك لسياسة الخصوصية المحدثة.' },
    ],
    en: [
        { title: '1. Collection of Personal Information', text: 'FeedYum collects personal information that you voluntarily provide when using the app. This may include your name, email address, phone number, delivery address, profile picture, and any additional information you choose to share. We only collect information necessary for the functioning of the app and to provide you with a personalized experience.' },
        { title: '2. Use of Information', text: "FeedYum uses the collected information to enhance your experience on the app. We may use your personal information to create and maintain your user account, process and deliver orders, provide customer support, send you relevant updates and notifications, and personalize the content and recommendations you see." },
        { title: '3. Sharing of Information', text: "FeedYum may share your personal information with trusted third-party service providers to assist us in delivering and improving the app's features, such as payment processors and delivery services. These service providers are contractually obligated to maintain the confidentiality and security of your information." },
        { title: '4. Location Data', text: 'FeedYum collects your location data to show nearby kitchens, calculate delivery distances, and provide accurate delivery services. Location data is used only while the app is in use and is not shared with third parties except delivery service providers as needed to fulfill your orders.' },
        { title: '5. Data Security', text: 'FeedYum takes data security seriously and implements industry-standard measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. We use encryption and secure data storage practices to safeguard your data.' },
        { title: '6. Third-Party Links', text: 'The FeedYum app may contain links to third-party websites or services. We are not responsible for the privacy practices or the content of these third-party websites or services. We encourage you to review the privacy policies of these third parties before interacting with them.' },
        { title: "7. Children's Privacy", text: 'FeedYum is intended for users who are 13 years of age or older. We do not knowingly collect personal information from children under the age of 13. If we become aware that we have inadvertently collected personal information from a child under 13, we will promptly delete the information from our records.' },
        { title: '8. Changes to this Privacy Policy', text: 'FeedYum reserves the right to update or modify this Privacy Policy from time to time. When we make changes, we will notify you through the app or by other means of communication. Your continued use of the FeedYum app after changes are implemented signifies your acceptance of the updated Privacy Policy.' },
    ],
};

export default function PrivacyPolicy() {
    return (
        <div className="rtl" style={{ direction: 'rtl', overflowX: 'hidden', maxWidth: '100vw', width: '100%' }}>
            <div className="animated-bg" />
            <Nav lang="ar" />

            <section className="privacy-page">
                <div className="container">
                    <div className="section-header">
                        <h1 className="section-title">سياسة الخصوصية</h1>
                        <p className="section-subtitle">Privacy Policy</p>
                    </div>

                    {/* Arabic */}
                    <div style={{ marginBottom: '60px' }}>
                        {policySections.ar.map((s, i) => (
                            <div className="privacy-section" key={i}>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '40px 0' }} />

                    {/* English */}
                    <div dir="ltr" style={{ textAlign: 'left' }}>
                        {policySections.en.map((s, i) => (
                            <div className="privacy-section" key={i}>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'var(--light-muted)', fontSize: '0.85rem' }}>
                        <p>آخر تحديث: مارس ٢٠٢٦ | Last updated: March 2026</p>
                        <p>تواصل معنا | Contact us: <a href="mailto:support@feedyum.com" style={{ color: 'var(--primary)' }}>support@feedyum.com</a></p>
                    </div>
                </div>
            </section>

            <Footer lang="ar" />
        </div>
    );
}
