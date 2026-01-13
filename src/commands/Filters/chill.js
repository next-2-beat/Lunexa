const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "chillwave",
  aliases: ["chill"],
  description: "Toggle the Chillwave filter for the current song.",
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

      // 🔍 Detect if Chillwave is already active
      const isActive =
        player.filters.equalizer?.[0]?.gain === 0.3 &&
        player.filters.reverb?.wet === 0.4 &&
        player.filters.tremolo?.depth === 0.2;

      // 🎛 Lavalink v4 Filter Payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ Lavalink v4 correct key
        equalizer: isActive
          ? [] // Reset equalizer if turning OFF
          : [
              { band: 0, gain: 0.3 },
              { band: 1, gain: 0.2 },
              { band: 2, gain: 0 },
              { band: 3, gain: -0.1 },
              { band: 4, gain: -0.2 },
              { band: 5, gain: -0.3 },
              { band: 6, gain: -0.4 },
              { band: 7, gain: -0.4 },
              { band: 8, gain: -0.3 },
              { band: 9, gain: -0.2 },
              { band: 10, gain: -0.1 },
              { band: 11, gain: 0 },
            ],
        reverb: isActive
          ? { wet: 0.0, roomSize: 0.0, damping: 0.0 }
          : { wet: 0.4, roomSize: 0.7, damping: 0.3 },
        tremolo: isActive
          ? { frequency: 0.0, depth: 0.0 }
          : { frequency: 5.0, depth: 0.2 },
      };

      // 🛰 Send safely to Lavalink or Riffy node
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 🧠 Cache current filter state locally
      player.filters.equalizer = filterData.equalizer;
      player.filters.reverb = filterData.reverb;
      player.filters.tremolo = filterData.tremolo;

      // 🔄 Refresh immediately
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼️ Beautiful feedback embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Chillwave filter disabled.** Back to normal audio"
            : "<:check:1433806961773903914> | **Chillwave filter enabled!** Enjoy the dreamy vibes"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Chillwave error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Chillwave filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
