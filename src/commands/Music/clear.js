const { Message, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "clear",
  aliases: ["clearqueue"],
  description: `Clear song in queue!`,
  // userPermissions: PermissionFlagsBits.SendMessages,
  // botPermissions: PermissionFlagsBits.SendMessages,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  premium: false,
  dj: true,
  run: async (client, message, args, prefix, player) => {
    if (!player) {
      const embed = new EmbedBuilder()
        .setDescription("<:cross:1433807192003444848> | No Player Found For This Guild!")
        .setColor(client.config.color);
      return message.channel.send({ embeds: [embed] });
    }

    await player.queue.clear();

    const embed = new EmbedBuilder()
      .setDescription("<:check:1433806961773903914> | *Queue has been:* `Cleared`")
      .setColor(client.color);

    return message.reply({ embeds: [embed] });
  },
};
