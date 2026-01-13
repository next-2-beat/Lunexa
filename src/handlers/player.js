const client = require("../index");
const { EmbedBuilder } = require("discord.js");
const db = require("../models/SetupSchema");
const updateMessage = require("../handlers/setupQueue.js");

module.exports = async (client, track) => {
  // Prevent multiple listener registration
  if (client._lunexaHandlersLoaded) return;
  client._lunexaHandlersLoaded = true;

  // 🟣 Track End
  client.manager.on("trackEnd", async (player) => {
    try {
      await updateMessage(player, client, track);

      // Handle autoplay if enabled
      if (player.isAutoplay && player.queue.length === 0) {
        const requester = player.data.autoplayRequester;
        const identifier = player.data.autoplayIdentifier || player.current?.info?.identifier;
        
        if (!identifier) return;

        const title = player.current?.info?.title || "unknown";
        const author = player.current?.info?.author || "";

        const node = client.manager.nodeMap?.values().next().value;
        if (!node) return;
        
        // Try YouTube autoplay first (most reliable)
        let res;
        try {
          res = await client.manager.resolve({
            query: `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`,
            source: "ytmsearch",
            requester: requester || { id: client.user.id },
            node: node
          });
        } catch (err) {
          console.error(`[AUTOPLAY] YouTube search failed:`, err);
        }

        // If YouTube fails, try searching by title and author
        if (!res || !res.tracks?.length) {
          try {
            res = await client.manager.resolve({
              query: `${title} ${author}`,
              source: "ytmsearch",
              requester: requester || { id: client.user.id },
              node: node
            });
          } catch (err) {
            console.error(`[AUTOPLAY] Fallback search failed:`, err);
          }
        }

        if (res?.tracks?.length) {
          // Filter out the current track and add a random one
          const filteredTracks = res.tracks.filter(t => t.info.identifier !== identifier);
          if (filteredTracks.length > 0) {
            const nextTrack = filteredTracks[Math.floor(Math.random() * filteredTracks.length)];
            player.queue.add(nextTrack);
          }
        }
      }
    } catch (err) {
      console.log(`Error in trackEnd event: ${err}`);
    }
  });

  // 🟣 Queue Empty
  client.manager.on("queueEnd", async (player) => {
    try {
      await updateMessage(player, client, track);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Lunexa Music Queue Finished",
          iconURL: client.user.displayAvatarURL(),
        })
        .setColor(client.color)
        .setDescription(
          `> The music queue has now reached its end.\n\n` +
          `> Thank you for vibing with **Lunexa**! 💜\n\n` +
          `> Invite Lunexa to more servers or join our support server to stay updated:\n\n` +
          `> [Invite Lunexa](https://discord.com/oauth2/authorize?client_id=1390965840437968896&permissions=8&integration_type=0&scope=bot)\n` +
          `> [Join Support Server](https://discord.gg/eMnU7MQ2Zm)`
        )
        .setFooter({
          text: "NexCloud Hosting",
          iconURL: client.user.displayAvatarURL(),
        })
        .setImage(
          "https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?format=webp&quality=lossless&width=544&height=192"
        );

      const data = await db.findOne({ guildId: player.guildId });
      const textChannelId = player.textId || player.textChannel;
      if (data && data.channelId === textChannelId) return;

      const textChannel =
        client.channels.cache.get(textChannelId) ||
        (textChannelId ? await client.channels.fetch(textChannelId).catch(() => null) : null);

      if (!textChannel) return;

      const msg = await textChannel
        ?.send({ embeds: [embed] })
        .catch(() => null);

      if (msg) {
        player.data.message = msg;

        setTimeout(async () => {
          if (msg.deletable) {
            try {
              await msg.delete().catch(() => {});
            } catch {}
          }
        }, 10000);
      }

      // ✅ Destroy player
      if (player) player.destroy();

    } catch (err) {
      console.log(`Error in playerEmpty event: ${err}`);
    }
  });

  // 🟣 Player Moved
  client.manager.on("playerMoved", async (player) => {
    try {
      const guild = client.guilds.cache.get(player.guildId);
      const textChannelId = player.textId || player.textChannel;
      const channel = guild?.channels?.cache.get(textChannelId) ||
        (textChannelId ? await client.channels.fetch(textChannelId).catch(() => null) : null);

      const messageId = player.data?.message;

      if (channel && messageId) {
        try {
          const message = await channel.messages.fetch(messageId);
          if (message) await message.delete().catch(() => {});
        } catch (err) {
          console.log(`Failed to delete Now Playing message: ${err}`);
        }
      }

      // ✅ Destroy player
      if (player) player.destroy();

    } catch (err) {
      console.log(`Error in playerMoved event: ${err}`);
    }
  });
};
