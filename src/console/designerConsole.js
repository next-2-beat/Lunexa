const figlet = require("figlet");
const chalk = require("chalk");

let boxen;
try {
  boxen = require("boxen");
} catch (e) {
  boxen = null; // optional dependency - fallback if not installed
}

const colors = {
  CYAN: chalk.cyan,
  PURPLE: chalk.magenta,
  PINK: chalk.hex('#d685d6'),
  BLUE: chalk.blue,
  GREEN: chalk.green,
  YELLOW: chalk.keyword('yellow'),
  RED: chalk.red,
  WHITE: chalk.white,
  GRAY: chalk.gray,
  BOLD: chalk.bold,
  DIM: chalk.dim
};

function separator(width = 60) {
  const pieces = ['─','─','─'];
  return pieces.join('')?.repeat(Math.max(1, Math.floor(width / 3)));
}

function formatUptime() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function showDesignerConsole(client) {
  try {
    const cols = process.stdout.columns || 80;

    const title = figlet.textSync(client.user?.username || 'Bot', { horizontalLayout: 'default' });

    const guildCount = client.guilds?.cache?.size ?? 'N/A';
    const shardCount = client.shard?.count ?? 1;
    const nodeCount = (typeof client.getAvailableNodes === 'function') ? (client.getAvailableNodes()?.length || 0) : (client.manager?.nodes?.length || 0);

    const lines = [];
    lines.push(colors.CYAN(title));
    lines.push('');
    lines.push(colors.BOLD(colors.PURPLE(`  ♪ ${client.user?.username || 'Bot'} Music ♪  `)) + colors.DIM(colors.WHITE(` (${client.user?.tag || client.user?.id || ''})`)));
    lines.push('');
    lines.push(colors.DIM(colors.WHITE('  High-Quality • Fast • Reliable')));
    lines.push(colors.GREEN(`  Guilds: ${guildCount}`));
    lines.push(colors.GREEN(`  Shards: ${shardCount}`));
    lines.push(colors.PURPLE(`  Lavalink Nodes: ${nodeCount}`));
    lines.push(colors.BLUE(`  NodeJS: ${process.version}    Platform: ${process.platform}`));
    lines.push(colors.GRAY(`  Ready at: ${new Date().toLocaleString()}`));

    let output = lines.join('\n');

    if (boxen) {
      output = boxen(output, { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' });
      console.log(output);
    } else {
      const sep = separator(Math.min(cols, 60));
      console.log(colors.CYAN(sep));
      output.split('\n').forEach(l => console.log(l));
      console.log(colors.CYAN(sep));
    }

  } catch (err) {
    console.error(chalk.red('[DESIGNER] Failed to render console:'), err);
  }
}

// Helper: print small event lines in designer style
function eventLine(label, msg, colorFn = colors.WHITE) {
  try {
    const time = new Date().toLocaleTimeString();
    const line = `${colorFn(`[${label}]`)} ${colors.DIM(`(${time})`)} ${msg}`;
    if (boxen) {
      console.log(boxen(line, { padding: 0, margin: 0, borderStyle: 'single', borderColor: 'gray' }));
    } else {
      console.log(line);
    }
  } catch (e) {
    console.log(`[${label}] ${msg}`);
  }
}

// Attach event helpers to the exported function so other modules can call them
showDesignerConsole.nodeConnect = (node) => {
  eventLine('LAVALINK', `${colors.GREEN(`${node.name} connected`)}`, colors.CYAN);
};

showDesignerConsole.nodeReady = (node) => {
  eventLine('LAVALINK', `${colors.PURPLE(`${node.name} ready`)}`, colors.CYAN);
};

showDesignerConsole.nodeDisconnect = (node) => {
  eventLine('LAVALINK', `${colors.YELLOW(`${node.name} disconnected`)}`, colors.CYAN);
};

showDesignerConsole.nodeError = (node, error) => {
  eventLine('LAVALINK-ERROR', `${colors.RED(`${node.name}: ${error?.message || error}`)}`, colors.RED);
};

showDesignerConsole.playerCreate = (player) => {
  eventLine('PLAYER', `Player created for guild ${player.guildId}`, colors.GREEN);
};

showDesignerConsole.playerDestroy = (player) => {
  eventLine('PLAYER', `Player destroyed for guild ${player.guildId}`, colors.YELLOW);
};

showDesignerConsole.info = (msg) => {
  eventLine('INFO', msg, colors.BLUE);
};

showDesignerConsole.success = (msg) => {
  eventLine('SUCCESS', msg, colors.GREEN);
};

showDesignerConsole.error = (msg) => {
  eventLine('ERROR', msg, colors.RED);
};

// Print a prominent boxed block for a stage (title + array of lines or single string)
showDesignerConsole.showBlock = (title, content, borderColor = 'cyan') => {
  try {
    const body = Array.isArray(content) ? content.join('\n') : String(content);
    const header = colors.BOLD(colors.CYAN(` ${title} `));
    const text = `${header}\n\n${body}`;
    if (boxen) {
      console.log(boxen(text, { padding: 1, margin: 1, borderStyle: 'round', borderColor }));
    } else {
      const cols = process.stdout.columns || 80;
      const sep = separator(Math.min(cols, 60));
      console.log(colors.CYAN(sep));
      text.split('\n').forEach((l) => console.log(l));
      console.log(colors.CYAN(sep));
    }
  } catch (e) {
    console.log(`[${title}] ${content}`);
  }
};

// Show a compact stage block with a status icon (success/warn/error/pending)
showDesignerConsole.showStage = (title, status = 'info', details = [], options = {}) => {
  try {
    const iconMap = {
      success: 'ㅤ',
      error: 'ㅤ',
      warn: 'ㅤ',
      info: 'ㅤ',
      pending: 'ㅤ',
    };
    const colorMap = {
      success: colors.GREEN,
      error: colors.RED,
      warn: colors.YELLOW,
      info: colors.CYAN,
      pending: colors.BLUE,
    };

    const colorFn = colorMap[status] || colorMap.info;

    const time = new Date().toLocaleTimeString();
    const header = `${colorFn.bold(`${title} `)} ${colors.DIM(`(${time})`)}\n`;

    const body = Array.isArray(details) ? details.join('\n') : String(details || '');
    const text = `${header}\n${body}`.trim();

    if (boxen) {
      console.log(boxen(text, { padding: 1, margin: 1, borderStyle: 'round', borderColor: options.borderColor || 'cyan' }));
    } else {
      const cols = process.stdout.columns || 80;
      const sep = separator(Math.min(cols, 60));
      console.log(colorFn(sep));
      text.split('\n').forEach((l) => console.log(l));
      console.log(colorFn(sep));
    }
  } catch (e) {
    console.log(`[${title}] ${details}`);
  }
};

module.exports = showDesignerConsole;
