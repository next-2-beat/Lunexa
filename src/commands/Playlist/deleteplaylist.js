const manager = require("../../utils/playlistManager");

module.exports = {
  name: "deleteplaylist",
  description: "Delete a playlist from this server",
  async execute(client, message, args) {
    const name = args.join(" ");
    if (!name) return message.reply("Please specify a playlist name.");

    const success = await manager.deletePlaylist(message.guild.id, name);
    if (!success) return message.reply("Playlist not found.");

    message.reply(`Deleted playlist **${name}** successfully.`);
  }
};
