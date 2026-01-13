const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  WebhookClient,
} = require("discord.js");
const mongoose = require("mongoose");
const { Riffy } = require("riffy");
const fs = require("fs");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const Topgg = require("@top-gg/sdk");
const { safeSendWebhook } = require("./util.js");

class MainClient extends Client {
  constructor() {
    super({
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: false,
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.config = require("../config/config");
    this.emoji = require("../config/emoji");
    this.color = this.config.color;
    this.invite = this.config.invite;
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cluster = new ClusterClient(this);
    this.topgg = new Topgg.Api(this.config.topgg_Api);
    this.error = new WebhookClient({ url: this.config.error_log });

    console.log("[DEBUG] Lavalink nodes configuration:", this.config.nodes);

    try {
      console.log("[DEBUG] Initializing Riffy...");

      this.manager = new Riffy(this, this.config.nodes, {
        // ✅ Safe send function (fixed for all Riffy/Lavalink versions)
        send: (packet) => {
          if (!packet) return;

          const guildId = packet.guild_id || (packet.d && packet.d.guild_id);
          if (!guildId) return;

          const guild = this.guilds.cache.get(guildId);
          if (guild && guild.shard) guild.shard.send(packet);
        },

        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",

        spotify: {
          clientId: this.config.spotiId,
          clientSecret: this.config.spotiSecret,
        },
      });

      console.log("[RIFFY] Manager initialized successfully");
    } catch (error) {
      console.error("[RIFFY] Error initializing:", error);
      console.error(error.stack);
      return;
    }

    // ✅ Riffy Node Events
    this.manager.on("nodeConnect", (node) => {
      console.log(`[RIFFY] Node ${node.name}: Connected successfully!`);
    });

    this.manager.on("nodeReady", (node) => {
      console.log(`[RIFFY] Node ${node.name}: Ready!`);
    });

    this.manager.on("nodeError", (node, error) => {
      console.error(`[RIFFY] Node ${node.name}: Error -`, error);
    });

    this.manager.on("nodeDisconnect", (node) => {
      console.log(`[RIFFY] Node ${node.name}: Disconnected!`);
    });

    this.manager.on("playerException", (player, error) => {
      console.error(`[RIFFY] Player ${player.guildId} exception:`, error);
    });

    console.log("[DEBUG] Riffy event listeners loaded");

    // ✅ Voice state updates for Riffy
    this.on("raw", (data) => {
      if (["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(data.t)) {
        this.manager.updateVoiceState(data);
      }
    });

    // ✅ Error Handling
    this.on("error", (error) => {
      console.error("[CLIENT_ERROR]", error);
      if (error.message && !error.message.includes("ChannelNotCached")) {
        safeSendWebhook(this.error, `\`\`\`js\n${error.stack}\`\`\``);
      }
    });

    process.on("unhandledRejection", (error) => {
      console.error("[UNHANDLED_REJECTION]", error);

      if (
        error.message &&
        (error.message.includes("Player is already destroyed") ||
          error.message.includes("ChannelNotCached") ||
          error.message.includes("Unknown Webhook"))
      ) {
        console.log("[INFO] Known error handled:", error.message);
      } else {
        safeSendWebhook(this.error, `\`\`\`js\n${error.stack}\`\`\``);
      }
    });

    process.on("uncaughtException", (error) => {
      console.error("[UNCAUGHT_EXCEPTION]", error);
      safeSendWebhook(this.error, `\`\`\`js\n${error.stack}\`\`\``);
    });

    // ✅ Load handlers dynamically
    ["aliases", "mcommands"].forEach((x) => (this[x] = new Collection()));
    ["command", "player", "node"].forEach((x) =>
      require(`../handlers/${x}`)(this)
    );
  }

  // 🔍 Node management helpers
  getAvailableNodes() {
    if (!this.manager || !this.manager.nodes) return [];

    const availableNodes = [];
    for (const nodeConfig of this.manager.nodes) {
      if (this.manager.nodeMap?.has(nodeConfig.name)) {
        const node = this.manager.nodeMap.get(nodeConfig.name);
        if (node?.connected) {
          availableNodes.push({ name: nodeConfig.name, node });
        }
      }
    }

    return availableNodes;
  }

  hasAvailableNodes() {
    return this.getAvailableNodes().length > 0;
  }

  // 🧹 Safe destroy for music players
  async destroyPlayerSafely(guildId) {
    try {
      const player = this.manager.players.get(guildId);
      if (player && !player.destroyed) {
        await player.destroy();
      }
    } catch (error) {
      if (
        !error.message ||
        !error.message.includes("Player is already destroyed")
      ) {
        console.error("[PLAYER DESTROY ERROR]", error);
      }
    }
  }

  // 💾 MongoDB Connection
  async ConnectMongo() {
    console.log("[ TRYING ] Connecting to MongoDB...");
    mongoose.set("strictQuery", true);

    const mongoURI =
      this.config.Mongo ||
      "mongodb://lunexa:op@node3.nexcloud.xyz:2000/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.8";

    const connectWithRetry = () => {
      mongoose
        .connect(mongoURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 30000,
          maxPoolSize: 10,
          heartbeatFrequencyMS: 10000,
        })
        .then(() => console.log("[ CONNECTED ] MongoDB connected."))
        .catch((error) => {
          console.error("MongoDB connection failed, retrying in 5s...", error);
          setTimeout(connectWithRetry, 5000);
        });
    };

    connectWithRetry();
  }

  // 🧩 Event loader
  async loadEvents() {
    fs.readdirSync("./src/events/").forEach((file) => {
      const eventName = file.split(".")[0];
      require(`${process.cwd()}/src/events/${file}`)(this);
      console.log(`[ LOADED ] ${eventName}.js event`);
    });
  }

  // 🔄 Command hot reload
  async reloadCommand(commandName) {
    const folders = fs.readdirSync("./src/commands");
    for (const folder of folders) {
      const filePath = `./src/commands/${folder}/${commandName}.js`;
      if (fs.existsSync(filePath)) {
        try {
          delete require.cache[require.resolve(filePath)];
          const newCommand = require(filePath);
          this.commands.set(newCommand.name, newCommand);
          return { success: true, name: newCommand.name };
        } catch (err) {
          return { success: false, error: err };
        }
      }
    }
    return { success: false, error: new Error("Command not found") };
  }

  connect() {
    return super.login(this.config.token);
  }
}

module.exports = MainClient;
