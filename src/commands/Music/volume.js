const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "volume",
  aliases: ["vol", "v"],
  description: `Control the volume of the song.`,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,

  run: async (client, message, args, prefix, player) => {
    const tick = "<:check:1433806961773903914>";
    const cross = "<:cross:1433807192003444848>";

    if (!player) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | There's no active music player right now.\nPlay something first to adjust volume.`);
      return message.reply({ embeds: [embed] });
    }

    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${tick} | The current volume is set to **${player.options.volume}%**.\nUse \`${prefix}volume <amount>\` to change it.`);
      return message.reply({ embeds: [embed] });
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 200) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | Please enter a valid number between **1** and **200**.`);
      return message.reply({ embeds: [embed] });
    }

    if (player.options.volume === amount) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | Volume is already set to **${amount}%**.\nNo change needed.`);
      return message.reply({ embeds: [embed] });
    }

    player.setVolume(amount);

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setDescription(`${tick} | Volume successfully updated to **${amount}%**.\nEnjoy your music at the perfect level!`);

    return message.reply({ embeds: [embed] });
  },
};