const { Message, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "uptime",
  aliases: ["up"],
  description: "Get Bot Real uptime !!",
  // userPermissions: PermissionFlagsBits.SendMessages,
  // botPermissions: PermissionFlagsBits.SendMessages,
  category: "Info",
  cooldown: 5,

  run: async (client, message, args, prefix) => {
    // Code        
    const duration1 = Math.round(
        (Date.now() - message.client.uptime) / 1000
        )
    const embed = new EmbedBuilder().setColor(client.color)
        embed.setColor(client.color)
        embed.setDescription(`<a:online:1433819842418577538> | I am online from <t:${duration1}:R>`)
        return message.channel.send({ embeds: [embed] })

  },
};
