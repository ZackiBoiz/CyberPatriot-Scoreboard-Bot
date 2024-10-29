const { EmbedBuilder, ButtonBuilder } = require("discord.js");
const wait = ms => new Promise(res => setTimeout(res, ms));

const ActivityTypes = {
  "PLAYING": 0,
  "PLAY": 0,
  "GAME": 0,
  "STREAMING": 1,
  "STREAM": 1,
  "LIVE": 1,
  "LISTENING": 2,
  "LISTENING_TO": 2,
  "LISTEN": 2,
  "MUSIC": 2,
  "WATCHING": 3,
  "WATCH": 3,
  "VIDEO": 3,
  "CUSTOM": 4,
  "COMPETING": 5,
  "COMPETING_IN": 5,
  "COMPETE": 5,
  "TOURNAMENT": 5,
  "TOURNEY": 5,
  "HANG": 6,
  "HANGING": 6,
  "HANG_STATUS": 6,
  "VC": 6,
};

const OptionTypes = {
  "SUB_COMMAND": 1,
  "SUB_CMD": 1,
  "SUB_COMMAND_GROUP": 2,
  "SUB_CMD_GROUP": 2,
  "STRING": 3,
  "STR": 3,
  "INTEGER": 4,
  "INT": 4,
  "BOOLEAN": 5,
  "BOOL": 5,
  "USER": 6,
  "CHANNEL": 7,
  "ROLE": 8,
  "MENTIONABLE": 9,
  "NUMBER": 10,
  "DOUBLE": 10,
  "ATTACHMENT": 11,
  "FILE": 11
};

const CommandTypes = {
  "COMMAND": 1,
  "SLASH": 1,
  "USER": 2,
  "MESSAGE": 3
};

const ModalInputTypes = {
  "SHORT": 1,
  "LINE": 1,
  "INPUT": 1,
  "PARAGRAPH": 2,
  "BIG": 2,
  "TEXTAREA": 2
}

const ButtonTypes = {
  "PRIMARY": 1,
  "BLURPLE": 1,
  "SECONDARY": 2,
  "GRAY": 2,
  "GREY": 2,
  "SUCCESS": 3,
  "GREEN": 3,
  "DANGER": 4,
  "DESTRUCTIVE": 4,
  "DESTRUCT": 4,
  "RED": 4,
  "LINK": 5,
  "URL": 5
};

const ChannelTypes = {
  "TEXT": 0,
  "TXT": 0,
  "DM": 1,
  "USER": 1,
  "VOICE": 2,
  "VC": 2,
  "GROUP_DM": 3,
  "GROUP": 3,
  "GC": 3,
  "CATEGORY": 4,
  "ANNOUNCEMENT": 5,
  "ANNOUNCEMENT_THREAD": 10,
  "PUBLIC_THREAD": 11,
  "PRIVATE_THREAD": 12,
  "STAGE": 13,
  "DIRECTORY": 14,
  "FORUM": 15
};

const ChannelGroups = {
  "TALK": [ChannelTypes.TEXT, ChannelTypes.VOICE, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD],
  "CHAT": [ChannelTypes.TEXT, ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD],
  "POST": [ChannelTypes.FORUM, ChannelTypes.ANNOUNCEMENT],
  "VOICE": [ChannelTypes.VOICE, ChannelTypes.STAGE],
  "THREAD": [ChannelTypes.PUBLIC_THREAD, ChannelTypes.PRIVATE_THREAD],
  "PRIVATE": [ChannelTypes.DM, ChannelTypes.GC]
};

const EmojiIcons = {
  "refresh": "<:refresh:1102755750658461756>",
  "x": "<:close:1102756140921671681>",
  "question": "<:question:1104647783115399238>",
  "info": "<:info:1104648106265563187>",
  "check": "<:check:1104824511049769010>",
  "exclamation": "<:exclamation:1104649797056598147>",
  "trash": "<:trash:1104854267656937473>",

  "pencil": "<:pencil:1104649238161395722>",
  "cone": "<:cone:1104654603213099050>",
  "radioactive": "<:radioactive:1104853087891493024>",
  "flask": "<:flask:1104825256125927596>",
  "diamond": "<:diamond:1104648949354213476>",

  "flag": "<:flag:1104651582286614538>",
  "handshake": "<:handshake:1104651873274843176>",
  "chessboard_small": "<:chessboard_small:1104653160775168110>",
  "chessboard_large": "<:chessboard_large:1104667035889319956>",

  "left": "<:left:1102756330789417030>",
  "right": "<:right:1102756492001673227>",
  "all_left": "<:all_left:1104558114704982036>",
  "all_right": "<:all_right:1104558116290428979>",

  "typing": "<a:typing:1104840464907116565>",
}


const GeneralFunctions = {
  getUnix() {
    return Math.round(Date.parse(new Date()) / 1000);
  },
  getMs() {
    return Date.now();
  },
  async disableEmbed(embed, row, disableMsg = "Expired.") {
    embed.setTitle(disableMsg)
    row.components.forEach(btn => {
      btn.setDisabled(true);
    });

    return [embed, row];
  },
  generateRefresh(interaction, cmd, btn_name, options = null, enabled = true) {
    var btn = new ButtonBuilder()
      .setCustomId(`${cmd}@_${btn_name.replace(/_/g, "|")}_${interaction.user.id}_${options}`)
      .setEmoji(EmojiIcons[btn_name])
      .setStyle(ButtonTypes.GRAY)
      .setDisabled(!enabled)
    // console.log(EmojiIcons[btn_name]);
    return btn;
  },
  async generateAlert(interaction, msg, emoji_name = "exclamation") {
    var embed = new EmbedBuilder()
      .setColor(process.env.NO_COLOR)
      .setDescription(emoji_name ? `${EmojiIcons[emoji_name]} ${msg}` : `${msg}`)
      .setTimestamp()
      .setFooter({ text: `Ran by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return embed;
  },
  async sendConstruction(interaction) {
    var embed = await GeneralFunctions.generateAlert(interaction, "This command is under construction. Please check back later.", "cone");

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
  async sendCooldown(interaction, cooldown) {
    var embed = await GeneralFunctions.generateAlert(interaction, `Please wait! You are on cooldown.\n\nYou can use this command again <t:${cooldown.timestamp + Cooldowns[cooldown.command_name] / 1000}:R>`, "x");
    await interaction.followUp({embeds: [embed]});
  },
  rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  intToNotation(int, digits = 2) {
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "K" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "B" },
      { value: 1e12, symbol: "T" },
      { value: 1e15, symbol: "Qa" },
      { value: 1e18, symbol: "Qi" },
      { value: 1e21, symbol: "Sx" },
      { value: 1e24, symbol: "Sp" },
      { value: 1e27, symbol: "Oc" },
      { value: 1e30, symbol: "No" },
      { value: 1e33, symbol: "De" },
      { value: 1e36, symbol: "???" }
    ];

    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function(item) {
      return int >= item.value;
    });

    return item ? (int / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
  },
  notationToInt(num) {
    var notation = num.match(/[A-Z]+/i); // match string of letters
    if (notation) {
      notation = notation[0];
    } else {
      notation = "-/-";
    }
    var int = Number(num.replace(notation, ""));
    // console.log(notation, int);
    if (isNaN(int)) {
      return false;
    } else {
      switch (notation) {
        case "-/-": {
          return int;
          break;
        }
        case "k": {
          return int * 1e3;
          break;
        }
        case "m": {
          return int * 1e6;
          break;
        }
        case "b": {
          return int * 1e9;
          break;
        }
        case "t": {
          return int * 1e12;
          break;
        }
        case "qa": {
          return int * 1e15;
          break;
        }
        case "qi": {
          return int * 1e18;
          break;
        }
        case "sx": {
          return int * 1e21;
          break;
        }
        case "sp": {
          return int * 1e24;
          break;
        }
        case "oc": case "o": {
          return int * 1e27;
          break;
        }
        case "no": case "n": {
          return int * 1e30;
          break;
        }
        case "de": case "d": {
          return int * 1e33;
          break;
        }
        default: {
          return false;
          break;
        }
      }
    }
  },
  // Modified from https://github.com/mike182uk/timestring/blob/main/index.js
  timeToFormat(value) {
    const DEFAULT_OPTS = {
      hoursPerDay: 24,
      daysPerWeek: 7,
      weeksPerMonth: 4,
      monthsPerYear: 12,
      daysPerYear: 365.25
    };
    const UNIT_MAP = {
      ms: ["ms", "milli", "millis", "millisecond", "milliseconds"],
      s: ["s", "sec", "secs", "second", "seconds"],
      m: ["m", "min", "mins", "minute", "minutes"],
      h: ["h", "hs", "hr", "hrs", "hour", "hours"],
      d: ["d", "ds", "day", "days"],
      w: ["w", "ws", "wk", "wks", "week", "weeks"],
      mth: ["mo", "mon", "mons", "mth", "mths", "month", "months"],
      y: ["y", "yr", "ys", "yo", "yrs", "year", "years"]
    };

    var opts = Object.assign({}, DEFAULT_OPTS, {});

    if (typeof value === "number" || value?.match(/^[-+]?[0-9.]+$/g)) {
      value = parseInt(value) + "ms";
    }

    let totalSeconds = 0;
    let formats = {};

    const unitValues = {
      ms: 0.001,
      s: 1,
      m: 60,
      h: 3600
    };

    unitValues.d = opts.hoursPerDay * unitValues.h;
    unitValues.w = opts.daysPerWeek * unitValues.d;
    unitValues.mth = (opts.daysPerYear / opts.monthsPerYear) * unitValues.d;
    unitValues.y = opts.daysPerYear * unitValues.d;

    const groups = value?.toLowerCase().replace(/[^.\w+-]+/g, "").match(/[-+]?[0-9.]+[a-z]+/g);

    if (!groups) {
      return null;
    }

    groups.forEach(group => {
      const value = group.match(/[0-9.]+/g)[0];
      const unit = group.match(/[a-z]+/g)[0];
      var key;

      for (const unit_key of Object.keys(UNIT_MAP)) {
        if (UNIT_MAP[unit_key].indexOf(unit) > -1) {
          key = unit_key;
        }
      }

      if (!key) {
        return null;
      }

      totalSeconds += value * unitValues[key];

      if (!formats[key]) {
        formats[key] = 0;
      }
      formats[key] += parseInt(value);
    });

    var time = totalSeconds;

    var formatted = "";
    var shorthand = "";

    var ms = Math.floor(totalSeconds * 1000);
    var s = Math.floor(totalSeconds);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    var d = Math.floor(h / 24);
    var w = Math.floor(d / 7);
    var mo = Math.floor(d / 30);
    var y = Math.floor(d / 365);

    ms %= 1000;
    s %= 60;
    m %= 60;
    h %= 24;
    d %= 7;
    w %= 4.348214;
    mo %= 12;

    if (w) {
      formatted += `${w} weeks `;
      shorthand += `${w}w `;
    }
    if (d) {
      formatted += `${d} days `;
      shorthand += `${d}d `;
    }
    if (h) {
      formatted += `${h} hours `;
      shorthand += `${h}h `;
    }
    if (m) {
      formatted += `${m} minutes `;
      shorthand += `${m}m `;
    }
    if (s) {
      formatted += `${s} seconds `;
      shorthand += `${s}s `;
    }
    if (ms) {
      formatted += `${ms} milliseconds `;
      shorthand += `${ms}ms `;
    }

    formatted = formatted.trim();
    var keys = { ms, s, m, h, d, w };

    return { time, keys, formatted, shorthand };
  },
  generateUID(n) {
    var timestamp = Date.now();
    var time_id = timestamp.toString(16);
    var rand_id = Math.trunc(Math.random() * timestamp).toString(16);
    var uid = time_id + rand_id;
    return uid.substring(0, n);
  },
  xpFormula(level) {
    return Math.round(25 * (level ** 2) - (25 * (level - 1)));
  },
  toFormat(int) {
    return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
}

const CommandFolders = {
  "ping": {
    dir: "cmds",
    type: "util",
    name: "ping"
  },

  "scoreboard": {
    dir: "cmds",
    type: "scoreboard",
    name: "scoreboard"
  },
  "lookup": {
    dir: "cmds",
    type: "scoreboard",
    name: "lookup"
  },
  "stats": {
    dir: "cmds",
    type: "scoreboard",
    name: "stats"
  }
};

const Cooldowns = {
  "scoreboard": 15000,
  "lookup": 10000,
  "stats": 10000
};

module.exports = { ActivityTypes, OptionTypes, CommandTypes, ButtonTypes, ModalInputTypes, ChannelTypes, ChannelGroups, EmojiIcons, CommandFolders, Cooldowns, GeneralFunctions };