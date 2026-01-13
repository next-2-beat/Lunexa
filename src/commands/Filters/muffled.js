const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "muffled",
  aliases: ["distant"],
  description: "Toggle the Muffled filter for the current song.",
  category: "Filters",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,
  premium: true,

  run: async (client, message, args, prefix, player) => {
    if (!player) {
      const embed = new EmbedBuilder()
        .setDescription("<:cross:1433807192003444848> | No player found in this guild!")
        .setColor(client.config.color);
      return message.reply({ embeds: [embed] });
    }

    try {
      if (!player.filters) player.filters = {};

      // 🔍 Detect if Muffled filter is currently active
      const isActive = player.filters.equalizer?.[4]?.gain === -0.4;

      // 🎛 Lavalink v4 filter payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ Lavalink v4 correct key
        equalizer: isActive
          ? [] // Reset EQ (turn filter OFF)
          : [
              { band: 0, gain: 0.4 },
              { band: 1, gain: 0.3 },
              { band: 2, gain: 0.1 },
              { band: 3, gain: -0.2 },
              { band: 4, gain: -0.4 },
              { band: 5, gain: -0.5 },
              { band: 6, gain: -0.6 },
              { band: 7, gain: -0.7 },
              { band: 8, gain: -0.7 },
              { band: 9, gain: -0.5 },
              { band: 10, gain: -0.3 },
              { band: 11, gain: 0 },
            ],
      };

      // 🛰 Safely send to Lavalink / Riffy node
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache the new filter state
      player.filters.equalizer = filterData.equalizer;

      // 🔄 Apply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼 Embed response
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Muffled filter disabled.** Back to clear sound"
            : "<:check:1433806961773903914> | **Muffled filter enabled!** Enjoy that distant, soft vibe"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Muffled error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Muffled filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
