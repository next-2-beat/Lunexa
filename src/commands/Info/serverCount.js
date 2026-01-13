const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "servercount",
  aliases: ["sc", "servers","svs"],
  description: "Shows how many servers the bot is in.",
  category: "Info",

  run: async (client, message, args, prefix) => {
    const embed = new EmbedBuilder()
      .setTitle("Server Count")
      .setColor(client.color)
      .setDescription(`I am currently in **${client.guilds.cache.size.toLocaleString()}** servers.`)
      .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};