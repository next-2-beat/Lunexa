const { ClusterManager, HeartbeatManager } = require("discord-hybrid-sharding");
const { token } = require("./config/config.js");

const manager = new ClusterManager(`${__dirname}/index.js`, {
    totalShards: 2,
    shardsPerClusters: 2,
    mode: "process",
    token: token,
});

manager.extend(
    new HeartbeatManager({
        interval: 2000,
        maxMissedHeartbeats: 5,
    })
);

manager.on("debug", console.log);
manager.spawn({ timeout: -1 });
