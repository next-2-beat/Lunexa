const {
  Message,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const BlacklistUserSchema = require("../../models/BlacklistUserSchema.js");
const { chunk } = require("lodash");

module.exports = {
  name: "bluser",
  aliases: ["bluser"],
  description: "Blacklist User",
  category: "Owner",
  ownerOnly: true,
  run: async (client, message, args, prefix) => {
    if (!client.config.ownerIDS.includes(message.author.id)) return;

    try {
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`Use ${prefix}bluser add/remove/list [userId]`);
        return message.channel.send({ embeds: [embed] });
      }

      const userId = args[1];
      const data = userId ? await BlacklistUserSchema.findOne({ userId }) : null;

      if (args[0].toLowerCase() === "add") {
        if (!userId || isNaN(userId)) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription("Please provide a valid user ID to blacklist.");
          return message.channel.send({ embeds: [embed] });
        }

        if (data) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription("This user is already blacklisted.");
          return message.channel.send({ embeds: [embed] });
        }

        await BlacklistUserSchema.create({ userId });
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`User <@${userId}> has been blacklisted.`);
        return message.channel.send({ embeds: [embed] });

      } else if (args[0].toLowerCase() === "remove") {
        if (!userId || isNaN(userId)) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription("Please provide a valid user ID to remove from blacklist.");
          return message.channel.send({ embeds: [embed] });
        }

        if (!data) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription("This user is not blacklisted.");
          return message.channel.send({ embeds: [embed] });
        }

        await BlacklistUserSchema.findOneAndDelete({ userId });
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`User <@${userId}> has been removed from the blacklist.`);
        return message.channel.send({ embeds: [embed] });

      } else if (args[0].toLowerCase() === "list" || args[0].toLowerCase() === "show") {
        const data = await BlacklistUserSchema.find();
        let users = [];

        for (let i = 0; i < data.length; i++) {
          try {
            const user = await client.users.fetch(data[i].userId);
            users.push(`[${i + 1}]. [${user.tag}](https://discord.com/users/${user.id})`);
          } catch (e) {
            users.push(`[${i + 1}]. [Unknown User](https://discord.com/users/${data[i].userId})`);
          }
        }

        if (users.length === 0) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription("No users are currently blacklisted.");
          return message.channel.send({ embeds: [embed] });
        }

        let pages = chunk(users, 10).map((x) => x.join("\n"));
        let page = 0;

        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle("Blacklisted Users")
          .setDescription(pages[page])
          .setFooter({ text: `Page ${page + 1} of ${pages.length}` });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("Stop")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === pages.length - 1)
        );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({
          filter: (interaction) => interaction.user.id === message.author.id,
          time: 1000 * 60 * 5,
        });

        collector.on("collect", async (interaction) => {
          if (interaction.customId === "prev") {
            page = Math.max(page - 1, 0);
          } else if (interaction.customId === "next") {
            page = Math.min(page + 1, pages.length - 1);
          } else if (interaction.customId === "stop") {
            return collector.stop();
          }

          await interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setTitle("Blacklisted Users")
                .setDescription(pages[page])
                .setFooter({ text: `Page ${page + 1} of ${pages.length}` })
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("prev")
                  .setLabel("Previous")
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(page === 0),
                new ButtonBuilder()
                  .setCustomId("stop")
                  .setLabel("Stop")
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("next")
                  .setLabel("Next")
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(page === pages.length - 1)
              )
            ]
          });
        });

        collector.on("end", async () => {
          await msg.edit({
            components: [],
          });
        });
      }
    } catch (error) {
      console.error(error);
    }
  },
};
