const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "haunted",
  aliases: ["ghostly", "spooky"],
  description: "Toggle the Haunted filter for the current song.",
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

      // 👻 Detect if Haunted filter is already active
      const isActive =
        player.filters.timescale?.speed === 0.7 &&
        player.filters.reverb?.wet === 0.5 &&
        player.filters.tremolo?.depth === 0.4;

      // 🧪 Lavalink v4 compatible filter payload
      const filterData = {
        op: "filters",
        guild_id: message.guild.id, // ✅ Lavalink v4 correct key
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 } // reset
          : { speed: 0.7, pitch: 0.9, rate: 0.7 },
        reverb: isActive
          ? { wet: 0.0, roomSize: 0.0 }
          : { wet: 0.5, roomSize: 0.8 },
        tremolo: isActive
          ? { frequency: 0.0, depth: 0.0 }
          : { frequency: 3.0, depth: 0.4 },
      };

      // 🛰 Safely send the payload to Lavalink or Riffy node
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
      } else if (client.riffy?.send) {
        await client.riffy.send(filterData);
      } else {
        throw new Error("No valid Lavalink node found to send filter data.");
      }

      // 💾 Cache new filter state locally
      player.filters.timescale = filterData.timescale;
      player.filters.reverb = filterData.reverb;
      player.filters.tremolo = filterData.tremolo;

      // 🔄 Force refresh so effect applies instantly
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼 Aesthetic toggle embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Haunted filter disabled.** Spirits have left the room"
            : "<:check:1433806961773903914> | **Haunted filter enabled!** Welcome to the ghostly sound realm"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("[FILTER] Haunted error:", error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Haunted filter. Lavalink node may be offline!"
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
