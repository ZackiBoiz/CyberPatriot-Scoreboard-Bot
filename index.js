Math.rand = (min, max, floor = true) => {
  var rand = (Math.random() * (max - min)) + min;
  return floor ? Math.floor(rand) : rand;
};

const { Client, DefaultWebSocketManagerOptions, Events, GatewayIntentBits, Partials, SlashCommandBuilder, TextChannel, Collection, Intents, PermissionsBitField, AuditLogEvent, EmbedBuilder } = require("discord.js");
const { CommandFolders, ActivityTypes, GeneralFunctions, ChannelTypes, ChannelGroups, Cooldowns, EmojiIcons } = require("./discord.helpers.js");
const { REST } = require("@discordjs/rest");
const fs = require("fs");

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
const client = new Client({ // This is vital stuff
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User
  ],
  allowedMentions: {
    parse: ["users", "roles"], // remove @everyone for good reasons
    repliedUser: true
  },
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.MessageContent, // bruh don't forget this one
  ]
});
DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS"; // Show phone OS; Surprising this works

client.cooldowns = new Collection();
client.on("ready", async() => {
  client.options.failIfNotExists = false;
  let now = new Date();

  const { InitCmds } = require("./slashcmd.handler.js");
  await InitCmds(client, rest);
  console.log("Updated all commands successfully!");

  var guilds = client.guilds.cache.map(guild => guild.id);
  console.log(`Ready! Logged in as ${client.user.tag}`);
  console.log(`Current guilds: (${guilds.length})`);
  for (var id of guilds) {
    let guild = await client.guilds.fetch(id);
    console.log(`  ${id.toString().padEnd(20, " ")} -- ${guild.name}`);
  }

  client.user.setPresence({ 
    activities: [{ 
      name: "updates on scoreboard.uscyberpatriot.org.",
      type: ActivityTypes.LISTENING_TO
    }],
  });
});

function getExec(type, fname, interaction, client, refreshed = false) { // Get exec data
  return require(`./cmds/${type}/${fname}.js`).exec(interaction, client, refreshed); // MAKE SURE EXEC FUNCTION IS ASYNC!
}
function getAutocomplete(type, fname, interaction, client) {
  return require(`./cmds/${type}/${fname}.js`).autocomplete(interaction, client);
}
function getBtnEvent(type, fname, interaction, client, refreshed = false) {
  return require(`./cmds/${type}/${fname}.js`).btnEvent(interaction, client, refreshed);
}
function getMenuEvent(type, fname, interaction, client, refreshed = false) {
  return require(`./cmds/${type}/${fname}.js`).menuEvent(interaction, client, refreshed);
}
function getModalEvent(type, fname, interaction, client) {
  return require(`./cmds/${type}/${fname}.js`).modalEvent(interaction, client);
}

client.on("interactionCreate", async (interaction) => {
  if (interaction.user.bot) {
    return;
  }
  if (interaction.channel.type == ChannelTypes.DM || interaction.channel.type == ChannelTypes.GC) {
    var embed = await GeneralFunctions.generateAlert(interaction, "Commands are disabled in Direct Messages and Group Chats.", "x");
    return await interaction.reply({embeds: [embed], ephemeral: true});
  }

  if (interaction.isCommand()) {
    var cmdName = interaction.commandName;
    try {
      var subCmdName = interaction.options?.getSubcommand();
    } catch(e) {
      var subCmdName = "";
    }

    var fullCmdName = cmdName + (subCmdName ? `|${subCmdName}` : "");
    var type = CommandFolders[cmdName];

    if (client.cooldowns.has(`${fullCmdName}_${interaction.user.id}`)) {
      await interaction.deferReply({ephemeral: true});
      return await GeneralFunctions.sendCooldown(interaction, client.cooldowns.get(`${fullCmdName}_${interaction.user.id}`));
    }
    client.cooldowns.set(`${fullCmdName}_${interaction.user.id}`, {
      command_name: fullCmdName,
      timestamp: GeneralFunctions.getUnix()
    });
    setTimeout(() => {
      client.cooldowns.delete(`${fullCmdName}_${interaction.user.id}`);
    }, Cooldowns[fullCmdName]);

    getExec(type.type, type.name, interaction, client);
  } else if (interaction.isAutocomplete()) {
    var cmdName = interaction.commandName;
    var type = CommandFolders[cmdName];

    getAutocomplete(type.type, cmdName, interaction, client);
  } else if (interaction.isButton()) {
    var cmdName = interaction.customId.split("_")[0];

    if (cmdName.endsWith("@")) {
      cmdName = cmdName.replace("@", "");
      var type = CommandFolders[cmdName];

      if (interaction.user.id != interaction.customId.split("_")[2]) {
        var embed = await GeneralFunctions.generateAlert(interaction, "Hey! This is not your command!", "x");
        return await interaction.reply({embeds: [embed], ephemeral: true});
      }
      getExec(type.type, cmdName, interaction, client, true);
    } else {
      var type = CommandFolders[cmdName];
      getBtnEvent(type.type, cmdName, interaction, client);
    }
  } else if (interaction.isStringSelectMenu()) {
    var cmdName = interaction.values[0].split("_")[0];

    if (cmdName.endsWith("@")) {
      cmdName = cmdName.replace("@", "");
      var type = CommandFolders[cmdName];

      if (interaction.user.id != interaction.values[0].split("_")[2]) {
        var embed = await GeneralFunctions.generateAlert(interaction, "Hey! This is not your command!", "x");
        return await interaction.reply({embeds: [embed], ephemeral: true});
      }
      getExec(type.type, cmdName, interaction, client, true);
    } else {
      var type = CommandFolders[cmdName];
      getMenuEvent(type.type, cmdName, interaction, client);
    }
  } else if (interaction.isModalSubmit()) {
    var cmdName = interaction.customId.split("_")[0];
    var type = CommandFolders[cmdName];

    if (interaction.user.id != interaction.customId.split("_")[2]) {
      var embed = await GeneralFunctions.generateAlert(interaction, "Hey! This is not your command!", "x");
      return await interaction.reply({embeds: [embed], ephemeral: true});
    }
    getModalEvent(type.type, cmdName, interaction, client);
  }
});

client.login(process.env.TOKEN);
client.on("debug", console.log).on("warn", console.log);