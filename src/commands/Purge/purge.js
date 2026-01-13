const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "purge",
  aliases: ["p"],
  description: "Delete a specific number of messages (max 9999)",
  category: "Advanced",
  userPermissions: PermissionFlagsBits.ManageMessages,
  botPermissions: PermissionFlagsBits.ManageMessages,
  cooldowns: 5,

  run: async (client, message, args) => {
    if (message.deletable) await message.delete().catch(() => {});

    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount < 1 || amount > 9999) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`Please provide a number between 1 and 9999.`),
        ],
      }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));
    }

    let deleted = 0;

    // Discord bulkDelete only supports max 100 at once
    let remaining = amount;
    while (remaining > 0) {
      const toDelete = remaining > 100 ? 100 : remaining;
      const fetched = await message.channel.messages.fetch({ limit: toDelete });
      const bulk = await message.channel.bulkDelete(fetched, true).catch(() => {});
      if (!bulk) break;
      deleted += bulk.size;
      remaining -= toDelete;
    }

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`Deleted ${deleted} messages.`),
      ],
    }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));
  },
};