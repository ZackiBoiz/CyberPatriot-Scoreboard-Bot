const { Routes } = require("discord-api-types/v9");
const { CommandFolders } = require("./discord.helpers.js");

function get(folder, type, fname) {
  return require(`./${folder}/${type}/${fname}.js`).data;
}

async function InitCmds(client, rest) {
  const data = [];
  const admin = [];

  for (let [name, type] of Object.entries(CommandFolders)) {
    console.log(`Importing ${name}... [${Object.keys(CommandFolders).indexOf(name) + 1}/${Object.keys(CommandFolders).length}]`);
    if (type.menu) {
      continue;
    }

    if (type == "admin") {
      admin.push(get(type.dir, type.type, name));
    } else {
      data.push(get(type.dir, type.type, name));
    }
  }

  //global cmds
  await client.application.commands.set(data);
  //admin cmds
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.TEST_GUILD), { body: admin });
}

module.exports = { InitCmds };