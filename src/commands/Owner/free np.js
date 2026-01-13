const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const mongoose = require("mongoose");

// === Schema Setup (inline, no need for separate file) ===
const noPrefixSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});
const NoPrefix = mongoose.models.NoPrefix || mongoose.model("NoPrefix", noPrefixSchema);

module.exports = {
  name: "sendnoprefix",
  aliases: ["npbutton"],
  category: "owner",

  run: async (client, message) => {
    if (message.author.id !== "1390894184512356392") return;

    const channel = message.guild.channels.cache.get("1434011413705261077");
    if (!channel) return message.reply("Channel not found.");

    // ======= Embed with thumbnail and image =======
    const embed = new EmbedBuilder()
      .setTitle("Claim Your No Prefix Reward!")
      .setDescription(
        "Enjoy **7 days** of No Prefix access to use the bot freely!\n\n" +
          "> You can claim this reward **only once.**\n\n" +
          "> Click the button below to redeem it instantly!"
      )
      .setColor("#8A2BE2")
      .setThumbnail(client.user.displayAvatarURL())
      .setImage("https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?ex=6906d11d&is=69057f9d&hm=c804d57f24d5e4314806a2cfd2aee0c0eb9835a9da6885474e44e948d78ac68c&=&format=webp&quality=lossless&width=544&height=192") // change to your banner
      .setFooter({
        text: "Offered by Lunexa",
        iconURL: client.user.displayAvatarURL(),
      });

    const btn = new ButtonBuilder()
      .setCustomId("redeem_noprefix")
      .setLabel("Redeem No Prefix Access")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btn);

    await channel.send({ embeds: [embed], components: [row] });
    await message.reply("No Prefix reward message sent.");

    // ============ Interaction Handler ============
    const collector = channel.createMessageComponentCollector({
      filter: (i) => i.customId === "redeem_noprefix",
    });

    collector.on("collect", async (interaction) => {
      try {
        // Check if user already claimed
        const userData = await NoPrefix.findOne({ userId: interaction.user.id });
        if (userData) {
          const alreadyEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Already Claimed!")
            .setDescription(
              "You’ve already claimed your **7-day No Prefix** reward!"
            )
            .setThumbnail(interaction.user.displayAvatarURL())
            .setFooter({
              text: "Lunexa Rewards",
              iconURL: client.user.displayAvatarURL(),
            });
          return interaction.reply({ embeds: [alreadyEmbed], ephemeral: true });
        }

        // Create new entry
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        await NoPrefix.create({
          userId: interaction.user.id,
          expiresAt: expiryDate,
        });

        const successEmbed = new EmbedBuilder()
          .setColor("#57F287")
          .setTitle("Reward Redeemed!")
          .setDescription(
            `You’ve successfully activated your **7-day No Prefix** access!\n\n` +
              `> Expires: <t:${Math.floor(
                expiryDate.getTime() / 1000
              )}:R>\n` +
              `> Enjoy using Lunexa freely!`
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setImage("https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?ex=6906d11d&is=69057f9d&hm=c804d57f24d5e4314806a2cfd2aee0c0eb9835a9da6885474e44e948d78ac68c&=&format=webp&quality=lossless&width=544&height=192") // success banner
          .setFooter({
            text: "Lunexa Premium Access",
            iconURL: client.user.displayAvatarURL(),
          });

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: "⚠️ Something went wrong while redeeming your reward.",
          ephemeral: true,
        });
      }
    });
  },
};
