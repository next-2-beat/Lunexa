const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "underwater",
  aliases: ["water", "deepsea"],
  description: "Toggle the Underwater filter for the current song.",
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

      // 🌊 Detect if Underwater filter is already active
      const isActive =
        player.filters.reverb?.wet === 0.6 &&
        player.filters.timescale?.pitch === 0.7;

      // 🎛 Lavalink v4-compatible filter payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct Lavalink key
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 } // Reset to normal
          : { speed: 0.8, pitch: 0.7, rate: 0.9 },
        equalizer: isActive
          ? [] // Reset EQ
          : [
              { band: 0, gain: 0.3 },
              { band: 1, gain: 0.3 },
              { band: 2, gain: -0.2 },
              { band: 3, gain: -0.2 },
              { band: 4, gain: -0.3 },
              { band: 5, gain: -0.3 },
              { band: 6, gain: -0.4 },
              { band: 7, gain: -0.4 },
              { band: 8, gain: -0.5 },
              { band: 9, gain: -0.5 },
              { band: 10, gain: -0.6 },
              { band: 11, gain: -0.6 },
              { band: 12, gain: -0.7 },
              { band: 13, gain: -0.7 },
              { band: 14, gain: -0.8 },
            ],
        reverb: isActive
          ? { wet: 0.0 } // Disable
          : { wet: 0.6 }, // Enable echo effect
      };

      // 🛰 Safely send payload to Lavalink / Riffy
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache state
      player.filters.timescale = filterData.timescale;
      player.filters.reverb = filterData.reverb;
      player.filters.equalizer = filterData.equalizer;

      // 🔄 Force refresh
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🌊 Embed feedback
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00BFFF")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Underwater filter disabled.** Surfaced back to clarity"
            : "<:check:1433806961773903914> | **Underwater filter enabled!** Dive deep into the sound"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Underwater error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Underwater filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

// 🕒 Simple delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
