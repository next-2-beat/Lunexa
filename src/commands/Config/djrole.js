const {
  Message,
  PermissionFlagsBits,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const dj = require("../../models/DjroleSchema.js");

module.exports = {
  name: "djrole",
  aliases: ["dj"],
  description: "Setup DJ role for your server",
  //userPermissions: PermissionFlagsBits.ManageGuild,
  //botPermissions: PermissionFlagsBits.Speak,
  cooldowns: 5,
  category: "Config",
  premium: false,
  voteOnly: false,
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return message.channel.send(`${client.emoji.cross} | You don't have enough permissions!`);

    try {
      const data = await dj.findOne({ guildId: message.guild.id });
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(
            `If you want to setup DJ role, you need to use ${prefix}djrole add/remove`
          );
        return message.channel.send({ embeds: [embed] });
      }

      if (args[0].toLowerCase() === "add") {
        if (data) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${client.emoji.cross} | You have already enabled the DJ role system.`);
          return message.channel.send({ embeds: [embed] });
        } else {
          const role = message.guild.roles.cache.get(args[1]);
          if (!role || isNaN(role)) {
            const embed = new EmbedBuilder()
              .setColor(client.color)
              .setDescription(
                `${client.emoji.cross} | Role not found. Please provide a valid role ID.`
              );
            return message.channel.send({ embeds: [embed] });
          }
          await dj.create({
            guildId: message.guild.id,
            roleId: role.id,
          });
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${client.emoji.tick} | Successfully enabled the DJ role system.`);
          return message.channel.send({ embeds: [embed] });
        }
      }

      if (args[0].toLowerCase() === "remove") {
        if (!data) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${client.emoji.cross} | You don't have a DJ role system in this server.`);
          return message.channel.send({ embeds: [embed] });
        }

        await dj.findOneAndDelete({ guildId: message.guild.id });
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`${client.emoji.tick} | Successfully deleted the DJ role system.`);
        return message.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.log(error);
    }
  },
};
