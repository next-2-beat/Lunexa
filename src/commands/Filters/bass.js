const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "bass",
  aliases: ["bassboost", "bboost"],
  description: "Toggle the Bass Boost filter for the current song.",
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

      // 🎚️ Detect if bass boost is already active
      const isActive = player.filters.equalizer?.[0]?.gain === 0.1;

      // 🎛️ Build Lavalink v4 payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ correct key (Lavalink v4)
        equalizer: isActive
          ? [] // Reset filters if already active (turn off)
          : [
              { band: 0, gain: 0.1 },
              { band: 1, gain: 0.1 },
              { band: 2, gain: 0.05 },
              { band: 3, gain: 0.05 },
              { band: 4, gain: -0.05 },
              { band: 5, gain: -0.05 },
              { band: 6, gain: 0 },
              { band: 7, gain: -0.05 },
              { band: 8, gain: -0.05 },
              { band: 9, gain: 0 },
              { band: 10, gain: 0.05 },
              { band: 11, gain: 0.05 },
              { band: 12, gain: 0.1 },
              { band: 13, gain: 0.1 },
            ],
      };

      // 🛰️ Send safely to Lavalink/Riffy
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache current filter state
      player.filters.equalizer = filterData.equalizer;

      // 🔄 Force reapply instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🎨 Embed output
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Bass Boost disabled.** Back to normal sound"
            : "<:check:1433806961773903914> | **Bass Boost enabled!** Enjoy the thump"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error("[FILTER] Bass error:", err);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Bass Boost filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
