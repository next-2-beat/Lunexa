const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/playlist.js");
const SharedPlaylist = require("../../models/sharedPlaylist.js");

module.exports = {
  name: "playlistimport",
  description: "Import a shared playlist using ID and verification code",
  async execute(client, message, args) {
    const [shareId, verificationCode] = args;
    if (!shareId || !verificationCode)
      return message.reply("Usage: `.playlistimport <id> <verificationCode>`");

    const shared = await SharedPlaylist.findOne({ shareId });
    if (!shared)
      return message.reply("Invalid or expired playlist ID.");

    // Check expiration
    if (shared.expiresAt < new Date()) {
      await SharedPlaylist.deleteOne({ shareId });
      return message.reply("This playlist share has expired.");
    }

    // Check verification code
    if (shared.verificationCode !== verificationCode.toUpperCase())
      return message.reply("Invalid verification code.");

    const playlistData = shared.playlist;
    if (!playlistData)
      return message.reply("Playlist data not found.");

    // Fetch or create guild data
    let guildData = await Playlist.findOne({ guildId: message.guild.id });
    if (!guildData) guildData = new Playlist({ guildId: message.guild.id, playlists: [] });

    // Prevent overwriting existing playlist
    const exists = guildData.playlists.find(
      (p) => p.name.toLowerCase() === playlistData.name.toLowerCase()
    );
    if (exists)
      return message.reply(`A playlist named **${playlistData.name}** already exists.`);

    // Add playlist
    guildData.playlists.push({
      name: playlistData.name,
      songs: playlistData.songs || [],
    });

    await guildData.save();
    await SharedPlaylist.deleteOne({ shareId }); // delete after use

    const embed = new EmbedBuilder()
      .setColor("#2ECC71")
      .setTitle("Playlist Imported Successfully!")
      .setDescription(`
**${playlistData.name}** has been imported successfully!

> *Imported ${playlistData.songs.length} song(s)*  
> You can now view it with: \`.listsongs ${playlistData.name}\`
`)
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
