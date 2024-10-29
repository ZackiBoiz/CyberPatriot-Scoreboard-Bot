const { OptionTypes, CommandTypes, ButtonTypes, ChannelTypes, BitwisePermissions, GeneralFunctions, EmojiIcons } = require("../../discord.helpers.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, Events } = require("discord.js");
const { createGraph } = require("../../scoreboard.helpers.js");
const wait = ms => new Promise(res => setTimeout(res, ms));

Math.clamp = (min, num, max) => {
  return Math.min(Math.max(min, num), max);
};

module.exports = {
  data: {
    name: "stats",
    description: "Get a detailed graph on CyberPatriot scoreboard stats.",
    type: CommandTypes.SLASH,
    options: [
      {
        type: OptionTypes.STRING,
        name: "stat",
        description: "Team stat to graph",
        choices: [
          { name: "CCS Score", value: "CCS Score" },
          { name: "Play Time", value: "Play Time" },
          { name: "Score Time", value: "Score Time" },
          { name: "Location", value: "Location" },
        ],
        required: true,
      },
    ]
  },
  async exec(interaction, client, refreshed = false) {
    const options = interaction.options;
    const stat = interaction.customId?.split("_")[3] ?? options.getString("stat");
    var real_stat = "ccs_score";

    switch (stat) {
      case "Play Time":
        real_stat = "play_time";
        break;
      case "Score Time":
        real_stat = "score_time";
        break;
      case "Location":
        real_stat = "location";
        break;
      case "CCS Score": default:
        real_stat = "ccs_score"
        break;
    }

    var buffer = await createGraph(800, 600, stat, real_stat);
    var row = new ActionRowBuilder()
      .addComponents(
        GeneralFunctions.generateRefresh(interaction, "stats", "refresh", `${stat}`)
      );

    if (refreshed) {
      await interaction.update({
        files: [{ attachment: buffer, name: "histogram.png" }], 
        components: [row]
      });
    } else {
      await interaction.reply({
        files: [{ attachment: buffer, name: "histogram.png" }], 
        components: [row]
      });
    }
  },
  async btnEvent(interaction, client) {},
  async menuEvent(interaction, client, refreshed = false) {}
};