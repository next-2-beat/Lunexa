const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "sr",
  aliases: ["slowed", "reverb"],
  description: "Toggle the Slowed + Reverb filter for the current song.",
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

      // 🎧 Detect if filter is already active
      const isActive =
        player.filters.timescale?.speed === 0.85 &&
        player.filters.reverb?.wet === 0.3;

      // 🎛 Lavalink v4 compatible payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct key
        equalizer: isActive
          ? [] // reset EQ
          : [
              { band: 0, gain: 0 },
              { band: 1, gain: 0 },
              { band: 2, gain: 0 },
              { band: 3, gain: 0 },
              { band: 4, gain: 0 },
              { band: 5, gain: 0 },
              { band: 6, gain: 0 },
              { band: 7, gain: 0 },
              { band: 8, gain: 0.15 },
              { band: 9, gain: 0.15 },
              { band: 10, gain: 0.1 },
              { band: 11, gain: 0.1 },
              { band: 12, gain: 0.05 },
              { band: 13, gain: 0.05 },
              { band: 14, gain: 0.05 },
            ],
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 }
          : { speed: 0.85, pitch: 1.0, rate: 0.85 },
        reverb: isActive
          ? { wet: 0.0 }
          : { wet: 0.3 },
      };

      // 🛰 Safely send the payload to Lavalink or Riffy
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache filter states
      player.filters.timescale = filterData.timescale;
      player.filters.reverb = filterData.reverb;
      player.filters.equalizer = filterData.equalizer;

      // 🔄 Instant refresh
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼 Embed response
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Slowed + Reverb filter disabled.** Back to normal playback"
            : "<:check:1433806961773903914> | **Slowed + Reverb filter enabled!** Feel the dreamy vibes"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] SR error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Slowed + Reverb filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
