'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'feedyum-lang';

// English is the default and is what the static export renders. Arabic is
// opt-in through the language toggle or a ?lang=ar link, and the choice is
// remembered for the next visit.
export function useLang() {
    const [lang, setLangState] = useState('en');

    useEffect(() => {
        let initial = new URLSearchParams(window.location.search).get('lang');
        if (initial !== 'ar' && initial !== 'en') {
            try {
                initial = window.localStorage.getItem(STORAGE_KEY);
            } catch {
                initial = null;
            }
        }
        if (initial === 'ar') setLangState('ar');
    }, []);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    const setLang = useCallback((next) => {
        setLangState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage can be unavailable (private mode); the toggle still works.
        }
    }, []);

    return [lang, setLang];
}
