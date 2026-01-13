const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "npreq",
    aliases: ["noprefixrequirements","nopreq"],
    description: "Advertise premium features of the bot",
    category: "Information",
    ownerOnly: false, // Anyone can run this command to learn about premium
    run: async (client, message, args, prefix) => {
        try {
            const embed = new EmbedBuilder()
                .setTitle("Unlock NoPrefix Now")
                .setColor(client.color)
                .setDescription("Access to All Commands Without Prefix")
                .addFields(
                    { name: "1. Boost Support Server", value: "- You can get NoPrefix by Boosting our [Support Server!](https://discord.gg/eMnU7MQ2Zm)" },
                    { name: "2. Add In Servers", value: "- Get noprefix in 5servers and get the noprefix for 15days." },
                    { name: "3. Buying NoPrefix", value: "- The Buy System Is only for 1year noprefix price - ₹499 only." },
                     {name: "4. Staff Apply", value: "- The user can be a staff of the Lunexa then get the noprefix for no any restrictions just apply or dm the developer for that."}
                )
                .setFooter({ text: "These NoPrefix Requirements Can be changed according to our needs!" })
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.channel.send("An error occurred while showing premium features.");
        }
    }
};