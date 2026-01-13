const { EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  name: "ping",
  aliases: [],
  description: "Check bot and database latency",
  category: "Info",
  run: async (client, message, args) => {
    try {
      const msg = await message.channel.send("Pinging...");

      // Bot latency
      const botLatency = msg.createdTimestamp - message.createdTimestamp;
      // API latency
      const apiLatency = Math.round(client.ws.ping);

      // DB latency
      const dbStart = Date.now();
      await mongoose.connection.db.admin().ping();
      const dbLatency = Date.now() - dbStart;

      // Build embed
      const embed = new EmbedBuilder()
        .setAuthor({ 
          name: client.user.username, 
          iconURL: client.user.displayAvatarURL() 
        })
        .setTitle("Pong!")
        .setColor(0xbb00ff)
        .addFields(
          { name: "Bot Latency", value: `\`${apiLatency} ms\``, inline: true },
          { name: "Database Latency", value: `\`${dbLatency} ms\``, inline: true },
        )
        .setFooter({ 
          text: `${message.author.tag}`, 
          iconURL: message.author.displayAvatarURL() 
        })
        .setTimestamp();

      await msg.edit({ content: "", embeds: [embed] });
    } catch (err) {
      console.error(err);
      message.reply("An error occurred while checking the ping.");
    }
  }
};
