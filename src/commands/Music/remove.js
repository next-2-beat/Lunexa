const { Message, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "remove",
  description: `Remove a Song From The Queue!`,
  // userPermissions: PermissionFlagsBits.SendMessages,
  // botPermissions: PermissionFlagsBits.SendMessages,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  voteOnly: false,
  premium: false,
  dj: true,
  run: async (client, message, args, prefix, player) => {
    if (!player) {
      const embed = new EmbedBuilder()
        .setDescription("<:cross:1433807192003444848> | No Player Found For This Guild!")
        .setColor(client.config.color);
      return message.channel.send({ embeds: [embed] });
    }

    if (!args[0]) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              `Use the command again, and this time provide me the position of the song you want to remove.`
            ),
        ],
      });
    }
    if (isNaN(args[0]) || args[0] > player.queue.length || args[0] <= 0) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`<:cross:1433807192003444848> | Invalid song position.`),
        ],
      });
    }
    player.queue.remove(args[0] - 1);
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`<:check:1433806961773903914> | Removed song **${args[0]}** from the queue.`),
      ],
    });
  },
};
