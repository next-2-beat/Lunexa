const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "softguitar",
  aliases: ["guitar"],
  description: "Toggle the Soft Guitar filter for the current song.",
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

      // 🎸 Detect if Soft Guitar filter is already active
      const isActive =
        player.filters.reverb?.wet === 0.4 &&
        player.filters.reverb?.roomSize === 0.5;

      // 🎛 Lavalink v4-compatible payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ Correct Lavalink key
        equalizer: isActive
          ? [] // Reset EQ (turn OFF)
          : [
              { band: 0, gain: 0.3 },
              { band: 1, gain: 0.2 },
              { band: 2, gain: 0 },
              { band: 3, gain: -0.1 },
              { band: 4, gain: -0.2 },
              { band: 5, gain: -0.3 },
              { band: 6, gain: -0.5 },
              { band: 7, gain: -0.5 },
              { band: 8, gain: -0.4 },
              { band: 9, gain: -0.3 },
              { band: 10, gain: -0.2 },
              { band: 11, gain: 0 },
            ],
        reverb: isActive
          ? { wet: 0.0, roomSize: 0.0, damping: 0.0 } // Disable filter
          : { wet: 0.4, roomSize: 0.5, damping: 0.3 }, // Enable smooth guitar tone
      };

      // 🛰 Safely send to Lavalink or Riffy
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
      player.filters.reverb = filterData.reverb;

      // 🔄 Apply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🎨 Feedback Embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Soft Guitar filter disabled.** Back to the regular sound"
            : "<:check:1433806961773903914> | **Soft Guitar filter enabled!** Enjoy the warm, melodic tones"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] SoftGuitar error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Soft Guitar filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
