const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "dance",
  aliases: ["party", "groove"],
  description: "Toggle the Dance filter for the current song.",
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

      // 🔍 Detect if Dance filter is active
      const isActive =
        player.filters.timescale?.speed === 1.25 &&
        player.filters.timescale?.pitch === 1.25 &&
        player.filters.timescale?.rate === 1.25;

      // 🎛 Lavalink v4 payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct key
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 } // Turn OFF
          : { speed: 1.25, pitch: 1.25, rate: 1.25 }, // Turn ON (Dance effect)
      };

      // 🛰 Send safely to Lavalink/Riffy node
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache new filter
      player.filters.timescale = filterData.timescale;

      // 🔄 Apply immediately
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🎨 Embed feedback
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Dance filter disabled.** Back to normal sound"
            : "<:check:1433806961773903914> | **Dance filter enabled!** Time to move your feet"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Dance error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Dance filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
