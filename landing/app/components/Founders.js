export const FOUNDERS = [
    {
        initials: 'MS',
        name: { en: 'Mohamed Salaheldin', ar: 'محمد صلاح الدين' },
        role: { en: 'Co-founder', ar: 'شريك مؤسس' },
        bio: {
            en: 'Software engineer with 7+ years of experience building mobile apps. Builds the FeedYum app and platform.',
            ar: 'مهندس برمجيات بخبرة أكتر من ٧ سنين في بناء تطبيقات الموبايل. بيبني تطبيق ومنصة FeedYum.',
        },
        linkedin: 'https://www.linkedin.com/in/muhammad-salah-eldin/',
        email: 'mohamed.salah@feedyum.com',
    },
    {
        initials: 'MS',
        name: { en: 'Mohamed Shoman', ar: 'محمد شومان' },
        role: { en: 'Co-founder', ar: 'شريك مؤسس' },
        bio: {
            en: 'Teaching assistant and lecturer at the Faculty of Engineering, Ain Shams University.',
            ar: 'معيد ومدرس بكلية الهندسة، جامعة عين شمس.',
        },
    },
];

export function Founders({ lang = 'en' }) {
    return (
        <div className="founders-grid">
            {FOUNDERS.map((f) => (
                <div className="founder-card" key={f.name.en}>
                    <div className="founder-avatar" aria-hidden="true">{f.initials}</div>
                    <h3 className="founder-name">{f.name[lang]}</h3>
                    <div className="founder-role">{f.role[lang]}</div>
                    {f.bio && <p className="founder-bio">{f.bio[lang]}</p>}
                    {(f.linkedin || f.email) && (
                        <div className="founder-links">
                            {f.linkedin && (
                                <a href={f.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                            )}
                            {f.email && <a href={`mailto:${f.email}`}>{f.email}</a>}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
