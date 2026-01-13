const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");
const os = require("os");

module.exports = {
  name: "stats",
  aliases: ["botinfo", "st", "bi"],
  description: "Show bot and Lavalink stats",
  category: "Info",

  run: async (client, message, args) => {
    try {
      const formatDuration = (ms) => {
        let sec = Math.floor(ms / 1000);
        let min = Math.floor(sec / 60);
        let hrs = Math.floor(min / 60);
        let days = Math.floor(hrs / 24);

        sec %= 60;
        min %= 60;
        hrs %= 24;

        return `${days}d ${hrs}h ${min}m ${sec}s`;
      };

      const uptime = formatDuration(client.uptime);
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const cpuLoad = os.loadavg()[0].toFixed(2);
      const users = 0;
      const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0) + users;
      const embedColor = "#bb00ff";
      const botAvatar = client.user.displayAvatarURL({ dynamic: true, size: 1024 });
      const footerData = { text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() };

      // Images for each embed - replace these URLs with your own
      const generalImage = "https://media.discordapp.net/attachments/1390938110929666058/1434405765321592842/Profile_Banner_1.png?ex=690835f8&is=6906e478&hm=7bf38aa8b4440c4eb835ee29299ad57feffb288078f5a90e7e2406b5cdf4efa9&=&format=webp&quality=lossless&width=304&height=54";
      const nodeImage = generalImage; // same image, can change if you want
      const teamImage = generalImage; // same image, can change if you want

      // 🔹 General Embed
      const generalEmbed = new EmbedBuilder()
        .setTitle("General Bot Statistics")
        .setDescription("Here's a quick overview of Lunexa's current statistics and system info.")
        .setColor(embedColor)
        .setThumbnail(botAvatar)
        .setImage(generalImage)
        .addFields(
          { name: "\u200b", value: "", inline: false },
          { name: "Servers", value: `${client.guilds.cache.size.toLocaleString()}`, inline: true },
          { name: "Users", value: `${totalUsers.toLocaleString()}`, inline: true },
          { name: "Uptime", value: uptime, inline: true },
          { name: "Usage", value: `${memoryUsage} MB`, inline: true },
          { name: "Load", value: `${cpuLoad}%`, inline: true },
          { name: "Shard", value: `ID: ${message.guild.shardId} / ${client.ws.shards.size}`, inline: true },
          { name: "Version", value: "2.0.1", inline: true }, 
          { name: "Discord.js", value: require("discord.js").version, inline: true },
          { name: "Node.js", value: process.version, inline: true },
          { name: "Platform", value: os.platform(), inline: true }
        )
        .setFooter(footerData)
        .setTimestamp();

      // 🔹 Node Embed
      // Riffy stores connected node instances in manager.nodeMap. Fall back to manager.nodes if unavailable.
      const shoukakuNodes = client.manager?.nodeMap
        ? Array.from(client.manager.nodeMap.values())
        : Array.from(client.manager?.nodes?.values() || []);

      let nodesDescription = "<:warn:1433812979349983232> Lavalink nodes not connected.";

      if (shoukakuNodes.length > 0) {
        nodesDescription = shoukakuNodes.map((node) => {
          // Prefer explicit connected flag when available
          const isConnected = Boolean(node?.connected) || Boolean(node?.stats);
          const stats = node?.stats || {};
          return (
            `**Node:** ${node.name || node?.id || "unknown"}\n` +
            `> State: ${isConnected ? "<a:online:1433819842418577538> Connected" : "<a:offline:1434408134893637773> Disconnected"}\n` +
            `> Players: ${stats.players || 0}\n` +
            `> Playing: ${stats.playingPlayers || 0}\n` +
            `> Uptime: ${formatDuration(stats.uptime || 0)}\n` +
            `> Memory: ${stats.memory ? ((stats.memory.used || 0) / 1024 / 1024).toFixed(2) : 0} MB\n`
          );
        }).join("\n");
      }

      const nodeEmbed = new EmbedBuilder()
        .setTitle("Lavalink Node Stats")
        .setColor(embedColor)
        .setThumbnail(botAvatar)
        .setImage(nodeImage)
        .setDescription(nodesDescription)
        .setFooter(footerData)
        .setTimestamp();

      // 🔹 Team Embed with clickable mentions
      const teamEmbed = new EmbedBuilder()
        .setTitle("Lunexa Team")
        .setColor(embedColor)
        .setThumbnail(botAvatar)
        .setImage(teamImage)
        .setDescription(
          "**Lead Developer:**\n" +
          "<@1390894184512356392>\n\n" +
          "**Managers:**\n" +
          "<@1382014374021173300>\n\n" +
          "**Admin:**\n" +
          "<@1433006161132654633>\n\n" +
          "**Host:**\n" +
          "NexCloud Host\n\n" +
          "**Discord:** [Hosting](https://discord.gg/nexcloud)\n" +
          "**Discord:** [Support](https://discord.gg/eMnU7MQ2Zm)\n" +
          "**Invite Bot:** [Invite](https://discord.com/oauth2/authorize?client_id=1390965840437968896&permissions=8&integration_type=0&scope=bot)"
        )
        .setFooter(footerData)
        .setTimestamp();

      // 🔘 Buttons with emojis and text
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("general")
          .setLabel(" General")
          .setEmoji("1433846394711703563")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("node")
          .setLabel(" Node")
          .setEmoji("1433846394711703563")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("team")
          .setLabel(" Team")
          .setEmoji("1433846394711703563")
          .setStyle(ButtonStyle.Secondary)
      );

      const msg = await message.channel.send({ embeds: [generalEmbed], components: [row] });

      const collector = msg.createMessageComponentCollector({
        time: 60000,
        filter: (i) => i.user.id === message.author.id,
      });

      collector.on("collect", async (interaction) => {
        await interaction.deferUpdate();

        if (interaction.customId === "general") {
          await msg.edit({ embeds: [generalEmbed], components: [row] });
        } else if (interaction.customId === "node") {
          await msg.edit({ embeds: [nodeEmbed], components: [row] });
        } else if (interaction.customId === "team") {
          await msg.edit({ embeds: [teamEmbed], components: [row] });
        }
      });

      collector.on("end", () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          row.components.map((btn) => ButtonBuilder.from(btn).setDisabled(true))
        );
        msg.edit({ components: [disabledRow] }).catch(() => {});
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ An error occurred while fetching stats.");
    }
  },
};
