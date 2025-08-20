const { OptionTypes, CommandTypes, ButtonTypes, ChannelTypes, BitwisePermissions, GeneralFunctions, EmojiIcons } = require("../../discord.helpers.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, Events } = require("discord.js");
const { createGraph } = require("../../scoreboard.helpers.js");
const wait = ms => new Promise(res => setTimeout(res, ms));

Math.clamp = (min, num, max) => {
  return Math.min(Math.max(min, num), max);
};

const MIN_LIMIT = 5;
const MAX_LIMIT = 50;

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
          { name: "Score", value: "Score" },
          { name: "Play Time", value: "Play Time" },
          { name: "Score Time", value: "Score Time" },
          { name: "Location", value: "Location" },
        ],
        required: true,
      },
      {
        type: OptionTypes.INTEGER,
        name: "limit",
        description: "Number of bars to show at once",
        min_value: MIN_LIMIT,
        max_value: MAX_LIMIT,
        required: false
      }
    ]
  },
  async exec(interaction, client, refreshed = false) {
    const options = interaction.options;
    const stat = interaction.customId?.split("_")[3] ?? interaction.values?.[0].split("_")[3] ?? options?.getString("stat") ?? "CCS Score";
    const limit = parseInt(interaction.customId?.split("_")[4] ?? interaction.values?.[0].split("_")[4] ?? options?.getInteger("limit") ?? MAX_LIMIT);

    var buffer = await createGraph(1000, 600, limit, stat);
    if (!buffer) {
      const embed = await GeneralFunctions.generateAlert(interaction, `Could not fetch stats info at this time!`, "x");
      return await interaction.reply({embeds: [embed], ephemeral: true});
    }

    var row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("stat")
          .setPlaceholder("Select a stat to view...")
          .addOptions(
            { label: "Score", value: `stats@__${interaction.user.id}_Score_${limit}`, default: stat == "Score" },
            { label: "Play Time", value: `stats@__${interaction.user.id}_Play Time_${limit}`, default: stat == "Play Time" },
            { label: "Score Time", value: `stats@__${interaction.user.id}_Score Time_${limit}`, default: stat == "Score Time" },
            { label: "Location", value: `stats@__${interaction.user.id}_Location_${limit}`, default: stat == "Location" },
          ),
      );
    var row2 = new ActionRowBuilder()
      .addComponents(
        GeneralFunctions.generateRefresh(interaction, "stats", "refresh", `${stat}_${limit}`)
      );

    if (refreshed) {
      await interaction.update({
        files: [{ attachment: buffer, name: "histogram.png" }], 
        components: [row, row2]
      });
    } else {
      await interaction.reply({
        files: [{ attachment: buffer, name: "histogram.png" }], 
        components: [row, row2]
      });
    }
  },
  async btnEvent(interaction, client) {},
  async menuEvent(interaction, client, refreshed = false) {}
};