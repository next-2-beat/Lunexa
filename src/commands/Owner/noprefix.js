const { 
  EmbedBuilder, 
  WebhookClient, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");
const noPrefix = require("../../models/NoPrefixSchema.js");

// Owner IDs
const ownerIDS = ['1390894184512356392', '1409859901488103516'];

// Webhook for logs (replace with your own)
const logWebhook = new WebhookClient({ 
  url: "https://discord.com/api/webhooks/1439967266954285170/0DL0dQLoCgk__l1u2yLC8xFvHNs0-x58e0EA-I2UxnZ7ENSyX86YwdjsBaaNZVeGRVV1" 
});

module.exports = {
  name: "noprefix",
  aliases: ["prime", 'np'],
  description: "Add or remove users from the NoPrefix list",
  category: "Owner",
  ownerOnly: false,

  run: async (client, message, args, prefix) => {
    // === Owner check ===
    if (!ownerIDS.includes(message.author.id)) return;

    try {
      let userId;
      if (message.mentions.users.size) {
        userId = message.mentions.users.first().id;
      } else if (args[1] && !isNaN(args[1])) {
        userId = args[1];
      }

      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor("Yellow")
          .setAuthor({ name: "NoPrefix Manager", iconURL: client.user.displayAvatarURL() })
          .setDescription(`⚙️ Usage: \`${prefix}noprefix add/remove/list [user] [duration]\``);
        return message.channel.send({ embeds: [embed] });
      }

      // === ADD USER ===
      if (args[0].toLowerCase() === "add") {
        if (!userId) {
          return message.channel.send({
            embeds: [new EmbedBuilder().setColor("Red").setDescription("<:cross:1433807192003444848> Please mention a user or provide a valid ID to add.")]
          });
        }

        let duration = null;
        if (args[2]) {
          const timeMatch = args[2].match(/^(\d+)(s|m|h|d|w|y)$/);
          if (timeMatch) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31557600000 };
            duration = value * multipliers[unit];
          }
        }

        const existingData = await noPrefix.findOne({ userId });
        if (existingData) {
          return message.channel.send({
            embeds: [new EmbedBuilder().setColor("Orange").setDescription("⚠️ This user already has NoPrefix enabled.")]
          });
        }

        const expireAt = duration ? Date.now() + duration : null;
        await noPrefix.create({ userId, expireAt });

        const successEmbed = new EmbedBuilder()
          .setColor("Green")
          .setAuthor({ name: "NoPrefix Added" })
          .setDescription(`> 👤 <@${userId}> has been granted **NoPrefix access**\n**Duration:** \`${duration ? formatDuration(duration) : "Unlimited"}\``);

        await message.channel.send({ embeds: [successEmbed] });
        await sendLog("Added", message.author, userId, duration);
      }

      // === REMOVE USER ===
      if (args[0].toLowerCase() === "remove") {
        if (!userId) {
          return message.channel.send({
            embeds: [new EmbedBuilder().setColor("Red").setDescription("<:cross:1433807192003444848> Please mention a user or provide a valid ID to remove.")]
          });
        }

        const data = await noPrefix.findOne({ userId });
        if (!data) {
          return message.channel.send({
            embeds: [new EmbedBuilder().setColor("Orange").setDescription("<:cross:1433807192003444848> This user does not have NoPrefix.")]
          });
        }

        await noPrefix.findOneAndDelete({ userId });

        const removedEmbed = new EmbedBuilder()
          .setColor("Red")
          .setAuthor({ name: "NoPrefix Removed" })
          .setDescription(`> 👤 <@${userId}> has been **removed** from the NoPrefix list.`);

        await message.channel.send({ embeds: [removedEmbed] });
        await sendLog("Removed", message.author, userId);
      }

      // === LIST USERS ===
      if (["list", "show"].includes(args[0].toLowerCase())) {
        const data = await noPrefix.find();
        if (!data.length) {
          return message.channel.send({
            embeds: [new EmbedBuilder().setColor("Grey").setDescription("<:cross:1433807192003444848> No users currently have NoPrefix.")]
          });
        }

        let users = [];
        for (let i = 0; i < data.length; i++) {
          try {
            const user = await client.users.fetch(data[i].userId);
            let expiryText;

            if (data[i].expireAt) {
              let remainingTime = data[i].expireAt - Date.now();
              if (remainingTime > 0) {
                expiryText = `⏳ Expires in \`${formatDuration(remainingTime)}\``;
              } else {
                await noPrefix.findOneAndDelete({ userId: data[i].userId });
                continue;
              }
            } else {
              expiryText = "Unlimited";
            }

            users.push(`**${i + 1}.** [${user.globalName || user.username}](https://discord.com/users/${user.id}) — ${expiryText}`);
          } catch {
            continue;
          }
        }

        if (!users.length) {
          return message.channel.send({
            embeds: [new EmbedBuilder().setColor("Grey").setDescription("ℹ️ No active NoPrefix users found.")]
          });
        }

        const chunkSize = 10;
        let pages = [];
        for (let i = 0; i < users.length; i += chunkSize) {
          const chunk = users.slice(i, i + chunkSize);
          const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("📋 NoPrefix List")
            .setDescription(chunk.join("\n"))
            .setFooter({ text: `Page ${pages.length + 1}/${Math.ceil(users.length / chunkSize)}` });

          pages.push(embed);
        }

        let page = 0;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary)
        );

        const msg = await message.channel.send({ embeds: [pages[page]], components: pages.length > 1 ? [row] : [] });

        if (pages.length > 1) {
          const collector = msg.createMessageComponentCollector({ time: 60000 });

          collector.on("collect", async (i) => {
            if (i.user.id !== message.author.id) {
              return i.reply({ content: "You cannot use these buttons.", ephemeral: true });
            }

            if (i.customId === "prev") {
              page = page > 0 ? page - 1 : pages.length - 1;
            } else if (i.customId === "next") {
              page = page + 1 < pages.length ? page + 1 : 0;
            }

            await i.update({ embeds: [pages[page]], components: [row] });
          });

          collector.on("end", () => {
            msg.edit({ components: [] }).catch(() => {});
          });
        }
      }

    } catch (error) {
      console.log(error);
    }
  }
};

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000) % 24;
  const days = Math.floor(ms / 86400000) % 7;
  const weeks = Math.floor(ms / 604800000) % 52;
  const years = Math.floor(ms / 31557600000);

  let parts = [];
  if (years) parts.push(`${years}y`);
  if (weeks) parts.push(`${weeks}w`);
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  return parts.length ? parts.join(", ") : "0s";
}

// === Logging Function ===
async function sendLog(action, executor, targetId, duration = null) {
  const logEmbed = new EmbedBuilder()
    .setColor(action.includes("Added") ? "Green" : "Red")
    .setTitle(`NoPrefix ${action}`)
    .addFields(
      { name: "> Target User", value: `<@${targetId}> (\`${targetId}\`)`, inline: false },
      { name: "> Moderator", value: `${executor.tag} (\`${executor.id}\`)`, inline: false },
      { name: "> Duration", value: duration ? formatDuration(duration) : "Unlimited", inline: false }
    )
    .setTimestamp();

  return logWebhook.send({ embeds: [logEmbed] }).catch(() => {});
}
