const { Message, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, Component, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "support",
  aliases: ["sup"],
  description: "Get Bot support server link !!",
  // userPermissions: PermissionFlagsBits.SendMessages,
  // botPermissions: PermissionFlagsBits.SendMessages,
  category: "Info",
  cooldown: 5,

  run: async (client, message, args, prefix) => {

    let embed = new EmbedBuilder().setColor(client.color).setDescription(`Click [Here](${client.config.ssLink}) To Join Support Server!`)
    
    const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setEmoji("<:support:1433820104692338688>")
          .setURL(`${client.config.ssLink}`)
    );
    return message.reply({ embeds: [embed], components: [row] });
  },
};
