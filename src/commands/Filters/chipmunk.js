const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "chipmunk",
  aliases: ["chip"],
  description: "Toggle the Chipmunk filter for the current song.",
  category: "Filters",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,
  voteOnly: false,
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

      // 🔍 Detect if Chipmunk is currently active
      const isActive =
        player.filters.timescale?.speed === 1.05 &&
        player.filters.timescale?.pitch === 1.35 &&
        player.filters.timescale?.rate === 1.25;

      // 🎛 Lavalink filter payload (v4)
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct key for Lavalink v4
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 } // Reset if already ON
          : { speed: 1.05, pitch: 1.35, rate: 1.25 }, // Chipmunk style
      };

      // 🛰 Send safely to Lavalink / Riffy
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache new filter state
      player.filters.timescale = filterData.timescale;

      // 🔄 Refresh instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼 Embed feedback
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Chipmunk filter disabled.** Back to normal pitch"
            : "<:check:1433806961773903914> | **Chipmunk filter enabled!** Squeaky fun activated"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Chipmunk error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Chipmunk filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
