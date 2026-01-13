const { EmbedBuilder, WebhookClient } = require("discord.js");
const schema = require("../../models/PremiumGuildSchema");

// ✅ Authorized user IDs
const authorizedUsers = ["1390894184512356392"];

// ✅ Webhook to log premium removals (same as premiumadd)
const premiumLogWebhook = new WebhookClient({
  url: "https://discord.com/api/webhooks/1439967266954285170/0DL0dQLoCgk__l1u2yLC8xFvHNs0-x58e0EA-I2UxnZ7ENSyX86YwdjsBaaNZVeGRVV1"
});

module.exports = {
  name: "remprem",
  aliases: ["deletepremium", "premiumremove", "--", "removeprem", "removepremium"],
  description: "Remove Premium from a guild (Owner Only)",
  category: "Owner",
  ownerOnly: true,

  run: async (client, message, args, prefix) => {
    if (!authorizedUsers.includes(message.author.id)) return;

    const guildId = args[0];
    if (!guildId) {
      return message.reply("<:warn:1433812979349983232> Please specify a guild ID!");
    }

    try {
      const data = await schema.findOne({ Guild: guildId });

      if (!data) {
        return message.reply("<:warn:1433812979349983232> The guild ID you provided does not have premium.");
      }

      // 🗑️ Delete premium entry
      await schema.deleteOne({ Guild: guildId });

      // 🔍 Try to fetch the guild for embed info
      const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);

      // ✅ Confirmation embed for the command user
      const confirmEmbed = new EmbedBuilder()
        .setTitle("Premium Removed!")
        .setColor("#FF5555")
        .setDescription(
          `<:cross:1433807192003444848> Premium has been removed from **${
            guild ? guild.name : `Unknown Guild (${guildId})`
          }**`
        )
        .addFields({ name: "Guild ID", value: guildId, inline: true })
        .setFooter({
          text: `Removed by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await message.reply({ embeds: [confirmEmbed] });

      // 🪄 Webhook log embed
      const logEmbed = new EmbedBuilder()
        .setTitle("Premium Guild Removed")
        .setColor("#FF4444")
        .setThumbnail(guild?.iconURL({ dynamic: true, size: 4096 }) || null)
        .setDescription(
          `Premium has been **removed** from ${
            guild ? `**${guild.name}**` : `Guild ID: ${guildId}`
          }`
        )
        .addFields(
          { name: "Guild ID", value: guildId, inline: true },
          {
            name: "Removed By",
            value: `${message.author.tag} (<@${message.author.id}>)`,
            inline: false,
          }
        )
        .setTimestamp();

      await premiumLogWebhook.send({ embeds: [logEmbed] });

    } catch (err) {
      console.error("[PREMIUM REMOVE ERROR]", err);
      return message.reply("<:cross:1433807192003444848> An error occurred while processing your request.");
    }
  },
};
