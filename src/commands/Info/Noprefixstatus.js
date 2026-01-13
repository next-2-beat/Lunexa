const { EmbedBuilder } = require("discord.js");
const noPrefix = require("../../models/NoPrefixSchema.js");

module.exports = {
  name: "npstatus",
  aliases: ["nps", "checknp","np status","noprefixstatus","noprefixst"],
  description: "Check if a user has NoPrefix status",
  category: "Info",
  ownerOnly: false,

  run: async (client, message, args) => {
    let user =
      message.mentions.users.first() ||
      (args[0] && !isNaN(args[0]) && await client.users.fetch(args[0]).catch(() => null)) ||
      message.author;

    if (!user)
      return message.channel.send({
        embeds: [
          new EmbedBuilder().setColor("Red").setDescription("Please mention a valid user or provide a valid ID."),
        ],
      });

    const data = await noPrefix.findOne({ userId: user.id });
    if (!data)
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`<:cross:1433807192003444848> <@${user.id}> does not have NoPrefix access.`),
        ],
      });

    const remaining = data.expireAt ? data.expireAt - Date.now() : null;
    if (remaining !== null && remaining <= 0) {
      await noPrefix.findOneAndDelete({ userId: user.id });
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`<:cross:1433807192003444848> <@${user.id}>'s NoPrefix access has expired.`),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🧩 NoPrefix Status")
      .setDescription(
        `**User:** <@${user.id}>\n**Status:** <:check:1433806961773903914> Active\n**Expires:** ${
          remaining ? formatDuration(remaining) : "Unlimited"
        }`
      );

    return message.channel.send({ embeds: [embed] });
  },
};

function formatDuration(ms) {
  const parts = [
    { label: "y", value: Math.floor(ms / 31557600000) },
    { label: "w", value: Math.floor(ms / 604800000) % 52 },
    { label: "d", value: Math.floor(ms / 86400000) % 7 },
    { label: "h", value: Math.floor(ms / 3600000) % 24 },
    { label: "m", value: Math.floor(ms / 60000) % 60 },
    { label: "s", value: Math.floor(ms / 1000) % 60 },
  ];
  return parts.filter((p) => p.value).map((p) => `${p.value}${p.label}`).join(", ") || "0s";
}