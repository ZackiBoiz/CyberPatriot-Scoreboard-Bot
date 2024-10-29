const { OptionTypes, CommandTypes, ButtonTypes, ChannelTypes, BitwisePermissions, GeneralFunctions, EmojiIcons } = require('../../discord.helpers.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
const { fetchScores } = require("../../scoreboard.helpers.js");
const wait = ms => new Promise(res => setTimeout(res, ms));

Math.clamp = (min, num, max) => {
  return Math.min(Math.max(min, num), max);
};

const TEAM_NUMBER_LENGTH = 7;
const MIN_ENTRIES = 3;
const MAX_ENTRIES = 16;

module.exports = {
  data: {
    name: "scoreboard",
    description: "Get current CyberPatriot scoreboard data.",
    type: CommandTypes.SLASH,
    options: [
      {
        type: OptionTypes.INTEGER,
        name: "entries",
        description: "Number of entries to show",
        min_value: MIN_ENTRIES,
        max_value: MAX_ENTRIES,
        required: false,
      },
      {
        type: OptionTypes.INTEGER,
        name: "page",
        description: "Page number to show",
        min_value: 1,
        required: false,
      },
      {
        type: OptionTypes.STRING,
        name: "location",
        description: "Location to filter by",
        required: false
      },
      {
        type: OptionTypes.STRING,
        name: "pins",
        description: "Team numbers to pin (separate by commas)",
        required: false
      },
    ]
  },
  async exec(interaction, client, refreshed = false) {
    const options = interaction.options;
    const entries = Math.clamp(MIN_ENTRIES, parseInt(interaction.customId?.split("_")[3] ?? options?.getInteger("entries") ?? MAX_ENTRIES), MAX_ENTRIES);
    const page = Math.max(0, parseInt(interaction.customId?.split("_")[4] ?? (options?.getInteger("page") ?? 1) - 1));
    const location = interaction.customId?.split("_")[5] ?? options?.getString("location") ?? "";
    const pins = (interaction.customId?.split("_")[6] ?? options?.getString("pins") ?? "").split(/\s*,\s*/);

    if (pins.length > 3) {
      var embed = await GeneralFunctions.generateAlert(interaction, "You can only pin up to 3 teams.", "x");
      return await interaction.reply({embeds: [embed], ephemeral: true});
    }
    if (pins.some(pin => pin && pin.length != TEAM_NUMBER_LENGTH)) {
      var embed = await GeneralFunctions.generateAlert(interaction, `One or multiple team numbers provided aren't ${TEAM_NUMBER_LENGTH} characters long.`, "x");
      return await interaction.reply({embeds: [embed], ephemeral: true});
    }

    var content = "[View the scoreboard here](<https://scoreboard.uscyberpatriot.org/>).";
    var { pages, content: scoreboard_content } = await fetchScores(entries, page, pins, location);
    content += scoreboard_content;
    var row = new ActionRowBuilder()
      .addComponents(
        GeneralFunctions.generateRefresh(interaction, "scoreboard", "all_left", `${entries}_0_${location ?? ""}_${pins.join(",")}`, page > 1),
        GeneralFunctions.generateRefresh(interaction, "scoreboard", "left", `${entries}_${Math.clamp(1, page - 1, pages - 1)}_${location ?? ""}_${pins.join(",")}`, page > 1),
        GeneralFunctions.generateRefresh(interaction, "scoreboard", "refresh", `${entries}_${page}_${location ?? ""}_${pins.join(",")}`),
        GeneralFunctions.generateRefresh(interaction, "scoreboard", "right", `${entries}_${Math.clamp(1, page + 1, pages - 1)}_${location ?? ""}_${pins.join(",")}`, page < pages - 1),
        GeneralFunctions.generateRefresh(interaction, "scoreboard", "all_right", `${entries}_${pages - 1}_${location ?? ""}_${pins.join(",")}`, page < pages - 1),
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