const manager = require("../../utils/playlistManager");

module.exports = {
  name: "createplaylist",
  description: "Create a new playlist for this server",
  async execute(client, message, args) {
    const name = args.join(" ");
    if (!name) return message.reply("Please provide a playlist name.");

    const success = await manager.createPlaylist(message.guild.id, name);
    if (!success)
      return message.reply("A playlist with that name already exists!");

    message.reply(`Playlist **${name}** created for this server!`);
  }
};
