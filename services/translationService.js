/**
 * Translation Service
 * Provides automatic translation between Arabic and English using Google Translate
 */

const translate = require('@iamtraction/google-translate');

class TranslationService {
    constructor() {
        // Supported language codes
        this.ARABIC = 'ar';
        this.ENGLISH = 'en';
    }

    /**
     * Detect the language of the given text
     * @param {string} text - Text to analyze
     * @returns {'ar' | 'en'} - Detected language code
     */
    detectLanguage(text) {
        if (!text || typeof text !== 'string') {
            return this.ENGLISH; // Default to English
        }

        // Arabic Unicode range detection (includes Arabic, Arabic Supplement, Arabic Extended-A)
        const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

        // Count Arabic vs Latin characters
        const arabicMatches = (text.match(arabicPattern) || []).length;
        const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;

        // If more Arabic characters than Latin, it's Arabic
        return arabicMatches > latinMatches ? this.ARABIC : this.ENGLISH;
    }

    /**
     * Translate text to target language
     * @param {string} text - Text to translate
     * @param {string} to - Target language code ('ar' or 'en')
     * @param {string} from - Source language code (optional, auto-detected if not provided)
     * @returns {Promise<{translation: string, from: string, to: string}>}
     */
    async translateText(text, to, from = null) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { translation: '', from: from || 'unknown', to };
        }

        try {
            // Auto-detect source language if not provided
            const sourceLanguage = from || this.detectLanguage(text);

            // If source and target are same, return original
            if (sourceLanguage === to) {
                return { translation: text, from: sourceLanguage, to };
            }

            console.log(`🌐 Translating from ${sourceLanguage} to ${to}: "${text.substring(0, 50)}..."`);

            const result = await translate(text, { from: sourceLanguage, to });

            console.log(`✅ Translation result: "${result.text.substring(0, 50)}..."`);

            return {
                translation: result.text,
                from: result.from.language.iso || sourceLanguage,
                to
            };
        } catch (error) {
            console.error('❌ Translation error:', error.message);
            // Return empty translation on error (chef can manually enter)
            return { translation: '', from: from || 'unknown', to, error: error.message };
        }
    }

    /**
     * Translate text to Arabic
     * @param {string} text - Text to translate
     * @returns {Promise<string>} - Arabic translation
     */
    async toArabic(text) {
        const result = await this.translateText(text, this.ARABIC);
        return result.translation;
    }

    /**
     * Translate text to English
     * @param {string} text - Text to translate  
     * @returns {Promise<string>} - English translation
     */
    async toEnglish(text) {
        const result = await this.translateText(text, this.ENGLISH);
        return result.translation;
    }

    /**
     * Get both Arabic and English versions of text
     * @param {string} text - Original text
     * @returns {Promise<{arabic: string, english: string, originalLanguage: string}>}
     */
    async getBilingualText(text) {
        if (!text || text.trim().length === 0) {
            return { arabic: '', english: '', originalLanguage: 'unknown' };
        }

        const originalLanguage = this.detectLanguage(text);

        if (originalLanguage === this.ARABIC) {
            const englishResult = await this.translateText(text, this.ENGLISH, this.ARABIC);
            return {
                arabic: text,
                english: englishResult.translation,
                originalLanguage: this.ARABIC
            };
        } else {
            const arabicResult = await this.translateText(text, this.ARABIC, this.ENGLISH);
            return {
                arabic: arabicResult.translation,
                english: text,
                originalLanguage: this.ENGLISH
            };
        }
    }

    /**
     * Batch translate multiple texts
     * @param {string[]} texts - Array of texts to translate
     * @param {string} to - Target language
     * @returns {Promise<string[]>} - Array of translations
     */
    async batchTranslate(texts, to) {
        if (!Array.isArray(texts) || texts.length === 0) {
            return [];
        }

        // Process in small batches to avoid rate limiting
        const batchSize = 10;
        const results = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchResults = await Promise.allSettled(
                batch.map(text => this.translateText(text, to))
            );

            const translations = batchResults.map(result =>
                result.status === 'fulfilled' ? result.value.translation : ''
            );

            results.push(...translations);

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return results;
    }
}

module.exports = new TranslationService();
