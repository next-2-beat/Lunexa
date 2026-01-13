const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "3d",
  description: "Toggle the 3D audio filter for the current song.",
  category: "Filters",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  voteOnly: false,
  dj: true,
  premium: true,

  run: async function (client, message, args, prefix, player) {
    if (!player) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription("<:cross:1433807192003444848> | No player found in this guild!");
      return message.reply({ embeds: [embed] });
    }

    try {
      // Initialize filters object if not exist
      if (!player.filters) player.filters = {};

      // Check current 3D filter status
      const is3dOn = player.filters.rotation?.rotationHz && player.filters.rotation.rotationHz !== 0;

      // Prepare payload for Lavalink/Riffy
      const payload = {
        op: "filters",
        guildId: message.guild.id,
        rotation: is3dOn ? { rotationHz: 0.0 } : { rotationHz: 0.2 },
      };

      // Send to Lavalink node
      const node = client.manager?.nodeMap?.values().next().value;
      if (player && typeof player.setFilters === "function") {
        await player.setFilters(payload);
      } else if (node && typeof node.send === "function") {
        node.send(payload);
      } else if (node?.ws && typeof node.ws.send === "function") {
        node.ws.send(JSON.stringify(payload));
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(payload);
      } else {
        throw new Error("Unable to send filter payload — no valid Lavalink node found.");
      }

      // Update local filter cache
      player.filters.rotation = payload.rotation;

      const embed = new EmbedBuilder()
        .setColor(is3dOn ? "#FF5555" : "#00FF9C")
        .setDescription(
          is3dOn
            ? "<:cross:1433807192003444848> | **3D filter disabled.** Back to normal audio."
            : "<:check:1433806961773903914> | **3D filter enabled!** Enjoy the spatial sound."
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`[FILTERS] 3D Filter Error:`, error);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("<:cross:1433807192003444848> | An error occurred while applying the 3D filter.");
      return message.reply({ embeds: [embed] });
    }
  },
};
