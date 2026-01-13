const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "darthvader",
  aliases: ["vader", "darkvoice"],
  description: "Toggle the Darth Vader filter for the current song.",
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

      // 🔍 Detect if filter is already active
      const isActive =
        player.filters.timescale?.speed === 0.975 &&
        player.filters.timescale?.pitch === 0.5 &&
        player.filters.timescale?.rate === 0.8;

      // 🎛 Lavalink v4 payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct key
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 } // Reset (OFF)
          : { speed: 0.975, pitch: 0.5, rate: 0.8 }, // Darth Vader effect (ON)
      };

      // 🛰 Safely send to Lavalink/Riffy node
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

      // 🔄 Apply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🎨 Embed feedback
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Darth Vader filter disabled.** Back to normal sound"
            : "<:check:1433806961773903914> | **Darth Vader filter enabled!** Feel the dark side"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] DarthVader error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Darth Vader filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
