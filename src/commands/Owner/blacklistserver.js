const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits 
  } = require("discord.js");
  const BlacklistServer = require("../../models/BlacklistServerSchema.js");
  const pkg = require("lodash");
  const { chunk } = pkg;
  
  module.exports = {
    name: "blserver",
    aliases: ["blserver"],
    description: "Blacklist Server",
    category: "Owner",
    ownerOnly: true,
    run: async (client, message, args, prefix) => {
      if (!client.config.ownerIDS.includes(message.author.id)) return;
  
      try {
        const data = await BlacklistServer.findOne({ serverId: args[1] });
  
        if (!args[0]) {
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`Use ${prefix}blserver add/remove/list <serverId>`);
          return message.channel.send({ embeds: [embed] });
        }
  
        // Add server to blacklist
        if (args[0].toLowerCase() === "add") {
          if (data) {
            const embed = new EmbedBuilder()
              .setColor(client.color)
              .setDescription("Server already blacklisted");
            return message.channel.send({ embeds: [embed] });
          }
  
          if (!args[1]) {
            const embed = new EmbedBuilder()
              .setColor(client.color)
              .setDescription("Please provide a valid server ID to blacklist smjha na?");
            return message.channel.send({ embeds: [embed] });
          }
  
          await BlacklistServer.create({
            serverId: args[1],
            reason: args.slice(2).join(" ") || "No reason provided",
          });
  
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`Server with ID \`${args[1]}\` has been blacklisted.`);
          return message.channel.send({ embeds: [embed] });
        }
  
        // Remove server from blacklist
        if (args[0].toLowerCase() === "remove") {
          if (!args[1]) {
            const embed = new EmbedBuilder()
              .setColor(client.color)
              .setDescription("Please provide a valid server ID to remove");
            return message.channel.send({ embeds: [embed] });
          }
  
          if (!data) {
            const embed = new EmbedBuilder()
              .setColor(client.color)
              .setDescription("This server is not in the blacklist");
            return message.channel.send({ embeds: [embed] });
          }
  
          await BlacklistServer.findOneAndDelete({ serverId: args[1] });
  
          const embed = new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`Server with ID \`${args[1]}\` has been removed from the blacklist.`);
          return message.channel.send({ embeds: [embed] });
        }
  
        // List blacklisted servers
        if (args[0].toLowerCase() === "list") {
          const data = await BlacklistServer.find();
  
          const servers = data.map((server, index) => {
            return `[${index + 1}]. Server ID: ${server.serverId} - Reason: ${server.reason}`;
          });
  
          if (servers.length < 11) {
            const embed = new EmbedBuilder()
              .setColor(client.color)
              .setDescription(
                servers.length !== 0 ? servers.join("\n") : "No servers are blacklisted yet."
              )
              .setTitle("Blacklisted Servers");
  
            return message.channel.send({ embeds: [embed] });
          } else {
            const pages = chunk(servers, 10).map((page) => page.join("\n"));
            let page = 0;
  
            const embed = new EmbedBuilder()
              .setTitle("Blacklisted Servers")
              .setDescription(pages[page])
              .setColor(client.color);
  
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("prev")
                .setLabel("Previous")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
            );
  
            const msg = await message.reply({
              embeds: [embed],
              components: [row],
            });
  
            const collector = msg.createMessageComponentCollector({
              filter: (button) => button.user.id === message.author.id,
              time: 100000 * 7,
            });
  
            collector.on("collect", async (interaction) => {
              if (interaction.customId === "prev") {
                page = page > 0 ? --page : pages.length - 1;
              } else if (interaction.customId === "next") {
                page = page + 1 < pages.length ? ++page : 0;
              } else if (interaction.customId === "stop") {
                await collector.stop();
                return;
              }
  
              await interaction.update({
                embeds: [
                  new EmbedBuilder()
                    .setTitle("Blacklisted Servers")
                    .setDescription(pages[page])
                    .setColor(client.color),
                ],
              });
            });
  
            collector.on("end", async () => {
              await msg.edit({ embeds: [embed], components: [] });
            });
          }
        }
      } catch (error) {
        console.error(error);
        message.channel.send("An error occurred while processing the request.");
      }
    },
  };
  