const { readdirSync, statSync } = require("fs");
const { Collection } = require("discord.js");
const path = require("path");

module.exports = {
  name: "reload",
  aliases: ["rd-cmd","reload-commands","rd-commands","rdc"],
  description: "Reloads all prefix commands (Bot Owner Only)",
  category: "Owner",
  ownerOnly: true,
  run: async (client, message) => {
    try {
      // agar define nahi hai to naya set kar do
      if (!client.mcommands) client.mcommands = new Collection();
      if (!client.aliases) client.aliases = new Collection();
      if (!client.cooldowns) client.cooldowns = new Collection();

      // clear karna
      client.mcommands.clear();
      client.aliases.clear();
      client.cooldowns.clear();

      let loadedPrefixCommands = 0;
      const prefixCommandBasePath = path.join(__dirname, ".."); // src/commands

      // folders filter karo
      let prefixCommandFolders = [];
      try {
        prefixCommandFolders = readdirSync(prefixCommandBasePath).filter((name) =>
          statSync(path.join(prefixCommandBasePath, name)).isDirectory()
        );
      } catch {
        prefixCommandFolders = [];
      }

      const errors = [];

      for (const folder of prefixCommandFolders) {
        const folderPath = path.join(prefixCommandBasePath, folder);
        const commandFiles = readdirSync(folderPath).filter((f) => f.endsWith(".js"));

        for (const file of commandFiles) {
          try {
            const filePath = path.join(folderPath, file);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (!command?.name || typeof command.name !== "string") continue;
            if (!command.run && !command.execute) continue;

            client.mcommands.set(command.name, command);
            loadedPrefixCommands++;

            if (Array.isArray(command.aliases)) {
              for (const alias of command.aliases) client.aliases.set(alias, command.name);
            }

            if (command.cooldown && !client.cooldowns.has(command.name)) {
              client.cooldowns.set(command.name, new Collection());
            }
          } catch (err) {
            errors.push(`Failed to load ${folder}/${file}: ${err?.stack || err}`);
          }
        }
      }

      if (errors.length) {
        await message.reply(
          `Reloaded ${loadedPrefixCommands} prefix commands with some errors:\n` +
          "```js\n" + errors.join("\n") + "\n```"
        );
      } else {
        await message.reply(`Successfully reloaded ${loadedPrefixCommands} prefix commands!`);
      }
    } catch (error) {
      await message.reply(
        "Failed to reload commands.\n" +
        "```js\n" + (error?.stack || error?.message || String(error)) + "\n```"
      );
    }
  },
};
