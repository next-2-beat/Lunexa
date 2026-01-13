const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "purgeimages",
  aliases: ['pi'],
  description: "Delete messages with images/attachments",
  category: "Purge",
  userPermissions: PermissionFlagsBits.ManageMessages,
  botPermissions: PermissionFlagsBits.ManageMessages,
  cooldowns: 5,

  run: async (client, message, args) => {
    if (message.deletable) await message.delete().catch(() => {});

    const fetched = await message.channel.messages.fetch({ limit: 100 });
    
    const filtered = fetched.filter(m => m.attachments.size > 0);

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
