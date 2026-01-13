const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Genius = require("genius-lyrics");

const Client = new Genius.Client(); // no token needed for basic search

module.exports = {
  name: "lyrics",
  aliases: ["ly"],
  description: "Fetch lyrics for the current song or given query",
  category: "Music",
  owner: false,

  run: async (client, message, args, prefix) => {
    try {
      const query = args.join(" ");
      const player = client.manager.players.get(message.guild.id);

      let searchQuery;
      if (query) {
        searchQuery = query;
      } else if (player && player.current) {
        searchQuery = player.current.info?.title || player.current.title;
      } else {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setAuthor({ name: "No Song Found" })
              .setDescription("There is no active song or query to fetch lyrics."),
          ],
        });
      }

      await message.channel.sendTyping();

      // Search song on Genius
      const searches = await Client.songs.search(searchQuery);
      if (!searches.length) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setAuthor({ name: "No Lyrics Found" })
              .setDescription(`Couldn't find lyrics for **${searchQuery}**.`),
          ],
        });
      }

      const song = searches[0];
      const lyrics = await song.lyrics();

      // Split into pages (max 4096 chars per embed description)
      const chunkSize = 4096;
      const chunks = [];
      for (let i = 0; i < lyrics.length; i += chunkSize) {
        chunks.push(lyrics.substring(i, i + chunkSize));
      }

      let page = 0;
      const totalPages = chunks.length;

      const generateEmbed = (page) => {
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setAuthor({ name: `Lyrics for: ${song.title} — ${song.artist.name}` })
          .setDescription(chunks[page])
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

        if (song.thumbnail) embed.setThumbnail(song.thumbnail);
        return embed;
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_lyrics")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next_lyrics")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(totalPages <= 1)
      );

      const msg = await message.channel.send({
        embeds: [generateEmbed(page)],
        components: [row],
      });

      const collector = msg.createMessageComponentCollector({
        time: 60 * 1000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: "You can't control this lyrics embed.", ephemeral: true });
        }

        if (interaction.customId === "prev_lyrics") {
          page = page > 0 ? page - 1 : page;
        } else if (interaction.customId === "next_lyrics") {
          page = page + 1 < totalPages ? page + 1 : page;
        }

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev_lyrics")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next_lyrics")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page + 1 === totalPages)
        );

        await interaction.update({
          embeds: [generateEmbed(page)],
          components: [newRow],
        });
      });

      collector.on("end", async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev_lyrics")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next_lyrics")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        await msg.edit({ components: [disabledRow] });
      });
    } catch (error) {
      console.error("Lyrics command error:", error);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ name: "Error" })
            .setDescription("Something went wrong while fetching lyrics."),
        ],
      });
    }
  },
};
