const client = require("./oneSignalNotification");
const { oneSignalAppId } = require("../config/keys");

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

      const notification = {
        app_id: oneSignalAppId,
        headings: { en: title },
        contents: { en: message },
        include_external_user_ids: userIds.map(id => id.toString()),
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
        ttl: 86400 // 24 hours
      };

      // Add media if provided
      if (largeIcon) {
        notification.large_icon = largeIcon;
      }

      if (bigPicture) {
        notification.big_picture = bigPicture;
      }

      const response = await client.createNotification(notification);
      console.log(`${type} notification sent successfully:`, response);
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
    orderDetails = {},
    estimatedTime = null
  }) {
    const statusMessages = {
      pending: `Your order is being reviewed by chef ${chefName}`,
      confirmed: `${chefName} confirmed your order! Estimated time: ${estimatedTime || '30-45 mins'}`,
      preparing: `${chefName} is preparing your delicious meal`,
      ready: `Your order is ready for pickup/delivery!`,
      completed: `Your order has been delivered. Enjoy your meal!`,
      cancelled: `Unfortunately, your order has been cancelled by ${chefName}`
    };

    const statusTitles = {
      pending: 'Order Received',
      confirmed: 'Order Confirmed',
      preparing: 'Order in Progress',
      ready: 'Order Ready',
      completed: 'Order Delivered',
      cancelled: 'Order Cancelled'
    };

    return this.sendNotification({
      userIds: [userId],
      title: statusTitles[status] || 'Order Update',
      message: statusMessages[status] || `Your order status has been updated to ${status}`,
      type: 'orderTracking',
      targetId: orderId,
      additionalData: {
        status,
        chefName,
        estimatedTime,
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
      title: 'New Order Received!',
      message: `${customerName} placed an order for £${orderTotal} (${itemCount} items)`,
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
    messageType = 'text'
  }) {
    const messagePreview = messageType === 'text'
      ? (message.length > 50 ? `${message.substring(0, 50)}...` : message)
      : `Sent a ${messageType}`;

    return this.sendNotification({
      userIds: [recipientId],
      title: senderName,
      message: messagePreview,
      type: 'chat',
      targetId: senderId,
      additionalData: {
        senderId,
        senderName,
        messageType,
        chatId: chatId || senderId
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
    const message = reelTitle
      ? `${likerName} liked your reel "${reelTitle}"`
      : `${likerName} liked your reel`;

    return this.sendNotification({
      userIds: [reelOwnerId],
      title: 'New Like! 👍',
      message,
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

    const message = reelTitle
      ? `${commenterName} commented on "${reelTitle}": ${commentPreview}`
      : `${commenterName} commented: ${commentPreview}`;

    return this.sendNotification({
      userIds: [reelOwnerId],
      title: 'New Comment! 💬',
      message,
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
    const message = reelTitle
      ? `${sharerName} shared your reel "${reelTitle}"`
      : `${sharerName} shared your reel`;

    return this.sendNotification({
      userIds: [reelOwnerId],
      title: 'Reel Shared! 🔄',
      message,
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
    let title, message;

    switch (updateType) {
      case 'new_dish':
        title = 'New Dish Available! 🍽️';
        message = `${chefName} added a new dish: ${dishName}`;
        break;
      case 'new_menu':
        title = 'New Menu! 📋';
        message = `${chefName} created a new menu: ${menuName}`;
        break;
      case 'menu_update':
        title = 'Menu Updated! ✨';
        message = `${chefName} updated their menu`;
        break;
      case 'special_offer':
        title = 'Special Offer! 🎉';
        message = `${chefName} has a special offer on ${dishName || 'selected items'}`;
        break;
      default:
        title = 'Menu Update';
        message = `${chefName} updated their menu`;
    }

    return this.sendNotification({
      userIds: followerIds,
      title,
      message,
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
    const message = review
      ? `${raterName} rated your ${dishName} ${stars} (${rating}/5): "${review.substring(0, 50)}..."`
      : `${raterName} rated your ${dishName} ${stars} (${rating}/5)`;

    return this.sendNotification({
      userIds: [chefId],
      title: 'New Rating! ⭐',
      message,
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
    const title = followerType === 'chef' ? 'New Chef Follower! 👨‍🍳' : 'New Follower! 👤';
    const message = followerType === 'chef'
      ? `Chef ${followerName} started following you`
      : `${followerName} started following you`;

    return this.sendNotification({
      userIds: [followedUserId],
      title,
      message,
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
      title: 'Profile View 👀',
      message: `${viewerName} viewed your profile`,
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
    const message = contentTitle
      ? `${mentionerName} mentioned you in "${contentTitle}"`
      : `${mentionerName} mentioned you in a ${contentType}`;

    return this.sendNotification({
      userIds: [mentionedUserId],
      title: 'You were mentioned! 🏷️',
      message,
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
    const message = dishName
      ? `${reviewerName} rated your ${dishName} ${stars} (${rating}/5)`
      : `${reviewerName} gave you ${stars} (${rating}/5)`;

    return this.sendNotification({
      userIds: [chefId],
      title: 'New Review!',
      message,
      type: 'chefDashboard',
      targetId: null,
      additionalData: {
        action: 'new_review',
        reviewerId,
        reviewerName,
        rating,
        comment: comment?.substring(0, 100),
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
      title: '🔴 Going Live!',
      message: `${streamerName} is now live: ${streamTitle}`,
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
      title: 'New Like!',
      message: `${likerName} liked your ${postType}`,
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
      title: 'New Comment!',
      message: `${commenterName}: ${commentPreview}`,
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
      title,
      message,
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
      const notification = {
        app_id: oneSignalAppId,
        headings: { en: title },
        contents: { en: message },
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
      console.log('Bulk notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to send bulk notification:', error);
      throw error;
    }
  }
}

module.exports = EnhancedNotificationService; 