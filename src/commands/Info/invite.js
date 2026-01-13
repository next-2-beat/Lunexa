const {
  Message,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  name: "invite",
  aliases: ["inv"],
  description: "invite me",
  category: "Info",
  cooldown: 5,

  run: async (client, message, args, prefix) => {

    const embed = new EmbedBuilder()
      .setColor("#bb00ff")
      .setTitle("Invite Lunexa")
      .setDescription("Invite me to your server for **high-quality music!**")// Thumbnail
      .setImage("https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png?ex=69160db8&is=6914bc38&hm=24021a82e0971cf99909b370a583dfb5f84aeb133d99bc38c03c983a499600e7&=&format=webp&quality=lossless&width=304&height=54"); // Banner Image

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Invite Lunexa")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=1390965840437968896&permissions=8&integration_type=0&scope=bot`
        ),
      new ButtonBuilder()
        .setLabel("Support Server")
        .setStyle(ButtonStyle.Link)
        .setURL(client.config.ssLink)
    );

    message.reply({
      embeds: [embed],
      components: [row]
    });
  },
};
