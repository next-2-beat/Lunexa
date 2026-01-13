const NoPrefixReward = require("./models/NoPrefixReward.js");

module.exports = async (client, interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "redeem_noprefix") {
    try {
      const existing = await NoPrefixReward.findOne({ userId: interaction.user.id });

      if (existing) {
        return await interaction.reply({
          content: "❌ You have already claimed this reward.",
          ephemeral: true,
        });
      }

      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await NoPrefixReward.create({
        userId: interaction.user.id,
        expiresAt: expires,
      });

      await interaction.reply({
        content: "✅ You have successfully redeemed **No Prefix** access for 7 days.",
        ephemeral: true,
      });

      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 5000);

      const logChannel = client.channels.cache.get("1433852004169551942");
      if (logChannel) {
        logChannel.send(`🎉 \`${interaction.user.tag}\` claimed No Prefix access!`);
      }

    } catch (err) {
      console.error("Error in button handler:", err);
      if (!interaction.replied) {
        try {
          await interaction.reply({
            content: "❌ Something went wrong. Please try again later.",
            ephemeral: true,
          });
        } catch (_) {}
      }
    }
  }
};