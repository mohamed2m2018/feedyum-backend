const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const generateWebFallback = async (req, res) => {
    try {
        const { type, contentId } = req.params;
        const userAgent = req.get('User-Agent') || '';
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isMobile = isIOS || isAndroid;

        // Generate the deep link for after installation
        const deepLink = EnhancedNotificationService.generateDeepLink(type, contentId, req.query);

        // App Store URLs - Using your actual Play Store URL
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.foodtok';
        const appStoreUrl = 'https://apps.apple.com/app/foodtok/idYOUR_APP_ID'; // Optional: Add when iOS app is ready

        // Try to open the app first (for users who have it installed)
        const appSchemeUrl = deepLink;

        // Create deferred deep link data
        const deferredData = {
            type,
            contentId,
            deepLink,
            timestamp: Date.now(),
            ...req.query
        };

        // Generate a unique token for this deferred link
        const deferredToken = Buffer.from(JSON.stringify(deferredData)).toString('base64url');

        // Web fallback HTML page
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FeedYum - ${getContentTitle(type, contentId)}</title>
    
    <!-- Open Graph Meta Tags for Social Sharing -->
    <meta property="og:title" content="${getOGTitle(type, contentId)}">
    <meta property="og:description" content="${getOGDescription(type)}">
    <meta property="og:image" content="https://feedyum.com/images/og-image.jpg">
    <meta property="og:url" content="${req.originalUrl}">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${getOGTitle(type, contentId)}">
    <meta name="twitter:description" content="${getOGDescription(type)}">
    <meta name="twitter:image" content="https://feedyum.com/images/og-image.jpg">
    
    <!-- iOS Smart App Banner (when iOS app is ready) -->
    ${appStoreUrl !== 'https://apps.apple.com/app/foodtok/idYOUR_APP_ID' ? `<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID, app-argument=${encodeURIComponent(deepLink)}">` : ''}
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
            color: white;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            max-width: 400px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            color: #FF6B35;
        }
        
        h1 {
            margin: 0 0 10px;
            font-size: 28px;
            font-weight: 700;
        }
        
        p {
            margin: 0 0 30px;
            font-size: 16px;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .download-buttons {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 30px 0;
        }
        
        .download-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 15px 25px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .download-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }
        
        .download-btn img {
            width: 24px;
            height: 24px;
            margin-right: 10px;
        }
        
        .open-app-btn {
            background: white;
            color: #FF6B35;
            margin-bottom: 20px;
        }
        
        .playstore-btn {
            background: #01875f;
            color: white;
        }
        
        .playstore-btn:hover {
            background: #00a368;
        }
        
        .appstore-btn {
            background: #000;
            color: white;
        }
        
        .appstore-btn:hover {
            background: #333;
        }
        
        .fallback-content {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .fallback-content h2 {
            font-size: 20px;
            margin-bottom: 15px;
        }
        
        .loading {
            display: none;
            margin: 20px 0;
        }
        
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🍽️</div>
        <h1>FeedYum</h1>
        <div class="badge">🔥 Food & Recipe Platform</div>
        <p>${getContentDescription(type, contentId)}</p>
        
        <!-- Try to open the app first -->
        <a href="${appSchemeUrl}" class="download-btn open-app-btn" id="openAppBtn">
            <span>📱</span>&nbsp;&nbsp;Open in FeedYum App
        </a>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Opening FeedYum...</p>
        </div>
        
        <div class="download-buttons" id="downloadButtons" style="display: none;">
            <p>Don't have FeedYum yet? Download now and discover amazing dishes!</p>
            
            <!-- Primary: Google Play Store for Android -->
            <a href="${playStoreUrl}" class="download-btn playstore-btn" onclick="trackDownload('android')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Download for Android
            </a>
            
            ${isIOS ? `
            <!-- Optional: iOS App Store (when ready) -->
            <a href="${appStoreUrl}" class="download-btn appstore-btn" onclick="trackDownload('ios')" ${appStoreUrl.includes('YOUR_APP_ID') ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                ${appStoreUrl.includes('YOUR_APP_ID') ? 'Coming to iPhone Soon' : 'Download for iPhone'}
            </a>
            ` : ''}
            
            ${!isMobile ? `
            <!-- Desktop: Show both options -->
            <div style="display: flex; gap: 15px; margin-top: 10px;">
                <a href="${playStoreUrl}" class="download-btn playstore-btn" style="flex: 1;" onclick="trackDownload('android')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Android
                </a>
                ${!appStoreUrl.includes('YOUR_APP_ID') ? `
                <a href="${appStoreUrl}" class="download-btn appstore-btn" style="flex: 1;" onclick="trackDownload('ios')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    iOS
                </a>
                ` : ''}
            </div>
            ` : ''}
        </div>
        
        <div class="fallback-content">
            <h2>What is FeedYum?</h2>
            <p>Discover amazing dishes, connect with talented chefs, and explore delicious food content. Join thousands of food enthusiasts sharing their culinary creations!</p>
            <div style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                <p>🍽️ Recipe Videos • 👨‍🍳 Chef Profiles • 📋 Menus • 🔴 Live Cooking</p>
            </div>
        </div>
    </div>

    <script>
        // Store deferred deep link data
        const deferredData = ${JSON.stringify(deferredData)};
        const deferredToken = '${deferredToken}';
        
        // Save deferred link data to localStorage for after installation
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem('foodtok_deferred_link', JSON.stringify(deferredData));
            localStorage.setItem('foodtok_deferred_token', deferredToken);
            console.log('🔗 Saved deferred link data for FeedYum:', deferredData);
        }
        
        // Track analytics
        function trackDownload(platform) {
            console.log('📊 Tracking download for platform:', platform);
            
            // Send analytics event (Google Analytics)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'app_download_initiated', {
                    platform: platform,
                    content_type: '${type}',
                    content_id: '${contentId}',
                    app_name: 'FeedYum'
                });
            }
            
            // Send to your own analytics endpoint
            fetch('/api/analytics/download-initiated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform,
                    contentType: '${type}',
                    contentId: '${contentId}',
                    userAgent: navigator.userAgent,
                    timestamp: Date.now(),
                    appName: 'FeedYum'
                })
            }).catch(console.error);
        }
        
        // Handle app opening logic
        document.getElementById('openAppBtn').addEventListener('click', function(e) {
            e.preventDefault();
            
            const appUrl = '${appSchemeUrl}';
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            
            console.log('🚀 Attempting to open FeedYum app...');
            
            // Show loading state
            document.getElementById('loading').style.display = 'block';
            this.style.display = 'none';
            
            if (isAndroid) {
                // Android: Use intent with fallback to Play Store
                const intentUrl = 'intent://' + appUrl.replace('feedyum://', '') + '#Intent;scheme=feedyum;package=com.feedyum;S.browser_fallback_url=' + encodeURIComponent('${playStoreUrl}') + ';end';
                
                window.location = intentUrl;
                
                setTimeout(function() {
                    if (!document.hidden) {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('downloadButtons').style.display = 'block';
                    }
                }, 2500);
                
            } else if (isIOS) {
                // iOS: Try to open the app, fallback to download buttons
                window.location = appUrl;
                
                setTimeout(function() {
                    if (!document.hidden) {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('downloadButtons').style.display = 'block';
                    }
                }, 2000);
                
            } else {
                // Desktop or other platforms
                document.getElementById('loading').style.display = 'none';
                document.getElementById('downloadButtons').style.display = 'block';
            }
        });
        
        // Handle visibility change (app opened successfully)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                console.log('✅ User switched to FeedYum app');
                // User switched to the app, track success
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'app_opened_from_link', {
                        content_type: '${type}',
                        content_id: '${contentId}',
                        app_name: 'FeedYum'
                    });
                }
            }
        });
        
        // Auto-show download buttons after 3 seconds if still on page
        setTimeout(function() {
            if (!document.hidden) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('downloadButtons').style.display = 'block';
            }
        }, 3000);
        
        // Add page load analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: 'FeedYum Deep Link',
                content_type: '${type}',
                content_id: '${contentId}',
                app_name: 'FeedYum'
            });
        }
    </script>
    
    <!-- Google Analytics (replace with your tracking ID) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID');
    </script>
</body>
</html>`;

        res.send(htmlContent);

    } catch (error) {
        console.error('Web fallback error:', error);
        res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>FeedYum</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>FeedYum</h1>
        <p>Download FeedYum from the Play Store to see this content!</p>
        <a href="https://play.google.com/store/apps/details?id=com.foodtok" 
           style="background: #01875f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
          Download Now
        </a>
      </body>
      </html>
    `);
    }
};

// Helper functions for content-specific messaging
function getContentTitle(type, contentId) {
    const titles = {
        reel: 'Amazing Food Recipe',
        profile: 'Chef Profile',
        chefProfile: 'Chef Profile',
        chefMenu: 'Chef Menu',
        menu: 'Food Menu',
        dish: 'Delicious Recipe',
        live: 'Live Cooking',
        story: 'Food Story'
    };
    return titles[type] || 'FeedYum Content';
}

function getOGTitle(type, contentId) {
    const titles = {
        reel: 'Check out this amazing reel on FeedYum!',
        profile: 'Check out this chef profile on FeedYum!',
        chefProfile: 'Check out this talented chef on FeedYum!',
        chefMenu: 'Check out this delicious menu on FeedYum!',
        menu: 'Browse this amazing menu on FeedYum!',
        dish: 'Check out this delicious recipe on FeedYum!',
        live: 'Join this live cooking session on FeedYum!',
        story: 'Check out this food story on FeedYum!'
    };
    return titles[type] || 'Discover amazing food content on FeedYum!';
}

function getOGDescription(type) {
    const descriptions = {
        reel: 'Discover amazing dishes and cooking videos from talented food creators.',
        profile: 'Connect with food creators and discover their delicious content.',
        chefProfile: 'Meet talented chefs and explore their culinary creations.',
        chefMenu: 'Explore delicious dishes and discover amazing dishes.',
        menu: 'Browse amazing food options and discover new dishes.',
        dish: 'Discover this delicious recipe and many more on FeedYum.',
        live: 'Join live cooking sessions and learn from expert chefs.',
        story: 'Follow food stories and cooking journeys from creators.'
    };
    return descriptions[type] || 'Join the FeedYum community and discover amazing dishes and food content!';
}

function getContentDescription(type, contentId) {
    const descriptions = {
        reel: 'Watch this amazing cooking video and discover more food content!',
        profile: 'Check out this food creator\'s profile and their amazing dishes!',
        chefProfile: 'Meet this talented chef and explore their culinary journey!',
        chefMenu: 'Browse this chef\'s delicious menu and discover great dishes!',
        menu: 'Explore this amazing menu and discover delicious dishes!',
        dish: 'Check out this mouth-watering recipe and learn how to make it!',
        live: 'Join this live cooking session and learn from the chef!',
        story: 'Follow this food story and discover the creator\'s journey!'
    };
    return descriptions[type] || 'Discover amazing food content on FeedYum!';
}

module.exports = generateWebFallback; 