const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "back",
  aliases: ["b", "previous"],
  description: "Returns to the previous song.",
  category: "Music",
  inVc: true,
  sameVc: true,
  dj: true,

  run: async (client, message, args, prefix) => {
    const player = client.manager.players.get(message.guild.id);
    
    if (!player) {
      const embed = new EmbedBuilder()
        .setDescription("No player found for this guild!")
        .setColor(client.config.color);
      return message.channel.send({ embeds: [embed] });
    }

    if (!player.previous) {
      const embed = new EmbedBuilder()
        .setDescription("There is no previous song to play!")
        .setColor(client.config.color);
      return message.channel.send({ embeds: [embed] });
    }

    try {
      await player.play(player.previous);
      const embed = new EmbedBuilder()
        .setDescription("Now playing the previous song.")
        .setColor(client.config.color);
      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setDescription("Failed to play the previous song.")
        .setColor(client.config.color);
      return message.channel.send({ embeds: [embed] });
    }
  },
};