const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "alienvibes",
  aliases: ["alien", "space"],
  description: "Toggle the Alien Vibes filter for the current song.",
  category: "Filters",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,
  premium: true,

  run: async (client, message, args, prefix, player) => {
    // 🛡️ 1. Ensure there's a player
    if (!player) {
      const embed = new EmbedBuilder()
        .setColor(client.config.color)
        .setDescription("<:cross:1433807192003444848> | No player found in this guild!");
      return message.reply({ embeds: [embed] });
    }

    try {
      // 🛡️ 2. Ensure player.filters is defined
      if (!player.filters) player.filters = {};

      // 🎛️ 3. Determine if the filter is already active
      const isActive =
        player.filters.timescale?.speed === 1.2 &&
        player.filters.timescale?.pitch === 1.8 &&
        player.filters.vibrato?.frequency === 10.0;

      // 🧩 4. Prepare the Lavalink-compatible filter payload
      const filterData = {
        op: "filters",
        guildId: message.guild.id, // ✅ Lavalink v4 uses camelCase: guildId
        timescale: isActive
          ? { speed: 1.0, pitch: 1.0, rate: 1.0 }
          : { speed: 1.2, pitch: 1.8, rate: 1.0 },
        vibrato: isActive
          ? { frequency: 0.0, depth: 0.0 }
          : { frequency: 10.0, depth: 0.6 },
        echo: isActive
          ? { delay: 0.0, decay: 0.0 }
          : { delay: 0.4, decay: 0.8 },
      };

      // 🚀 5. Send filters safely to Lavalink / Riffy
      let sent = false;
      if (player.node && typeof player.node.send === "function") {
        await player.node.send(filterData);
        sent = true;
      } else if (client.manager && typeof client.manager.send === "function") {
        await client.manager.send(filterData);
        sent = true;
      } else if (client.riffy?.send && typeof client.riffy.send === "function") {
        // ✅ Patch: wrap packet to match Riffy expectations
        await client.riffy.send({ d: { guild_id: message.guild.id }, ...filterData });
        sent = true;
      }

      if (!sent) throw new Error("No valid Lavalink node or send() function found.");

      // 🧠 6. Cache applied filters locally
      player.filters = {
        ...player.filters,
        timescale: filterData.timescale,
        vibrato: filterData.vibrato,
        echo: filterData.echo,
      };

      // 🎧 7. Reapply filter immediately
      player.pause(true);
      await delay(200);
      player.pause(false);

      // 🖼️ 8. Send success embed
      const embed = new EmbedBuilder()
        .setColor(isActive ? "#FF5555" : "#00FF9C")
        .setDescription(
          isActive
            ? "<:cross:1433807192003444848> | **Alien Vibes disabled.** Back to normal audio."
            : "<:check:1433806961773903914> | **Alien Vibes enabled!** Enjoy the cosmic sound."
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });

    } catch (err) {
      console.error("[FILTER] AlienVibes error:", err);
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(
          "<:cross:1433807192003444848> | Failed to toggle Alien Vibes filter. Lavalink node may be offline or misconfigured."
        );
      return message.reply({ embeds: [embed] });
    }
  },
};

// ⏱️ Utility delay function
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
