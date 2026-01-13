const {
  Message,
  PermissionFlagsBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");
const pSchema = require("../../models/PrefixSchema.js");

module.exports = {
  name: "prefix",
  aliases: ["set-prefix", "setprefix"],
  description: "Change the bot's command prefix",
  userPermissions: PermissionFlagsBits.ManageGuild,
  botPermissions: PermissionFlagsBits.SendMessages,
  cooldowns: 5,
  category: "Config",
  premium: false,

  run: async (client, message, args) => {
    const tick = "<:check:1433806961773903914>";
    const cross = "<:cross:1433807192003444848>";

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.channel.send(`${cross} | You don't have permission to change the prefix.`);
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${cross} | Please provide a new prefix.`)
        ],
        allowedMentions: { repliedUser: false }
      });
    }

    if (newPrefix.length > 5) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${cross} | Prefix too long. Maximum 5 characters allowed.`)
        ],
        allowedMentions: { repliedUser: false }
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_prefix")
        .setLabel("Set Prefix")
        .setEmoji(tick)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel_prefix")
        .setLabel("Cancel")
        .setEmoji(cross)
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`You requested to set the prefix to \`${newPrefix}\`.\nDo you want to apply this change?`)
      ],
      components: [row],
      allowedMentions: { repliedUser: false }
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
      max: 1
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: "Only the command author can respond.", ephemeral: true });
      }

      if (interaction.customId === "confirm_prefix") {
        let data = await pSchema.findOne({ serverId: message.guild.id });

        if (!data) {
          data = new pSchema({ serverId: message.guild.id, prefix: newPrefix });
          await data.save();
        } else {
          await data.updateOne({ prefix: newPrefix });
        }

        const botMember = await message.guild.members.fetch(client.user.id).catch(() => null);
        if (botMember && botMember.manageable) {
          const newNick = `Floovi [${newPrefix}]`;
          await botMember.setNickname(newNick).catch(() => {});
        }

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${tick} | Prefix successfully set to \`${newPrefix}\`.`)
          ],
          components: []
        });
      } else if (interaction.customId === "cancel_prefix") {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${cross} | Prefix change cancelled.`)
          ],
          components: []
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await msg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${cross} | No response received. Prefix change request timed out.`)
          ],
          components: []
        });
      }
    });
  }
};