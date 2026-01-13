const { EmbedBuilder } = require("discord.js");

module.exports = async (client) => {
  const cleanNowPlaying = async (player) => {
    try {
      // Ensure player.data is an object (Riffy uses plain objects)
      if (!player.data || typeof player.data !== 'object') {
        player.data = {};
      }

      const nowPlayingMessage = player.data.nplaying;
      if (nowPlayingMessage) {
        const channel = client.channels.cache.get(nowPlayingMessage.channelId);
        if (channel) {
          try {
            const message = await channel.messages.fetch(nowPlayingMessage.id).catch(() => null);
            if (message && message.deletable) {
              await message.delete().catch(() => {});
            }
          } catch (error) {
            if (!error.message.includes("ChannelNotCached") && !error.message.includes("Unknown Message")) {
              console.error("[PLAYER_EVENTS] Error cleaning message:", error);
            }
          }
        }

        delete player.data.nplaying;
      }
    } catch (error) {
      if (!error.message.includes("ChannelNotCached")) {
        console.error("[PLAYER_EVENTS] Error in cleanNowPlaying:", error);
      }
    }
  };

  client.manager.on("trackEnd", async (player) => {
    try {
      await cleanNowPlaying(player);
    } catch (error) {
      console.error("[PLAYER_EVENTS] Error in trackEnd handler:", error);
    }
  });

  client.manager.on("playerDestroy", async (player) => {
    try {
      await cleanNowPlaying(player);
  console.log(`[PLAYER_EVENTS] Player destroyed for guild ${player.guildId}`);
    } catch (error) {
      console.error("[PLAYER_EVENTS] Error in playerDestroy handler:", error);
    }
  });

  client.manager.on("playerException", async (player, error) => {
    try {
  console.error(`[PLAYER_EVENTS] Player exception for guild ${player.guildId}:`, error);
      await cleanNowPlaying(player);
    } catch (err) {
      console.error("[PLAYER_EVENTS] Error in playerException handler:", err);
    }
  });
};