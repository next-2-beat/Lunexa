// Utility functions for the bot

/**
 * Safely send a message to a channel, handling common errors
 * @param {TextChannel} channel - The channel to send the message to
 * @param {Object} options - The message options
 * @returns {Promise<Message|void>}
 */
async function safeSendMessage(channel, options) {
  try {
    if (!channel) return;
    return await channel.send(options);
  } catch (error) {
    // Ignore common errors that don't need to be logged
    if (error.message.includes("ChannelNotCached") || 
        error.message.includes("Missing Permissions") ||
        error.message.includes("Unknown Channel")) {
      return;
    }
    console.error("[UTIL] Error sending message:", error);
  }
}

/**
 * Safely delete a message, handling common errors
 * @param {Message} message - The message to delete
 * @returns {Promise<void>}
 */
async function safeDeleteMessage(message) {
  try {
    if (!message || !message.deletable) return;
    await message.delete();
  } catch (error) {
    // Ignore common errors that don't need to be logged
    if (error.message.includes("ChannelNotCached") || 
        error.message.includes("Unknown Message") ||
        error.message.includes("Missing Permissions")) {
      return;
    }
    console.error("[UTIL] Error deleting message:", error);
  }
}

/**
 * Safely edit a message, handling common errors
 * @param {Message} message - The message to edit
 * @param {Object} options - The edit options
 * @returns {Promise<Message|void>}
 */
async function safeEditMessage(message, options) {
  try {
    if (!message) return;
    return await message.edit(options);
  } catch (error) {
    // Ignore common errors that don't need to be logged
    if (error.message.includes("ChannelNotCached") || 
        error.message.includes("Unknown Message") ||
        error.message.includes("Missing Permissions")) {
      return;
    }
    console.error("[UTIL] Error editing message:", error);
  }
}

/**
 * Safely send to a webhook, handling common errors
 * @param {WebhookClient} webhook - The webhook client
 * @param {Object} options - The webhook options
 * @returns {Promise<Message|void>}
 */
async function safeSendWebhook(webhook, options) {
  try {
    if (!webhook) return;
    return await webhook.send(options);
  } catch (error) {
    // Ignore common errors that don't need to be logged
    if (error.message.includes("Unknown Webhook") || 
        error.message.includes("Invalid Webhook Token") ||
        error.message.includes("Missing Access")) {
      return;
    }
    console.error("[UTIL] Error sending webhook:", error);
  }
}

module.exports = {
  safeSendMessage,
  safeDeleteMessage,
  safeEditMessage,
  safeSendWebhook
};