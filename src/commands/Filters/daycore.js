const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "daycore",
  aliases: ["slowcore", "slowed"],
  description: "Toggle the Daycore filter for the current song.",
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

      // 🔍 Detect if Daycore is already active
      const isActive =
        player.filters.timescale?.pitch === 0.63 &&
        player.filters.timescale?.rate === 1.05;

      // 🎛 Lavalink v4 filter payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct Lavalink v4 key
        equalizer: isActive
          ? [] // Reset EQ if toggling off
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
            ],
        timescale: isActive
          ? { pitch: 1.0, rate: 1.0, speed: 1.0 } // Reset default
          : { pitch: 0.63, rate: 1.05, speed: 1.0 },
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

      // 💾 Cache the new filter state locally
      player.filters.equalizer = filterData.equalizer;
      player.filters.timescale = filterData.timescale;

      // 🔄 Apply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🎨 Response embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Daycore filter disabled.** Back to normal playback"
            : "<:check:1433806961773903914> | **Daycore filter enabled!** Enjoy the slowed, dreamy vibe"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Daycore error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Daycore filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
