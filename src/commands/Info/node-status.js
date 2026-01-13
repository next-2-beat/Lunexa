const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "nodestatus",
  aliases: ["ns", "nodes"],
  description: "Check the status of Lavalink nodes",
  category: "Info",
  premium: false,
  run: async (client, message, args) => {
    // Helper function to format duration nicely
    const formatDuration = (ms) => {
      if (!ms) return '0s';
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      
      const parts = [];
      if (d > 0) parts.push(`${d}d`);
      if (h % 24 > 0) parts.push(`${h % 24}h`);
      if (m % 60 > 0) parts.push(`${m % 60}m`);
      if (s % 60 > 0) parts.push(`${s % 60}s`);
      
      return parts.join(' ');
    };

    const nodeMap = client.manager?.nodeMap;
    let entries = [];

    if (nodeMap && nodeMap.size) {
      entries = Array.from(nodeMap.entries());
    } else if (Array.isArray(client.manager?.nodes)) {
      entries = client.manager.nodes.map((cfg, idx) => [cfg.name || cfg.id || `Node ${idx + 1}`, cfg]);
    }

    const embed = new EmbedBuilder()
      .setTitle("Lavalink Nodes")
      .setColor(client.config.color)
      .setTimestamp();

    let description = "";
    let connectedNodes = 0;
    let totalNodes = entries.length || 0;
    
    for (const [name, node] of entries) {
      const isInstance = Boolean(node?.connected !== undefined || node?.stats !== undefined);
      const isConnected = isInstance ? Boolean(node.connected) || Boolean(node.stats) : false;
      const stats = isInstance ? node.stats : null;

      // Add node status with emoji and clean format
      description += `**${name}** ${isConnected ? "<a:online:1433819842418577538>" : "<a:offline:1434408134893637773>"}\n`;

      if (isConnected && stats) {
        const playing = stats.playingPlayers || 0;
        const total = stats.players || 0;
        const uptime = formatDuration(stats.uptime);
        description += `┗ Players: ${playing}/${total} • Uptime: ${uptime}\n`;
        connectedNodes++;
      }

      description += "\n";
    }

    if (description === "") {
      description = "No nodes configured.";
    }

    embed.setDescription(description.trim());
    
    if (connectedNodes === 0 && totalNodes > 0) {
      embed.setFooter({ 
        text: `No nodes connected • Use /play to test connection`,
        iconURL: client.user.displayAvatarURL()
      });
    } else {
      embed.setFooter({ 
        text: `${connectedNodes}/${totalNodes} nodes online • Running smoothly`,
        iconURL: client.user.displayAvatarURL()
      });
    }
    
    return message.channel.send({ embeds: [embed] });
  },
};