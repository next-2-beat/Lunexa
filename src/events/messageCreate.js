const {
  EmbedBuilder,
  PermissionsBitField,
  Collection,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  WebhookClient,
} = require("discord.js");

const PrefixSchema = require("../models/PrefixSchema.js");
const BlacklistUserSchema = require("../models/BlacklistUserSchema.js");
const BlacklistServerSchema = require("../models/BlacklistServerSchema.js");
const NoPrefixSchema = require("../models/NoPrefixSchema.js");
const DjRoleSchema = require("../models/DjroleSchema.js");
const SetupSchema = require("../models/SetupSchema.js");
const IgnoreChannelSchema = require("../models/IgnoreChannelSchema.js");
const RestrictionSchema = require("../models/RestrictionSchema.js");
const PremiumGuildSchema = require("../models/PremiumGuildSchema.js");
const PremiumUserSchema = require("../models/PremiumUserSchema.js");

// ⭐ commandUsage REMOVED completely.

module.exports = async (client) => {
  client.on("messageCreate", async (message) => {
    try {
      if (message.author.bot || !message.guild || !message.id) return;

      const player = client.manager?.players.get(message.guild.id);
      const updateData = await SetupSchema.findOne({ guildId: message.guild.id });
      if (updateData && updateData.channelId === message.channel.id) return;

      const isBlacklisted = await BlacklistUserSchema.findOne({ userId: message.author.id });
      if (isBlacklisted) return;

      const isServerBlacklisted = await BlacklistServerSchema.findOne({
        serverId: message.guild.id,
      });
      if (isServerBlacklisted) return;

      // Prefix system
      let data = await PrefixSchema.findOne({ serverId: message.guild.id });
      let prefix = data ? data.prefix : client.config.prefix;

      const npData = await NoPrefixSchema.findOne({ userId: message.author.id });
      message.guild.prefix = prefix;

      const regex = new RegExp(`<@!?${client.user.id}>`);
      const pre = message.content.match(regex) ? message.content.match(regex)[0] : prefix;

      if (!npData && !message.content.startsWith(pre)) return;

      let args = !npData
        ? message.content.slice(pre.length).trim().split(/ +/)
        : message.content.startsWith(pre)
        ? message.content.slice(pre.length).trim().split(/ +/)
        : message.content.trim().split(/ +/);

      const cmd = args.shift()?.toLowerCase();
      const botTag = `<@${client.user.id}>`;

      if (!cmd && message.content === botTag) {
        const tagEmbed = new EmbedBuilder()
          .setColor("#bb00ff")
          .setAuthor({
            name: `${client.user.username}`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription(`
> **Prefix:** \`${prefix}\`

> Use **\`${prefix}help\`** to see all my commands.

Hello ${message.author}, Thanks for Using Lunexa`)
          .setImage("https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png")
          .setFooter({
            text: "Lunexa is Love",
            iconURL: message.author.displayAvatarURL(),
          });

        return message.reply({ embeds: [tagEmbed] });
      }

      const command =
        client.mcommands.get(cmd) ||
        client.mcommands.find((cmds) => cmds.aliases && cmds.aliases.includes(cmd));
      if (!command) return;

      // ⭐ Usage tracking removed completely.

      // Permission checks
      if (!["help", "stats", "ping", "invite", "support"].includes(cmd)) {
        const requiredPermissions = [
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.EmbedLinks,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
        ];

        const missingPermissions =
          message.guild.members.me.permissions.missing(requiredPermissions);

        if (missingPermissions.length > 0) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Missing Permissions")
                .setDescription(
                  `I don't have the required permissions.\n\n${missingPermissions
                    .map((p) => `\`${p}\``)
                    .join(", ")}`),
            ],
          });
        }
      }

      // Premium checks
      if (command.premium) {
        const premiumData = await PremiumGuildSchema.findOne({ Guild: message.guild.id });

        if (!premiumData) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setTitle("Premium Required")
                .setDescription(
                  `Hello, ${message.author}!\nYou've discovered an exclusive **premium command**.\n\n[Click here to upgrade](https://discord.gg/eMnU7MQ2Zm)`
                ),
            ],
          });
        }

        if (!premiumData.Permanent && Date.now() > premiumData.Expire) {
          await PremiumGuildSchema.deleteOne({ Guild: message.guild.id });

          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`Your premium subscription has expired.`),
            ],
          });
        }
      }

      // Cooldowns
      if (!client.config.ownerIDS.includes(message.author.id)) {
        if (!client.cooldowns) client.cooldowns = new Collection();
        if (!client.cooldowns.has(command.name))
          client.cooldowns.set(command.name, new Collection());

        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 5) * 1000;

        if (timestamps.has(message.author.id)) {
          const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);

            return message.channel
              .send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.color)
                    .setDescription(`⏳ Wait **${timeLeft}s** before using this again.`),
                ],
              })
              .then((msg) => setTimeout(() => msg.delete().catch(() => {}), 5000));
          }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
      }

      if (
        command.userPermissions &&
        !message.member.permissions.has(PermissionsBitField.resolve(command.userPermissions))
      ) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setDescription(`❌ | You don't have permission for this command.`),
          ],
        });
      }

      if (
        command.botPermissions &&
        !message.guild.members.me.permissions.has(
          PermissionsBitField.resolve(command.botPermissions)
        )
      ) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setDescription(`❌ | I don't have required permissions.`),
          ],
        });
      }

      if (command.inVc && !message.member.voice.channel) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setDescription("🎧 Join a voice channel first."),
          ],
        });
      }

      if (
        command.sameVc &&
        message.guild.members.me.voice.channel &&
        message.member.voice.channelId !== message.guild.members.me.voice.channel.id
      ) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setDescription("❌ | You must be in the same VC as me."),
          ],
        });
      }

      const restrictionData = await RestrictionSchema.findOne({
        guildId: message.guild.id,
      });

      if (restrictionData) {
        if (restrictionData.restrictedTextChannels.includes(message.channel.id)) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.config.color)
                .setDescription("🚫 | Commands disabled here."),
            ],
          });
        }
      }

      const ignored = await IgnoreChannelSchema.findOne({
        guildId: message.guild.id,
        channelId: message.channel.id,
      });

      if (ignored) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setDescription("⚠️ | Commands disabled in this channel."),
          ],
        });
      }

      if (command.execute) {
        await command.execute(client, message, args);
      } else if (command.run) {
        await command.run(client, message, args, prefix, player);
      }

      const commandlogs = new WebhookClient({ url: `${client.config.cmd_log}` });
      commandlogs.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Command Logs")
            .setColor(client.color)
            .addFields([
              {
                name: "Information",
                value: `Author: ${message.author.tag}\nCommand: \`${command.name}\`\nGuild: ${message.guild.name} (${message.guild.id})\nChannel: ${message.channel.name} (${message.channel.id})`,
              },
            ])
            .setThumbnail(message.guild.iconURL({ dynamic: true })),
        ],
      });
    } catch (err) {
      console.error(err);
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ | An error occurred while executing the command."),
        ],
      });
    }
  });
};

