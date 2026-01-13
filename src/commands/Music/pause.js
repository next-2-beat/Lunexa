const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "pause",
  aliases: ["pause"],
  description: `Pause the music`,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  premium: false,
  dj: true,

  run: async (client, message, args, prefix, player) => {
    const tick = "<:check:1433806961773903914>";
    const cross = "<:cross:1433807192003444848>";

    if (!player) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | No music is playing right now.\nJoin a voice channel and start a song first.`);
      return message.channel.send({ embeds: [embed] });
    }

    if (player.paused) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | The music is already paused.\nUse the \`resume\` command to continue playback.`);
      return message.reply({ embeds: [embed] });
    }

    await player.pause(true);

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setDescription(`${tick} | Music has been successfully paused.\nUse the \`resume\` command to play it again.`);

    return message.reply({ embeds: [embed] });
  },
};