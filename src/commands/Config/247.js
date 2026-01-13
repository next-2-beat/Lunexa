const {
  PermissionFlagsBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");

const reconnectAuto = require("../../models/reconnect.js");

module.exports = {
  name: "24/7",
  aliases: ["247", "tfs", "twentyfourseven"],
  description: "Toggle 24/7 mode in your voice channel",
  botPermissions: PermissionFlagsBits.Speak,
  cooldowns: 5,
  category: "Config",
  inVc: true,
  sameVc: true,
  voteOnly: false,
  premium: true,

  run: async (client, message) => {
    const tick = "<:check:1433806961773903914>";
    const cross = "<:cross:1433807192003444848>";

    const voiceChannel = message.member.voice.channel;
    const botPerms = voiceChannel.permissionsFor(message.guild.members.me);

    // Bot Permission Checks
    if (!botPerms?.has(PermissionsBitField.Flags.ViewChannel))
      return message.reply(`${cross} | I need **View Channel** permission.`);
    if (!botPerms?.has(PermissionsBitField.Flags.Connect))
      return message.reply(`${cross} | I need **Connect** permission.`);
    if (!botPerms?.has(PermissionsBitField.Flags.Speak))
      return message.reply(`${cross} | I need **Speak** permission.`);

    // OWNER + MANAGE GUILD ONLY
    const botOwners = client.config?.owners || ["1390894184512356392"];
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
      !botOwners.includes(message.author.id)
    ) {
      return message.reply(
        `${cross} | Only **Manage Server** members or **Bot Owners** can use 24/7.`
      );
    }

    // Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("enable_247")
        .setLabel("Enable")
        .setStyle(ButtonStyle.Success)
        .setEmoji(tick),

      new ButtonBuilder()
        .setCustomId("disable_247")
        .setLabel("Disable")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(cross)
    );

    const msg = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`**Choose what to do with 24/7 mode in \`${voiceChannel.name}\`:**`)
      ],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
      max: 1,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: `${cross} | Only the command user can interact.`,
          ephemeral: true,
        });
      }

      const data = await reconnectAuto.findOne({ GuildId: message.guild.id });

      try {

        // ENABLE 24/7
        if (interaction.customId === "enable_247") {
          if (data) {
            return interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.color)
                  .setDescription(`${cross} | 24/7 mode is already **enabled**.`)
              ],
              components: [],
            });
          }

          await reconnectAuto.create({
            GuildId: message.guild.id,
            TextId: message.channel.id,
            VoiceId: voiceChannel.id,
          });

          // ✔ SAFE — ALWAYS USE createConnection()
          await client.manager.createConnection({
            guildId: message.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: message.channel.id,
            deaf: true,
          });

          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`${tick} | 24/7 mode has been **enabled**.`)
            ],
            components: [],
          });
        }

        // DISABLE 24/7
        if (interaction.customId === "disable_247") {
          if (!data) {
            return interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.color)
                  .setDescription(`${cross} | 24/7 mode is already **disabled**.`)
              ],
              components: [],
            });
          }

          await reconnectAuto.findOneAndDelete({ GuildId: message.guild.id });

          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`${tick} | 24/7 mode has been **disabled**.`)
            ],
            components: [],
          });
        }

      } catch (e) {
        console.error("24/7 interaction error:", e);
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        try {
          const fetched = await message.channel.messages.fetch(msg.id).catch(() => null);
          if (!fetched) return;

          await fetched.edit({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`${cross} | You didn’t choose any option in time. Session ended.`)
            ],
            components: [],
          });
        } catch (err) {
          if (err.code !== 10008) console.error("24/7 collector end error:", err);
        }
      }
    });
  },
};
