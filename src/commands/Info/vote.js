const {
  Message,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  name: "vote",
  description: "Vote for Lunexa",
  // userPermissions: PermissionFlagsBits.SendMessages,
  // botPermissions: PermissionFlagsBits.SendMessages,
  category: "Info",
  cooldown: 5,

  run: async (client, message, args, prefix) => {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Vote On DBL")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<a:dance:1433819488368988222>")
        .setURL(`https://discord.gg/eMnU7MQ2Zm`)
    );
    const embed = new EmbedBuilder()
    .setAuthor({
        name: `Vote Me!`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setColor(client.color)
      .setDescription(
        "**Vote for Lunexa on DBL to support its growth and development! Help us bring new features and improvements to this amazing bot that enhances your Discord experience. Your votes make a difference!**"
      );

    return message.reply({ embeds: [embed], components: [row] });
  },
};
