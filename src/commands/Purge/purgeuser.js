const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "purgeuser",
  aliases: ['pu'],
  description: "Delete messages from a specific user",
  category: "Purge",
  userPermissions: PermissionFlagsBits.ManageMessages,
  botPermissions: PermissionFlagsBits.ManageMessages,
  cooldowns: 5,

  run: async (client, message, args) => {
    if (message.deletable) await message.delete().catch(() => {});

    const fetched = await message.channel.messages.fetch({ limit: 100 });
    const user = message.mentions.users.first() || client.users.cache.get(args[0]);
    if (!user) {
      return message.channel.send({
        embeds: [ new EmbedBuilder().setColor(client.color).setDescription(`Please mention a valid user.`) ],
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));
    }
    const filtered = fetched.filter(m => m.author.id === user.id);

    await message.channel.bulkDelete(filtered, true).catch(() => {});

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`Deleted ${filtered.size} messages.`),
      ],
    }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));
  },
};
