const notificationTranslations = {
    // Order Status
    orderReceived: {
        en: 'Order Received',
        ar: 'تم استلام الطلب'
    },
    orderConfirmed: {
        en: 'Order Confirmed',
        ar: 'تم تأكيد الطلب'
    },
    orderInProgress: {
        en: 'Order in Progress',
        ar: 'الطلب قيد التحضير'
    },
    orderReady: {
        en: 'Order Ready',
        ar: 'الطلب جاهز'
    },
    orderDelivered: {
        en: 'Order Delivered',
        ar: 'تم توصيل الطلب'
    },
    orderCancelled: {
        en: 'Order Cancelled',
        ar: 'تم إلغاء الطلب'
    },
    orderUpdate: {
        en: 'Order Update',
        ar: 'تحديث الطلب'
    },

    // Awaiting Confirmation Reminder
    awaitingConfirmationTitle: {
        en: 'Order Needs Your Confirmation! ⏰',
        ar: 'الطلب بحاجة لتأكيدك! ⏰'
    },
    awaitingConfirmationMessage: {
        en: (chefName) => `${chefName} has accepted your order and is waiting for your confirmation`,
        ar: (chefName) => `وافق ${chefName} على طلبك وينتظر تأكيدك`
    },

    // Order Messages
    pendingMessage: {
        en: (chefName) => `Your order is being reviewed by chef ${chefName}`,
        ar: (chefName) => `طلبك قيد المراجعة بواسطة الشيف ${chefName}`
    },
    confirmedMessage: {
        en: (chefName) => `${chefName} confirmed your order!`,
        ar: (chefName) => `وافق ${chefName} على طلبك!`
    },
    preparingMessage: {
        en: (chefName) => `${chefName} is preparing your delicious meal`,
        ar: (chefName) => `يقوم ${chefName} بتحضير وجبتك اللذيذة`
    },
    readyMessage: {
        en: 'Your order is ready for pickup/delivery!',
        ar: 'طلبك جاهز للاستلام/التوصيل!'
    },
    outForDeliveryTitle: {
        en: 'Order Out for Delivery! 🚗',
        ar: 'الطلب في الطريق إليك! 🚗'
    },
    outForDeliveryMessage: {
        en: (chefName) => `Your order from ${chefName} is on its way!`,
        ar: (chefName) => `طلبك من ${chefName} في الطريق إليك!`
    },
    completedMessage: {
        en: 'Your order has been delivered. Enjoy your meal!',
        ar: 'تم توصيل طلبك. استمتع بوجبتك!'
    },
    cancelledMessage: {
        en: (chefName) => `Unfortunately, your order has been cancelled by ${chefName}`,
        ar: (chefName) => `للأسف، تم إلغاء طلبك بواسطة ${chefName}`
    },
    statusUpdateMessage: {
        en: (status) => `Your order status has been updated to ${status}`,
        ar: (status) => `تم تحديث حالة طلبك إلى ${status}`
    },

    // Chef Notifications
    newOrderTitle: {
        en: 'New Order Received!',
        ar: 'استلمت طلب جديد!'
    },
    newOrderMessage: {
        en: (name, total, count) => `${name} placed an order for £${total} (${count} items)`,
        ar: (name, total, count) => `قام ${name} بطلب بقيمة £${total} (${count} عناصر)`
    },

    // Chat
    sentMedia: {
        en: (type) => `Sent a ${type}`,
        ar: (type) => `أرسل ${type}` // type relies on frontend mapping usually, but we fallback gracefully
    },

    // Social
    newLikeTitle: {
        en: 'New Like! 👍',
        ar: 'إعجاب جديد! 👍'
    },
    likedReelMessage: {
        en: (name, title) => title ? `${name} liked your reel "${title}"` : `${name} liked your reel`,
        ar: (name, title) => title ? `أعجب ${name} بمقطعك "${title}"` : `أعجب ${name} بمقطعك`
    },
    likedPostMessage: {
        en: (name, type) => `${name} liked your ${type}`,
        ar: (name, type) => `أعجب ${name} بمنشورك`
    },

    // Comments
    newCommentTitle: {
        en: 'New Comment! 💬',
        ar: 'تعليق جديد! 💬'
    },
    commentedReelMessage: {
        en: (name, title, comment) => title ? `${name} commented on "${title}": ${comment}` : `${name} commented: ${comment}`,
        ar: (name, title, comment) => title ? `علق ${name} على "${title}": ${comment}` : `علق ${name}: ${comment}`
    },
    commentedPostMessage: {
        en: (name, comment) => `${name}: ${comment}`,
        ar: (name, comment) => `${name}: ${comment}`
    },

    // Shares
    reelSharedTitle: {
        en: 'Reel Shared! 🔄',
        ar: 'تم مشاركة المقطع! 🔄'
    },
    reelSharedMessage: {
        en: (name, title) => title ? `${name} shared your reel "${title}"` : `${name} shared your reel`,
        ar: (name, title) => title ? `شارك ${name} مقطعك "${title}"` : `شارك ${name} مقطعك`
    },

    // Menu Updates
    newDishTitle: {
        en: 'New Dish Available! 🍽️',
        ar: 'طبق جديد متاح! 🍽️'
    },
    newDishMessage: {
        en: (chefName, dishName) => `${chefName} added a new dish: ${dishName}`,
        ar: (chefName, dishName) => `أضاف ${chefName} طبقاً جديداً: ${dishName}`
    },
    newMenuTitle: {
        en: 'New Menu! 📋',
        ar: 'قائمة جديدة! 📋'
    },
    newMenuMessage: {
        en: (chefName, menuName) => `${chefName} created a new menu: ${menuName}`,
        ar: (chefName, menuName) => `أنشأ ${chefName} قائمة جديدة: ${menuName}`
    },
    menuUpdatedTitle: {
        en: 'Menu Updated! ✨',
        ar: 'تم تحديث القائمة! ✨'
    },
    menuUpdatedMessage: {
        en: (chefName) => `${chefName} updated their menu`,
        ar: (chefName) => `قامت مطبخ ${chefName} تحديث قائمتها`
    },
    specialOfferTitle: {
        en: 'Special Offer! 🎉',
        ar: 'عرض خاص! 🎉'
    },
    specialOfferMessage: {
        en: (chefName, dishName) => `${chefName} has a special offer on ${dishName || 'selected items'}`,
        ar: (chefName, dishName) => `لدى ${chefName} عرض خاص على ${dishName || 'عناصر مختارة'}`
    },

    // Ratings
    newRatingTitle: {
        en: 'New Rating! ⭐',
        ar: 'تقييم جديد! ⭐'
    },
    ratingMessage: {
        en: (raterName, dishName, stars, rating, review) =>
            dishName
                ? `${raterName} rated your ${dishName} ${stars} (${rating}/5)${review ? `: "${review}"` : ''}`
                : `${raterName} gave you ${stars} (${rating}/5)${review ? `: "${review}"` : ''}`,
        ar: (raterName, dishName, stars, rating, review) =>
            dishName
                ? `قيم ${raterName} طبقك ${dishName} ${stars} (${rating}/5)${review ? `: "${review}"` : ''}`
                : `قيمك ${raterName} بـ ${stars} (${rating}/5)${review ? `: "${review}"` : ''}`
    },

    // New Review (Chef Dashboard)
    newReviewTitle: {
        en: 'New Review!',
        ar: 'مراجعة جديدة!'
    },

    // Follows
    newFollowerTitle: {
        en: 'New Follower! 👤',
        ar: 'متابع جديد! 👤'
    },
    newChefFollowerTitle: {
        en: 'New Chef Follower! 👨‍🍳',
        ar: 'شيف متابع جديد! 👨‍🍳'
    },
    startedFollowingMessage: {
        en: (name) => `${name} started following you`,
        ar: (name) => `بدأ ${name} بمتابعتك`
    },
    chefStartedFollowingMessage: {
        en: (name) => `Chef ${name} started following you`,
        ar: (name) => `بدأ الشيف ${name} بمتابعتك`
    },

    // Profile View
    profileViewTitle: {
        en: 'Profile View 👀',
        ar: 'زيارة لملفك الشخصي 👀'
    },
    profileViewMessage: {
        en: (name) => `${name} viewed your profile`,
        ar: (name) => `قام ${name} بزيارة ملفك الشخصي`
    },

    // Mentions
    mentionTitle: {
        en: 'You were mentioned! 🏷️',
        ar: 'تم ذكرك! 🏷️'
    },
    mentionMessage: {
        en: (name, title, type) => title ? `${name} mentioned you in "${title}"` : `${name} mentioned you in a ${type}`,
        ar: (name, title, type) => title ? `ذكرك ${name} في "${title}"` : `ذكرك ${name} في ${type}`
    },

    // Live Stream
    goingLiveTitle: {
        en: '🔴 Going Live!',
        ar: '🔴 بث مباشر الآن!'
    },
    goingLiveMessage: {
        en: (name, title) => `${name} is now live: ${title}`,
        ar: (name, title) => `${name} يبث الآن: ${title}`
    }
};

module.exports = notificationTranslations;
