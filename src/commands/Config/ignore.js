const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const IgnoreChannelSchema = require("../../models/IgnoreChannelSchema.js");

module.exports = {
  name: "ignore",
  aliases: ["ign"],
  description: "Manage ignored channels.",
  cooldowns: 5,
  category: "Config",
  userPermissions: [PermissionsBitField.Flags.ManageGuild],
  botPermissions: [],

  run: async (client, message, args) => {
    // Check if the user provided valid arguments
    if (!args[0] || !["add", "remove"].includes(args[0].toLowerCase())) {
      const mainEmbed = new EmbedBuilder()
        .setColor(client.color)
        .setTitle("Ignore Command")
        .setDescription("Usage:\n`ignore add <#channel>` - Add a channel to the ignore list.\n`ignore remove <#channel>` - Remove a channel from the ignore list.");
      return message.channel.send({ embeds: [mainEmbed] });
    }

    // Get the action (add or remove) and the channel
    const action = args[0].toLowerCase();
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);

    // Validate the channel
    if (!channel || !channel.isTextBased() || !channel.viewable) {
      const errorEmbed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription("<:cross:1433807192003444848> Please provide a valid text channel.");
      return message.channel.send({ embeds: [errorEmbed] });
    }

    try {
      if (action === "add") {
        // Check if the channel is already ignored
        const exists = await IgnoreChannelSchema.findOne({
          guildId: message.guild.id,
          channelId: channel.id,
        });

        if (exists) {
          const alreadyIgnoredEmbed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`<:cross:1433807192003444848> ${channel} is already ignored.`);
          return message.channel.send({ embeds: [alreadyIgnoredEmbed] });
        }

        // Add the channel to the ignore list
        await IgnoreChannelSchema.create({
          guildId: message.guild.id,
          channelId: channel.id,
        });

        const successEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`<:check:1433806961773903914> ${channel} has been added to the ignore list.`);
        return message.channel.send({ embeds: [successEmbed] });

      } else if (action === "remove") {
        // Check if the channel is in the ignore list
        const exists = await IgnoreChannelSchema.findOne({
          guildId: message.guild.id,
          channelId: channel.id,
        });

        if (!exists) {
          const notIgnoredEmbed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`<:cross:1433807192003444848> ${channel} is not in the ignore list.`);
          return message.channel.send({ embeds: [notIgnoredEmbed] });
        }

        // Remove the channel from the ignore list
        await IgnoreChannelSchema.deleteOne({
          guildId: message.guild.id,
          channelId: channel.id,
        });

        const successEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`<:check:1433806961773903914> ${channel} has been removed from the ignore list.`);
        return message.channel.send({ embeds: [successEmbed] });
      }
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription("<:cross:1433807192003444848> An error occurred while processing the command.");
      return message.channel.send({ embeds: [errorEmbed] });
    }
  },
};