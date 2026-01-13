const { EmbedBuilder, WebhookClient } = require("discord.js");
const schema = require("../../models/PremiumGuildSchema.js");
const ms = require("ms");

// ✅ Authorized Owner IDs
const authorizedOwners = ["1390894184512356392"];

// ✅ Webhook to send premium activation logs
const premiumLogWebhook = new WebhookClient({
  url: "https://discord.com/api/webhooks/1439967266954285170/0DL0dQLoCgk__l1u2yLC8xFvHNs0-x58e0EA-I2UxnZ7ENSyX86YwdjsBaaNZVeGRVV1" // 🔁 replace this with your actual webhook URL
});

module.exports = {
  name: "premiumadd",
  aliases: ["addprem", "addpremium", "++"],
  description: "Add Premium Guild (Owner Only)",
  category: "Owner",
  ownerOnly: true,

  run: async (client, message, args, prefix) => {
    if (!authorizedOwners.includes(message.author.id)) return;

    const guildId = args[0];
    const durationArg = args[1];

    if (!guildId) {
      return message.reply("<:warn:1433812979349983232> Please specify a guild ID!");
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return message.reply("<:cross:1433807192003444848> Invalid guild ID!");
    }

    try {
      // 🔄 Delete old premium record if exists
      await schema.deleteOne({ Guild: guildId });

      // ⏳ Duration logic
      let expireTime = 0;
      let isPermanent = true;
      let expireText = "Never";

      if (durationArg) {
        const duration = ms(durationArg);
        if (!duration) {
          return message.reply("<:cross:1433807192003444848> Invalid time format! Use `30d`, `1y`, `12h`, etc.");
        }
        expireTime = Date.now() + duration;
        isPermanent = false;
        expireText = `<t:${Math.floor(expireTime / 1000)}:R>`;
      }

      // 💾 Save to DB
      await new schema({
        Guild: guildId,
        Expire: expireTime,
        Permanent: isPermanent,
      }).save();

      // 📢 Send embed confirmation to command user
      const confirmEmbed = new EmbedBuilder()
        .setTitle("Premium Activated!")
        .setColor("#00FF55")
        .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }) || null)
        .setDescription(`<:check:1433806961773903914> Premium successfully activated for **${guild.name}**`)
        .addFields(
          { name: "Guild ID", value: guild.id, inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Plan", value: isPermanent ? "Permanent" : durationArg, inline: true },
          { name: "Expires", value: expireText, inline: true }
        )
        .setFooter({
          text: `Assigned by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await message.reply({ embeds: [confirmEmbed] });

      // 🪄 Webhook log embed
      const logEmbed = new EmbedBuilder()
        .setTitle("Premium Guild Added")
        .setColor("#00BFFF")
        .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }) || null)
        .setDescription(`Premium has been activated for **${guild.name}**`)
        .addFields(
          { name: "Guild Name", value: guild.name, inline: true },
          { name: "Guild ID", value: guild.id, inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Plan", value: isPermanent ? "Permanent" : durationArg, inline: true },
          { name: "Expires", value: expireText, inline: true },
          { name: "Activated By", value: `${message.author.tag} (<@${message.author.id}>)`, inline: false }
        )
        .setTimestamp();

      await premiumLogWebhook.send({ embeds: [logEmbed] });

    } catch (err) {
      console.error("[PREMIUM ADD ERROR]", err);
      message.reply("<:cross:1433807192003444848> An error occurred while saving the data.");
    }
  },
};
