require("../config/firebase");
const { getMessaging } = require("firebase-admin/messaging");

/**
 * Send a multicast message to multiple FCM tokens.
 * @param {Array<string>} tokens - Array of FCM device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} [imageUrl] - Optional image URL
 * @returns {Promise<Object>} Object with successCount and failureCount
 */
const sendMulticastNotification = async (tokens, title, body, imageUrl = null) => {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const message = {
    notification: {
      title,
      body,
      ...(imageUrl && { image: imageUrl }),
    },
    tokens, // Array of tokens to send to
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.error("Error sending multicast notification:", error);
    throw error;
  }
};

module.exports = {
  sendMulticastNotification,
};
