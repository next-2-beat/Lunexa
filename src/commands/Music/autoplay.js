const { Message, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "autoplay",
  aliases: ["ap"],
  description: `Play random songs.`,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  voteOnly: false,
  premium: false,
  dj: true,
  run: async (client, message, args, prefix, player) => {
    try {
      const { channel } = message.member.voice;

      if (!player) {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: "No Player Found For This Guild",
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setColor(client.color);
        return message.channel.send({ embeds: [embed] });
      }

      if (player.isAutoplay) {
        player.isAutoplay = false;

        const embed = new EmbedBuilder()
          .setDescription("<:check:1433806961773903914> | *Autoplay has been:* `Deactivated`")
          .setColor(client.color);
        return message.reply({ embeds: [embed] });
      } else {
        if (!player.current) {
          const embed = new EmbedBuilder()
            .setDescription("<:cross:1433807192003444848> | No track is currently playing. Play a track first to enable autoplay.")
            .setColor(client.color);
          return message.reply({ embeds: [embed] });
        }

        const identifier = player.current.info.identifier;
        const node = client.manager.nodeMap?.values().next().value;
        
        if (!node) {
          return message.reply("No Lavalink nodes are available!");
        }

        // Use YouTube autoplay URL for best results
        const autoplayUrl = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
        
        let res;
        try {
          res = await client.manager.resolve({
            query: autoplayUrl,
            source: "ytmsearch",
            requester: message.author,
            node: node
          });
        } catch (err) {
          console.error(`[AUTOPLAY] Search failed:`, err.message);
          return message.reply("Failed to fetch autoplay tracks. Please try again.");
        }

        if (!res || !res.tracks || res.tracks.length === 0) {
          return message.reply("No valid related tracks found for autoplay.");
        }

        // Filter out the current track
        const filteredTracks = res.tracks.filter(t => t.info.identifier !== identifier);
        if (filteredTracks.length === 0) {
          return message.reply("No valid related tracks found for autoplay.");
        }

        player.isAutoplay = true;
        player.data.autoplayRequester = message.author;
        player.data.autoplayIdentifier = identifier;
        player.queue.add(filteredTracks[0]);

        const embed = new EmbedBuilder()
          .setDescription("<:check:1433806961773903914> | Autoplay has been: `Activated`")
          .setColor(client.color);

        return message.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.log(err);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "No Player Found For This Guild",
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setFooter({
          text: `If You Want To Enable Autoplay Then Play Something You Like`,
          iconURL: message.guild.iconURL({ dynamic: true })
        })
        .setColor(client.color);

      return message.channel.send({ embeds: [embed] });
    }
  }
}