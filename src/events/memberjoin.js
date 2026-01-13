const {
  EmbedBuilder,
  WebhookClient,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const MemberJoinDM = require("../models/MemberJoinDM");

const BOT_OWNERS = ["1390894184512356392", "1382014374021173300"];

module.exports = async (client) => {
  // 🔹 Webhook for DM send logs
  const DM_LOG_WEBHOOK_URL =
    "https://discord.com/api/webhooks/1439967266954285170/0DL0dQLoCgk__l1u2yLC8xFvHNs0-x58e0EA-I2UxnZ7ENSyX86YwdjsBaaNZVeGRVV1";

  // 🔸 Webhook for config enable/disable logs
  const CONFIG_LOG_WEBHOOK_URL =
    "https://discord.com/api/webhooks/1439967266954285170/0DL0dQLoCgk__l1u2yLC8xFvHNs0-x58e0EA-I2UxnZ7ENSyX86YwdjsBaaNZVeGRVV1";

  const dmWebhook = new WebhookClient({ url: DM_LOG_WEBHOOK_URL });
  const configWebhook = new WebhookClient({ url: CONFIG_LOG_WEBHOOK_URL });

  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    const prefix = ".";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === "memberjoindm") {
      if (!BOT_OWNERS.includes(message.author.id)) {
        return message.reply("❌ Only my owner can use this command.");
      }

      const option = args[0]?.toLowerCase();
      if (!option || !["enable", "disable"].includes(option)) {
        const current = await MemberJoinDM.findOne({ guildId: message.guild.id });
        const status = current?.enabled !== false ? "Enabled" : "Disabled";
        return message.reply(
          `Usage: \`${prefix}memberjoindm <enable|disable>\`\nCurrent: **${status}**`
        );
      }

      let data = await MemberJoinDM.findOne({ guildId: message.guild.id });
      if (!data) data = new MemberJoinDM({ guildId: message.guild.id });

      // ✅ Disable
      if (option === "disable") {
        data.enabled = false;
        await data.save();
        message.reply("Member join DMs have been **disabled** for this server.");

        // 🟠 Log to config webhook
        const logEmbed = new EmbedBuilder()
          .setColor(0xff5555)
          .setTitle("Member Join DM Disabled")
          .setDescription(
            `**Guild:** ${message.guild.name}\n**Guild ID:** ${message.guild.id}\n**Owner:** <@${message.guild.ownerId}>`
          )
          .addFields(
            { name: "Changed By", value: `${message.author.tag} (${message.author.id})` },
            { name: "Action", value: "Disabled" }
          )
          .setFooter({ text: "Lunexa • DM Settings Updated" })
          .setTimestamp();

        await configWebhook.send({ embeds: [logEmbed] });
      }

      // ✅ Enable
      else if (option === "enable") {
        data.enabled = true;
        await data.save();
        message.reply("Member join DMs have been **enabled** for this server.");

        // 🟢 Log to config webhook
        const logEmbed = new EmbedBuilder()
          .setColor(0x55ff55)
          .setTitle("Member Join DM Enabled")
          .setDescription(
            `**Guild:** ${message.guild.name}\n**Guild ID:** ${message.guild.id}\n**Owner:** <@${message.guild.ownerId}>`
          )
          .addFields(
            { name: "Changed By", value: `${message.author.tag} (${message.author.id})` },
            { name: "Action", value: "Enabled" }
          )
          .setFooter({ text: "Lunexa • DM Settings Updated" })
          .setTimestamp();

        await configWebhook.send({ embeds: [logEmbed] });
      }
    }
  });

  client.on("guildMemberAdd", async (member) => {
    try {
      const data = await MemberJoinDM.findOne({ guildId: member.guild.id });
      if (data && data.enabled === false) return;

      const welcomeEmbed = new EmbedBuilder()
        .setColor(client.color || 0x2b2d31)
        .setAuthor({
          name: `${member.guild.name}`,
          iconURL: member.guild.iconURL({ dynamic: true }),
        })
        .setTitle(`Welcome !! ${member.user.username}`)
        .setDescription(
          `> Thanks for joining **${member.guild.name}**!\n\n` +
            `> I'm **[Lunexa](https://discord.gg/nexcloud)**, your favorite music bot.\n\n` +
            `> You can add me to your server [Click Here](https://discord.com/oauth2/authorize?client_id=1390965840437968896&permissions=8&integration_type=0&scope=bot)\n\n` +
            `> You are the **${member.guild.memberCount}th** member here!`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: `Support • Website • Invite • Hosting`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Support")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/eMnU7MQ2Zm"),
        new ButtonBuilder()
          .setLabel("Website")
          .setStyle(ButtonStyle.Link)
          .setURL("https://nexcloud.xyz"),
        new ButtonBuilder()
          .setLabel("Invite")
          .setStyle(ButtonStyle.Link)
          .setURL(
            "https://discord.com/oauth2/authorize?client_id=1390965840437968896&permissions=8&integration_type=0&scope=bot"
          ),
        new ButtonBuilder()
          .setLabel("Hosting")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/nexcloud")
      );

      // ✅ Send DM
      try {
        await member.send({
          content: `**[NexCloud Hosting](https://discord.gg/XvW8Akkhq8)**`,
          embeds: [welcomeEmbed],
          components: [row],
        });

        // 🟢 Log DM Sent to DM webhook
        const logEmbed = new EmbedBuilder()
          .setColor(client.color || 0x2b2d31)
          .setTitle("Lunexa • DM Sent")
          .addFields(
            {
              name: "User Info",
              value: `**Tag:** ${member.user.tag}\n**ID:** ${member.id}\n**Created:** <t:${Math.floor(
                member.user.createdTimestamp / 1000
              )}:R>`,
            },
            {
              name: "Guild Info",
              value: `**Guild:** ${member.guild.name}\n**Members:** ${member.guild.memberCount}`,
            }
          )
          .setFooter({ text: `Lunexa is Love` })
          .setTimestamp();

        await dmWebhook.send({ embeds: [logEmbed] });
      } catch {
        // ignore DM fail
      }
    } catch (err) {
      console.error("Error in memberJoinDM event:", err);
    }
  });
};
