/**
 * Translation Routes
 * API endpoints for text translation
 */

const express = require('express');
const router = express.Router();
const translationService = require('../services/translationService');

/**
 * POST /translate
 * Translate text between Arabic and English
 * 
 * Body:
 * - text: string (required) - Text to translate
 * - to: string (optional) - Target language ('ar' or 'en'), default: opposite of detected
 * - from: string (optional) - Source language, auto-detected if not provided
 */
router.post('/', async (req, res) => {
    try {
        const { text, to, from } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Text is required and must be a string'
            });
        }

        // Determine target language
        let targetLanguage = to;
        if (!targetLanguage) {
            // If no target specified, translate to opposite language
            const detectedLanguage = translationService.detectLanguage(text);
            targetLanguage = detectedLanguage === 'ar' ? 'en' : 'ar';
        }

        const result = await translationService.translateText(text, targetLanguage, from);

        res.json({
            success: true,
            translation: result.translation,
            from: result.from,
            to: result.to
        });
    } catch (error) {
        console.error('Translation API error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

/**
 * POST /translate/detect
 * Detect the language of text
 */
router.post('/detect', (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Text is required and must be a string'
            });
        }

        const language = translationService.detectLanguage(text);

        res.json({
            success: true,
            language,
            languageName: language === 'ar' ? 'Arabic' : 'English'
        });
    } catch (error) {
        console.error('Language detection error:', error);
        res.status(500).json({
            error: 'Language detection failed',
            message: error.message
        });
    }
});

/**
 * POST /translate/bilingual
 * Get both Arabic and English versions of text
 */
router.post('/bilingual', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Text is required and must be a string'
            });
        }

        const result = await translationService.getBilingualText(text);

        res.json({
            success: true,
            arabic: result.arabic,
            english: result.english,
            originalLanguage: result.originalLanguage
        });
    } catch (error) {
        console.error('Bilingual translation error:', error);
        res.status(500).json({
            error: 'Translation failed',
            message: error.message
        });
    }
});

module.exports = router;
