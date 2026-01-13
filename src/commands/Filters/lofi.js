const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "lofi",
  aliases: ["lo-fi", "lofibeats", "cozy"],
  description: "Toggle the smooth, cozy Lo-Fi filter for the current song.",
  category: "Filters",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,
  premium: true,
  ownerOnly: false,

  run: async (client, message, args, prefix, player) => {
    if (!player) {
      const embed = new EmbedBuilder()
        .setDescription("<:cross:1433807192003444848> | No player found in this guild!")
        .setColor(client.config.color);
      return message.reply({ embeds: [embed] });
    }

    try {
      if (!player.filters) player.filters = {};

      // 🎧 Detect if Lo-Fi filter is already active
      const isActive =
        player.filters.timescale?.speed === 0.95 &&
        player.filters.timescale?.pitch === 0.9 &&
        player.filters.equalizer?.[4]?.gain === -0.3;

      // 🎛 Lavalink v4 compatible payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct key
        equalizer: isActive
          ? [] // Reset EQ (OFF)
          : [
              { band: 0, gain: -0.1 },
              { band: 1, gain: -0.1 },
              { band: 2, gain: -0.15 },
              { band: 3, gain: -0.2 },
              { band: 4, gain: -0.3 },
              { band: 5, gain: -0.35 },
              { band: 6, gain: -0.4 },
              { band: 7, gain: -0.5 },
              { band: 8, gain: -0.6 },
              { band: 9, gain: -0.7 },
              { band: 10, gain: -0.8 },
              { band: 11, gain: -0.9 },
              { band: 12, gain: -1.0 },
              { band: 13, gain: -1.1 },
              { band: 14, gain: -1.2 },
            ],
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 } // Turn off
          : { speed: 0.95, pitch: 0.9, rate: 0.95 },
      };

      // 🛰 Safely send filter payload
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
      player.filters.timescale = filterData.timescale;

      // 🔄 Apply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼️ Response embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Lo-Fi filter disabled.** Back to crisp audio"
            : "<:check:1433806961773903914> | **Lo-Fi filter enabled!** Sit back, relax, and vibe"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] LoFi error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Lo-Fi filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
