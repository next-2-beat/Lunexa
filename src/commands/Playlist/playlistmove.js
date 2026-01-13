const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/playlist.js");
const SharedPlaylist = require("../../models/sharedPlaylist.js");
const crypto = require("crypto");

/**
 * 🧩 Generate random verification code
 */
function generateRandomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = {
  name: "playlistmove",
  description: "Move or transfer your playlist to another server (with code verification)",
  async execute(client, message, args) {
    const playlistName = args.join(" ");

    if (!playlistName) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:cross:1433807192003444848> | Usage: `.playlistmove <playlist name>`"),
        ],
      });
    }

    // Fetch guild playlist data
    const guildData = await Playlist.findOne({ guildId: message.guild.id });
    if (!guildData || !guildData.playlists.length) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("<:warn:1433812979349983232> | No playlists found for this server."),
        ],
      });
    }

    const playlist = guildData.playlists.find(
      (p) => p.name.toLowerCase() === playlistName.toLowerCase()
    );

    if (!playlist) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`<:cross:1433807192003444848> | Playlist **${playlistName}** not found.`),
        ],
      });
    }

    // ✅ Generate Share ID and Verification Code
    const shareId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const verificationCode = generateRandomCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // 🗄️ Save to shared playlist database
    await SharedPlaylist.create({
      shareId,
      verificationCode,
      playlist,
      expiresAt,
    });

    // 🎨 Build an aesthetic embed
    const embed = new EmbedBuilder()
      .setColor("#00B2FF")
      .setTitle("Playlist Move Request Created")
      .setThumbnail("https://images-ext-1.discordapp.net/external/nTL51zijUuHprGLkNJxurTnIsIk6QusSkIG2bZ4i9x0/%3Fformat%3Dwebp%26width%3D154%26height%3D154/https/images-ext-1.discordapp.net/external/AZH0LHaHdtQgiPGOcvJJlLBz1elGrFY92p2cqHNj-mg/%253Fformat%253Dwebp%2526width%253D205%2526height%253D205/https/images-ext-1.discordapp.net/external/VCKUxOH1ClbqPKETMazyfJztt1isFIoRxNxbbiwElRs/%25253Fsize%25253D256/https/cdn.discordapp.com/avatars/1390965840437968896/38840bc34bc8b63f483caa00895ac982.webp?format=webp&width=123&height=123")
      .setImage("https://media.discordapp.net/attachments/1392487471370997761/1433841399110828204/Profile_Banner.png?format=webp&quality=lossless&width=544&height=192")
      .setDescription(`
> *"Music has no boundaries, it travels with you wherever you go."*

Your playlist **${playlist.name}** is ready to be moved or shared to another server!

**Transfer Details:**
> **Move ID:** \`${shareId}\`
> **Verification Code:** \`${verificationCode}\`
> **Expires In:** 15 minutes

**How to Import it on another server:**
\`\`\`
.playlistimport ${shareId} ${verificationCode}
\`\`\`

This link is *one-time use only* and will auto-expire for safety.
`)
      .setFooter({
        text: `Requested by ${message.author.tag} • Playlist transfer ready`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
