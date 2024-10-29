const { OptionTypes, CommandTypes, ButtonTypes, ChannelTypes, BitwisePermissions, GeneralFunctions, EmojiIcons } = require('../../discord.helpers.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
const { fetchTeam } = require("../../scoreboard.helpers.js");
const wait = ms => new Promise(res => setTimeout(res, ms));

Math.clamp = (min, num, max) => {
  return Math.min(Math.max(min, num), max);
};
const TEAM_NUMBER_LENGTH = 7;

module.exports = {
  data: {
    name: "lookup",
    description: "Lookup a CyberPatriot team on the scoreboard.",
    type: CommandTypes.SLASH,
    options: [
      {
        type: OptionTypes.STRING,
        name: "team",
        description: "Team number to lookup",
        required: true,
      },
    ]
  },
  async exec(interaction, client, refreshed = false) {
    const options = interaction.options;
    const team_name = interaction.customId?.split("_")[3] ?? options.getString("team");

    if (team_name.length != TEAM_NUMBER_LENGTH) {
      var embed = await GeneralFunctions.generateAlert(interaction, `The team number provided isn't ${TEAM_NUMBER_LENGTH} characters long.`, "x");
      return await interaction.reply({embeds: [embed], ephemeral: true});
    }

    var content = `[View the team here](<https://scoreboard.uscyberpatriot.org/team.php?team=${team_name}>).`;
    var { content: scoreboard_content } = await fetchTeam(team_name);
    content += scoreboard_content;
    var row = new ActionRowBuilder()
      .addComponents(
        GeneralFunctions.generateRefresh(interaction, "lookup", "refresh", `${team_name}`)
      );

    if (refreshed) {
      await interaction.update({content: content, components: [row]});
    } else {
      await interaction.reply({content: content, components: [row]});
    }
  },
  async btnEvent(interaction, client) {},
  async menuEvent(interaction, client, refreshed = false) {}
};