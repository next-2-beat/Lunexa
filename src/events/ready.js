const { white, green, red } = require("chalk");
const showDesignerConsole = require("../console/designerConsole");
const { ActivityType } = require("discord.js");
const reconnectAuto = require("../models/reconnect.js");
const wait = require("wait");
const { AutoPoster } = require("topgg-autoposter");

module.exports = async (client) => {
  client.on("ready", async () => {
    
    // Designer: bot started block
    try {
      showDesignerConsole.showStage(
        'BOT',
        'info',
        [
          `User: ${client.user.username} (${client.user.id})`,
          `Shard: ${client.shard?.count || 1}`,
          `NodeJS: ${process.version}`,
        ]
      );
    } catch (e) {}
    // Initialize TopGG AutoPoster
    try {
      if (client.config.topgg_Api) {
        const poster = AutoPoster(client.config.topgg_Api, client);
        poster.on("posted", (stats) => {
          console.log(`${green("[TOPGG]")} Posted stats | Servers: ${stats.serverCount}`);
        });
      } else {
        console.log(`${red("[WARN]")} Top.gg API key not provided. Skipping AutoPoster.`);
      }
    } catch (error) {
      console.log(`${red("[ERROR]")} Top.gg autoposter failed:`, error);
    }

    // Initialize Riffy nodes
    console.log(`${green("[LAVALINK]")} Initializing Riffy nodes...`);
    try {
      showDesignerConsole.showStage('LAVALINK', 'pending', 'Initializing Riffy nodes...');
    } catch (e) {}
    try {
      if (client.manager && client.manager.init) {
        client.manager.init(client.user.id);
        console.log(`${green("[LAVALINK]")} Riffy init called with user ID: ${client.user.id}`);
      } else {
        console.log(`${red("[LAVALINK]")} Manager or init method not available`);
      }
    } catch (error) {
      console.error(`${red("[LAVALINK]")} Error initializing Riffy:`, error);
    }

    // Wait for Lavalink nodes to connect
    console.log(`${green("[LAVALINK]")} Waiting for nodes to connect...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Show Lavalink connection status using the new method
    console.log(`${green("[LAVALINK]")} Node Status:`);
    const availableNodes = client.getAvailableNodes();
    const totalNodes = client.manager.nodes.length;
    try {
      const lines = [
        `Configured nodes: ${totalNodes}`,
        `Connected nodes: ${availableNodes.length}`,
      ];
      showDesignerConsole.showStage('LAVALINK STATUS', availableNodes.length > 0 ? 'success' : 'warn', lines);
    } catch (e) {}
    
    if (availableNodes.length === 0 && totalNodes > 0) {
      console.log(`${red("[LAVALINK]")} WARNING: No Lavalink nodes are currently connected! Music commands may not work.`);
      // Even if status shows offline, note that nodes might still work
      console.log(`${green("[LAVALINK]")} NOTE: Nodes may still be functional despite status. Try music commands to test.`);
    } else if (availableNodes.length > 0) {
      console.log(`${green("[LAVALINK]")} ${availableNodes.length} node(s) connected successfully.`);
      // Log details of available nodes
    } else {
      console.log(`${red("[LAVALINK]")} No nodes configured.`);
    }

    // Auto reconnect queue system
    await wait(15000);
    let maindata;
    try {
      maindata = await reconnectAuto.find();
    } catch (err) {
      console.error(`${red("[ERROR]")} Failed to load reconnect data:`, err);
      maindata = [];
    }

    console.log(
      `${green("[RECONNECT]")} Found ${maindata.length} reconnect queue(s). Resuming...`
    );

    try {
      showDesignerConsole.showStage('RECONNECT', maindata.length > 0 ? 'pending' : 'info', `Found ${maindata.length} reconnect queue(s). Resuming...`);
    } catch (e) {}

    const resumedGuilds = [];
    const failedGuilds = [];

    for (const data of maindata) {
      try {
        // Check if Lavalink nodes are available before trying to reconnect
        if (!client.hasAvailableNodes()) {
          console.log(`${red("[RECONNECT]")} Skipping guild ${data.GuildId} - No Lavalink nodes available`);
          continue;
        }
        
        const text = await client.channels.fetch(data.TextId).catch(() => null);
        const guild = await client.guilds.fetch(data.GuildId).catch(() => null);
        const voice = await client.channels.fetch(data.VoiceId).catch(() => null);
        if (!guild || !text || !voice) continue;

        const node = client.manager.nodeMap?.values().next().value;
        if (!node) {
          console.log(`[RECONNECT] Skipping guild ${guild.id} - No Lavalink nodes available`);
          continue;
        }

        const player = client.manager.createConnection({
          guildId: guild.id,
          textChannel: text.id,
          voiceChannel: voice.id,
          volume: 100,
          deaf: true,
        });

        console.log(`${green("[JOINED]")} ${guild.name}`);
        resumedGuilds.push(`${guild.name} (${guild.id})`);
      } catch (error) {
        console.error(`${red("[FAILED]")} Guild ${data.GuildId}: ${error.message}`);
        failedGuilds.push(`${data.GuildId}: ${error.message}`);
      }
    }

    // Show summary block for reconnects
    try {
      const details = [];
      if (resumedGuilds.length) details.push(`Resumed (${resumedGuilds.length}):`, ...resumedGuilds.slice(0, 25));
      if (failedGuilds.length) details.push(`Failed (${failedGuilds.length}):`, ...failedGuilds.slice(0, 25));
      if (details.length === 0) details.push('No reconnects performed.');
      showDesignerConsole.showStage('RECONNECT SUMMARY', failedGuilds.length === 0 ? 'success' : 'warn', details);
    } catch (e) {}

    console.log(
      `${green("[INFO]")} ${client.user.username} (${client.user.id}) is fully Ready!`
    );

    // Show the designer console (stylized startup info)
    try {
      showDesignerConsole(client);
    } catch (err) {
      console.error(`${red("[DESIGNER]")} Failed to show designer console:`, err);
    }

    // Presence Rotation System
    const activities = [
      { name: ".help | NexCloud", type: ActivityType.Listening },
      { name: "!! ᴀʙʜɪ", type: ActivityType.Listening },
    ];

    const statuses = ["dnd", "dnd"];
    let activityIndex = 0;
    let statusIndex = 0;

    setInterval(async () => {
      try {
        await client.user.setPresence({
          activities: [activities[activityIndex]],
          status: statuses[statusIndex],
        });

        activityIndex = (activityIndex + 1) % activities.length;
        statusIndex = (statusIndex + 1) % statuses.length;
      } catch (err) {
        console.error(`${red("[Presence Error]")}`, err);
      }
    }, 10000);
  });
};