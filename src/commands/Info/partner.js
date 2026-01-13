const { Message, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "partner",
  aliases: ["sponser"],
  description: "Get Bot Sponsers !!",
  // userPermissions: PermissionFlagsBits.SendMessages,
  // botPermissions: PermissionFlagsBits.SendMessages,
  category: "Info",
  cooldown: 5,

  run: async (client, message, args, prefix) => {
    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle(`Lunexa - Partners`)
      .setDescription(`**NexCloud Hosting - Best Premium and Affordable Hosting**`);

    const button = new ButtonBuilder()
      .setLabel(`Server`)
      .setStyle(ButtonStyle.Link)
      .setEmoji("<:support:1433820104692338688>")
      .setURL(`https://discord.gg/nexcloud`);

    const row = new ActionRowBuilder().addComponents(button);

    return message.reply({
      embeds: [embed],
      components: [row]
    });
  },
};
