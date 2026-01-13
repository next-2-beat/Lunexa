const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "soft",
  aliases: ["naram", "smooth"],
  description: "Toggle the Soft filter for the current song.",
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

      // 🎧 Detect if Soft filter is active
      const isActive = player.filters.equalizer?.[8]?.gain === -0.25;

      // 🎛 Lavalink v4 payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct Lavalink v4 key
        equalizer: isActive
          ? [] // Reset all EQ bands
          : [
              { band: 0, gain: 0 },
              { band: 1, gain: 0 },
              { band: 2, gain: 0 },
              { band: 3, gain: 0 },
              { band: 4, gain: 0 },
              { band: 5, gain: 0 },
              { band: 6, gain: 0 },
              { band: 7, gain: 0 },
              { band: 8, gain: -0.25 },
              { band: 9, gain: -0.25 },
              { band: 10, gain: -0.25 },
              { band: 11, gain: -0.25 },
              { band: 12, gain: -0.25 },
              { band: 13, gain: -0.25 },
              { band: 14, gain: -0.25 },
            ],
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

      // 💾 Cache filter state
      player.filters.equalizer = filterData.equalizer;

      // 🔄 Apply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼 Aesthetic embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Soft filter disabled.** Back to normal sound"
            : "<:check:1433806961773903914> | **Soft filter enabled!** Smooth and mellow tones"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Soft error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Soft filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
