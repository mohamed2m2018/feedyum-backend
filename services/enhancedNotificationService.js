const client = require("./oneSignalNotification");
const { oneSignalAppId } = require("../config/keys");
const trans = require("./notificationTranslations");

class EnhancedNotificationService {
  // Generate deep link URL
  static generateDeepLink(type, id, params = {}) {
    const baseUrl = 'feedyum://'; // Your app's URL scheme (matches package name)
    const queryString = new URLSearchParams(params).toString();
    const query = queryString ? `?${queryString}` : '';

    switch (type) {
      case 'order':
      case 'orderTracking':
        return `${baseUrl}/order/${id}/track${query}`;
      case 'chat':
        return `${baseUrl}/chat/${id}${query}`;
      case 'chatList':
        return `${baseUrl}/chat${query}`;

      // Reel/Video links
      case 'reel':
      case 'video':
        return `${baseUrl}/reel/${id}${query}`;
      case 'story':
        return `${baseUrl}/story/${id}${query}`;
      case 'reviewReel':
        return `${baseUrl}/review-reel/${id}${query}`;
      case 'reels':
        return `${baseUrl}/reels${query}`;

      // Profile links
      case 'profile':
      case 'userProfile':
        return `${baseUrl}/profile/${id}${query}`;
      case 'profileByUsername':
        return `${baseUrl}/u/${id}${query}`;

      // Chef links
      case 'chefProfile':
        return `${baseUrl}/chef/${id}${query}`;
      case 'chefByUsername':
        return `${baseUrl}/chef/${id}${query}`;
      case 'chefMenu':
        return `${baseUrl}/chef/${id}/menu${query}`;
      case 'chefDashboard':
        return `${baseUrl}/chef/dashboard${query}`;

      // Menu links
      case 'menu':
        return `${baseUrl}/menu/${id}${query}`;
      case 'menuItem':
        return `${baseUrl}/menu/${id}/item/${params.itemId}${query}`;
      case 'dish':
      case 'dishDetail':
        return `${baseUrl}/dish/${id}${query}`;

      // Discovery links
      case 'discover':
        return `${baseUrl}/discover${query}`;
      case 'discoverCategory':
        return `${baseUrl}/discover/${id}${query}`;
      case 'trending':
        return `${baseUrl}/trending${query}`;
      case 'search':
        return `${baseUrl}/search${query}`;

      // Social links
      case 'following':
        return `${baseUrl}/profile/${id}/following${query}`;
      case 'followers':
        return `${baseUrl}/profile/${id}/followers${query}`;
      case 'likes':
        return `${baseUrl}/profile/${id}/likes${query}`;
      case 'posts':
        return `${baseUrl}/profile/${id}/posts${query}`;

      // Live streaming
      case 'live':
        return `${baseUrl}/live/${id}${query}`;
      case 'liveStream':
        return `${baseUrl}/live${query}`;

      // General links
      case 'post':
        return `${baseUrl}/post/${id}${query}`;
      case 'hashtag':
        return `${baseUrl}/hashtag/${id}${query}`;
      case 'sound':
        return `${baseUrl}/sound/${id}${query}`;

      // Support
      case 'supportChat':
        return `${baseUrl}/support-chat${query}`;

      default:
        return `${baseUrl}/${query}`;
    }
  }

  // Generate universal links for sharing
  static generateUniversalLink(type, id, params = {}) {
    const baseUrl = 'https://feedyum.com'; // Your web domain
    const deepLink = this.generateDeepLink(type, id, params);
    return deepLink.replace('feedyum://', baseUrl);
  }

  // Generate shareable links with fallback
  static generateShareableLink(type, id, params = {}) {
    return {
      deepLink: this.generateDeepLink(type, id, params),
      universalLink: this.generateUniversalLink(type, id, params),
      webFallback: `https://food2k.com/${type}/${id || ''}${params ? '?' + new URLSearchParams(params).toString() : ''}`
    };
  }

  // Base notification sending method
  static async sendNotification({
    userIds,
    title,
    message,
    type,
    targetId = null,
    additionalData = {},
    largeIcon = null,
    bigPicture = null
  }) {
    try {
      const deepLink = this.generateDeepLink(type, targetId, additionalData);

      // Handle multi-language titles and messages
      // If title/message is a string, wrapper it; if object, use as is (assuming {en, ar})
      const headings = typeof title === 'object' ? title : { en: title };
      const contents = typeof message === 'object' ? message : { en: message };

      const notification = {
        app_id: oneSignalAppId,
        headings: headings,
        contents: contents,
        include_aliases: { external_id: userIds.map(id => id.toString()) },
        target_channel: 'push',
        data: {
          type,
          id: targetId,
          deepLink,
          timestamp: Date.now(),
          ...additionalData
        },
        // Android specific
        android_group: type,
        android_group_message: { en: `$[notif_count] new ${type} notifications` },
        // iOS specific
        ios_category: type,
        // Universal
        priority: 10,
        content_available: true, // Wake up iOS app in background
        mutable_content: true, // Allow media attachments
        ios_sound: 'default',
        android_sound: 'default',
        ttl: 86400 // 24 hours
      };

      // Add sound for Android/iOS if it's a chef order or critical
      if (type === 'chefDashboard' || type === 'orderTracking') {
        notification.priority = 10;
        notification.existing_android_channel_id = 'order_alarm_channel';
        notification.ios_sound = 'default';
        notification.android_sound = 'alarm_ringtone';
        // Data payload for background handler
        notification.data = { ...notification.data, alarmType: 'newOrder' };
      }

      // Add media if provided
      if (largeIcon) {
        notification.large_icon = largeIcon;
      }

      if (bigPicture) {
        notification.big_picture = bigPicture;
      }

      const response = await client.createNotification(notification);
      console.log(`${type} notification sent successfully: id=${response?.body?.id || 'n/a'}, status=${response?.statusCode || 'n/a'}`);
      return response;
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
      throw error;
    }
  }

  // Order status notification for customers
  static async sendOrderStatusNotification({
    userId,
    orderId,
    status,
    chefName,
    orderDetails = {}
  }) {
    let messageObj = { en: '', ar: '' };
    let titleObj = { en: '', ar: '' };

    switch (status) {
      case 'pending':
        titleObj = trans.orderReceived;
        messageObj = {
          en: trans.pendingMessage.en(chefName),
          ar: trans.pendingMessage.ar(chefName)
        };
        break;
      case 'awaiting_confirmation':
        titleObj = trans.awaitingConfirmationTitle;
        messageObj = {
          en: trans.awaitingConfirmationMessage.en(chefName),
          ar: trans.awaitingConfirmationMessage.ar(chefName)
        };
        break;
      case 'confirmed':
        titleObj = trans.orderConfirmed;
        messageObj = {
          en: trans.confirmedMessage.en(chefName),
          ar: trans.confirmedMessage.ar(chefName)
        };
        break;
      case 'preparing':
        titleObj = trans.orderInProgress;
        messageObj = {
          en: trans.preparingMessage.en(chefName),
          ar: trans.preparingMessage.ar(chefName)
        };
        break;
      case 'ready':
        titleObj = trans.orderReady;
        messageObj = trans.readyMessage;
        break;
      case 'out_for_delivery':
        titleObj = trans.outForDeliveryTitle;
        messageObj = {
          en: trans.outForDeliveryMessage.en(chefName),
          ar: trans.outForDeliveryMessage.ar(chefName)
        };
        break;
      case 'completed':
        titleObj = trans.orderDelivered;
        messageObj = trans.completedMessage;
        break;
      case 'cancelled':
        titleObj = trans.orderCancelled;
        messageObj = {
          en: trans.cancelledMessage.en(chefName),
          ar: trans.cancelledMessage.ar(chefName)
        };
        break;
      default:
        titleObj = trans.orderUpdate;
        messageObj = {
          en: trans.statusUpdateMessage.en(status),
          ar: trans.statusUpdateMessage.ar(status)
        };
    }

    return this.sendNotification({
      userIds: [userId],
      title: titleObj,
      message: messageObj,
      type: 'orderTracking',
      targetId: orderId,
      additionalData: {
        status,
        chefName,
        // Trigger alarm sound for awaiting_confirmation (customer must act)
        ...(status === 'awaiting_confirmation' && { alarmType: 'awaitingConfirmation' }),
        ...orderDetails
      }
    });
  }

  // New order notification for chefs
  static async sendNewOrderNotification({
    chefId,
    orderId,
    customerName,
    orderTotal,
    itemCount,
    customerAvatar = null
  }) {
    return this.sendNotification({
      userIds: [chefId],
      title: trans.newOrderTitle,
      message: {
        en: trans.newOrderMessage.en(customerName, orderTotal, itemCount),
        ar: trans.newOrderMessage.ar(customerName, orderTotal, itemCount)
      },
      type: 'chefDashboard',
      targetId: null,
      additionalData: {
        orderId,
        customerName,
        orderTotal,
        itemCount,
        action: 'new_order'
      },
      largeIcon: customerAvatar
    });
  }

  // Chat message notification
  static async sendChatNotification({
    recipientId,
    senderId,
    senderName,
    message,
    chatId = null,
    senderAvatar = null,
    messageType = 'text',
    orderId = null
  }) {
    let messagePreview = { en: '', ar: '' };

    if (messageType === 'text') {
      const previewText = message.length > 50 ? `${message.substring(0, 50)}...` : message;
      messagePreview = { en: previewText, ar: previewText };
    } else {
      messagePreview = {
        en: trans.sentMedia.en(messageType),
        ar: trans.sentMedia.ar(messageType)
      };
    }

    return this.sendNotification({
      userIds: [recipientId],
      title: { en: senderName, ar: senderName },
      message: messagePreview,
      type: 'chat',
      targetId: senderId,
      additionalData: {
        senderId,
        senderName,
        messageType,
        chatId: chatId || senderId,
        orderId
      },
      largeIcon: senderAvatar
    });
  }

  // Reel/Video related notifications
  static async sendReelLikeNotification({
    reelOwnerId,
    likerId,
    likerName,
    reelId,
    reelTitle = null,
    likerAvatar = null
  }) {
    return this.sendNotification({
      userIds: [reelOwnerId],
      title: trans.newLikeTitle,
      message: {
        en: trans.likedReelMessage.en(likerName, reelTitle),
        ar: trans.likedReelMessage.ar(likerName, reelTitle)
      },
      type: 'reel',
      targetId: reelId,
      additionalData: {
        action: 'new_like',
        likerId,
        likerName,
        reelTitle
      },
      largeIcon: likerAvatar
    });
  }

  static async sendReelCommentNotification({
    reelOwnerId,
    commenterId,
    commenterName,
    comment,
    reelId,
    reelTitle = null,
    commenterAvatar = null
  }) {
    const commentPreview = comment.length > 50
      ? `${comment.substring(0, 50)}...`
      : comment;

    return this.sendNotification({
      userIds: [reelOwnerId],
      title: trans.newCommentTitle,
      message: {
        en: trans.commentedReelMessage.en(commenterName, reelTitle, commentPreview),
        ar: trans.commentedReelMessage.ar(commenterName, reelTitle, commentPreview)
      },
      type: 'reel',
      targetId: reelId,
      additionalData: {
        action: 'new_comment',
        commenterId,
        commenterName,
        comment: commentPreview,
        reelTitle
      },
      largeIcon: commenterAvatar
    });
  }

  static async sendReelShareNotification({
    reelOwnerId,
    sharerId,
    sharerName,
    reelId,
    reelTitle = null,
    sharerAvatar = null,
    shareMessage = null
  }) {
    return this.sendNotification({
      userIds: [reelOwnerId],
      title: trans.reelSharedTitle,
      message: {
        en: trans.reelSharedMessage.en(sharerName, reelTitle),
        ar: trans.reelSharedMessage.ar(sharerName, reelTitle)
      },
      type: 'reel',
      targetId: reelId,
      additionalData: {
        action: 'reel_shared',
        sharerId,
        sharerName,
        shareMessage,
        reelTitle
      },
      largeIcon: sharerAvatar
    });
  }

  // Menu/Dish related notifications
  static async sendMenuUpdateNotification({
    followerIds,
    chefId,
    chefName,
    updateType,
    dishName = null,
    menuName = null,
    chefAvatar = null
  }) {
    let titleObj, messageObj;

    switch (updateType) {
      case 'new_dish':
        titleObj = trans.newDishTitle;
        messageObj = {
          en: trans.newDishMessage.en(chefName, dishName),
          ar: trans.newDishMessage.ar(chefName, dishName)
        };
        break;
      case 'new_menu':
        titleObj = trans.newMenuTitle;
        messageObj = {
          en: trans.newMenuMessage.en(chefName, menuName),
          ar: trans.newMenuMessage.ar(chefName, menuName)
        };
        break;
      case 'menu_update':
        titleObj = trans.menuUpdatedTitle;
        messageObj = {
          en: trans.menuUpdatedMessage.en(chefName),
          ar: trans.menuUpdatedMessage.ar(chefName)
        };
        break;
      case 'special_offer':
        titleObj = trans.specialOfferTitle;
        messageObj = {
          en: trans.specialOfferMessage.en(chefName, dishName),
          ar: trans.specialOfferMessage.ar(chefName, dishName)
        };
        break;
      default:
        titleObj = trans.menuUpdatedTitle;
        messageObj = {
          en: trans.menuUpdatedMessage.en(chefName),
          ar: trans.menuUpdatedMessage.ar(chefName)
        };
    }

    return this.sendNotification({
      userIds: followerIds,
      title: titleObj,
      message: messageObj,
      type: 'chefMenu',
      targetId: chefId,
      additionalData: {
        action: updateType,
        chefId,
        chefName,
        dishName,
        menuName
      },
      largeIcon: chefAvatar
    });
  }

  static async sendDishRatingNotification({
    chefId,
    raterId,
    raterName,
    rating,
    dishId,
    dishName,
    review = null,
    raterAvatar = null
  }) {
    const stars = '⭐'.repeat(rating);
    const reviewText = review ? review.substring(0, 50) + (review.length > 50 ? '...' : '') : null;

    return this.sendNotification({
      userIds: [chefId],
      title: trans.newRatingTitle,
      message: {
        en: trans.ratingMessage.en(raterName, dishName, stars, rating, reviewText),
        ar: trans.ratingMessage.ar(raterName, dishName, stars, rating, reviewText)
      },
      type: 'dish',
      targetId: dishId,
      additionalData: {
        action: 'new_rating',
        raterId,
        raterName,
        rating,
        dishName,
        review: review?.substring(0, 100)
      },
      largeIcon: raterAvatar
    });
  }

  // Profile/Social notifications
  static async sendFollowNotification({
    followedUserId,
    followerId,
    followerName,
    followerAvatar = null,
    followerType = 'user'
  }) {
    const titleObj = followerType === 'chef' ? trans.newChefFollowerTitle : trans.newFollowerTitle;
    const messageObj = followerType === 'chef'
      ? { en: trans.chefStartedFollowingMessage.en(followerName), ar: trans.chefStartedFollowingMessage.ar(followerName) }
      : { en: trans.startedFollowingMessage.en(followerName), ar: trans.startedFollowingMessage.ar(followerName) };

    return this.sendNotification({
      userIds: [followedUserId],
      title: titleObj,
      message: messageObj,
      type: 'profile',
      targetId: followerId,
      additionalData: {
        action: 'new_follower',
        followerId,
        followerName,
        followerType
      },
      largeIcon: followerAvatar
    });
  }

  static async sendProfileViewNotification({
    profileOwnerId,
    viewerId,
    viewerName,
    viewerAvatar = null
  }) {
    return this.sendNotification({
      userIds: [profileOwnerId],
      title: trans.profileViewTitle,
      message: {
        en: trans.profileViewMessage.en(viewerName),
        ar: trans.profileViewMessage.ar(viewerName)
      },
      type: 'profile',
      targetId: viewerId,
      additionalData: {
        action: 'profile_view',
        viewerId,
        viewerName
      },
      largeIcon: viewerAvatar
    });
  }

  static async sendProfileMentionNotification({
    mentionedUserId,
    mentionerId,
    mentionerName,
    contentId,
    contentType,
    contentTitle = null,
    mentionerAvatar = null
  }) {
    return this.sendNotification({
      userIds: [mentionedUserId],
      title: trans.mentionTitle,
      message: {
        en: trans.mentionMessage.en(mentionerName, contentTitle, contentType),
        ar: trans.mentionMessage.ar(mentionerName, contentTitle, contentType)
      },
      type: contentType,
      targetId: contentId,
      additionalData: {
        action: 'mention',
        mentionerId,
        mentionerName,
        contentType,
        contentTitle
      },
      largeIcon: mentionerAvatar
    });
  }

  // Chef dashboard notification (orders, reviews, etc.)
  static async sendChefDashboardNotification({
    chefId,
    title,
    message,
    action,
    targetId = null,
    additionalData = {}
  }) {
    // Assuming this general method might receive direct strings or objects
    // If strings are passed, wrap them for 'en' default, or caller should pass multi-lang objects
    return this.sendNotification({
      userIds: [chefId],
      title,
      message,
      type: 'chefDashboard',
      targetId,
      additionalData: {
        action,
        ...additionalData
      }
    });
  }

  // Review notification for chefs
  static async sendReviewNotification({
    chefId,
    reviewerId,
    reviewerName,
    rating,
    comment,
    dishName = null,
    reviewerAvatar = null
  }) {
    const stars = '⭐'.repeat(rating);
    const reviewText = comment?.substring(0, 100);

    return this.sendNotification({
      userIds: [chefId],
      title: trans.newReviewTitle,
      message: {
        en: trans.ratingMessage.en(reviewerName, dishName, stars, rating, reviewText),
        ar: trans.ratingMessage.ar(reviewerName, dishName, stars, rating, reviewText)
      },
      type: 'chefDashboard',
      targetId: null,
      additionalData: {
        action: 'new_review',
        reviewerId,
        reviewerName,
        rating,
        comment: reviewText,
        dishName
      },
      largeIcon: reviewerAvatar
    });
  }

  // Live streaming notifications
  static async sendLiveStreamNotification({
    followerIds,
    streamerId,
    streamerName,
    streamTitle,
    streamerAvatar = null
  }) {
    return this.sendNotification({
      userIds: followerIds,
      title: trans.goingLiveTitle,
      message: {
        en: trans.goingLiveMessage.en(streamerName, streamTitle),
        ar: trans.goingLiveMessage.ar(streamerName, streamTitle)
      },
      type: 'live',
      targetId: streamerId,
      additionalData: {
        action: 'live_stream_started',
        streamerId,
        streamerName,
        streamTitle
      },
      largeIcon: streamerAvatar
    });
  }

  // Like notification for posts
  static async sendLikeNotification({
    postOwnerId,
    likerId,
    likerName,
    postId,
    postType = 'post',
    likerAvatar = null
  }) {
    return this.sendNotification({
      userIds: [postOwnerId],
      title: trans.newLikeTitle,
      message: {
        en: trans.likedPostMessage.en(likerName, postType),
        ar: trans.likedPostMessage.ar(likerName, postType)
      },
      type: 'post',
      targetId: postId,
      additionalData: {
        action: 'new_like',
        likerId,
        likerName,
        postType
      },
      largeIcon: likerAvatar
    });
  }

  // Comment notification for posts
  static async sendCommentNotification({
    postOwnerId,
    commenterId,
    commenterName,
    comment,
    postId,
    postType = 'post',
    commenterAvatar = null
  }) {
    const commentPreview = comment.length > 50
      ? `${comment.substring(0, 50)}...`
      : comment;

    return this.sendNotification({
      userIds: [postOwnerId],
      title: trans.newCommentTitle,
      message: {
        en: trans.commentedPostMessage.en(commenterName, commentPreview),
        ar: trans.commentedPostMessage.ar(commenterName, commentPreview)
      },
      type: 'post',
      targetId: postId,
      additionalData: {
        action: 'new_comment',
        commenterId,
        commenterName,
        comment: commentPreview,
        postType
      },
      largeIcon: commenterAvatar
    });
  }

  // Promotional notification
  static async sendPromotionalNotification({
    userIds,
    title,
    message,
    promoCode = null,
    imageUrl = null,
    targetType = 'discover',
    targetId = null
  }) {
    return this.sendNotification({
      userIds,
      title, // Caller is responsible for passing {en: ..., ar: ...} or string
      message, // Caller is responsible for passing {en: ..., ar: ...} or string
      type: targetType,
      targetId,
      additionalData: {
        action: 'promotion',
        promoCode
      },
      bigPicture: imageUrl
    });
  }

  // Bulk notification for segments
  static async sendBulkNotification({
    filters,
    title,
    message,
    type = 'general',
    targetId = null,
    additionalData = {},
    scheduleTime = null
  }) {
    try {
      const headings = typeof title === 'object' ? title : { en: title };
      const contents = typeof message === 'object' ? message : { en: message };

      const notification = {
        app_id: oneSignalAppId,
        headings: headings,
        contents: contents,
        filters,
        data: {
          type,
          id: targetId,
          deepLink: this.generateDeepLink(type, targetId, additionalData),
          timestamp: Date.now(),
          ...additionalData
        }
      };

      if (scheduleTime) {
        notification.send_after = scheduleTime;
      }

      const response = await client.createNotification(notification);
      console.log(`Bulk notification sent successfully: id=${response?.body?.id || 'n/a'}, status=${response?.statusCode || 'n/a'}`);
      return response;
    } catch (error) {
      console.error('Failed to send bulk notification:', error);
      throw error;
    }
  }
}

module.exports = EnhancedNotificationService;
