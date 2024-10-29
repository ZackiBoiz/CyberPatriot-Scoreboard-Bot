const { OptionTypes, CommandTypes, ButtonTypes, ChannelTypes, BitwisePermissions, GeneralFunctions, EmojiIcons } = require('../../discord.helpers.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, Events } = require('discord.js');
const wait = ms => new Promise(res => setTimeout(res, ms));


module.exports = {
  data: {
    name: "ping",
    description: 'Get current API latency.',
    type: CommandTypes.SLASH
  },
  async exec(interaction, client, refreshed = false) {
    var options = interaction.options;
    var startMs = GeneralFunctions.getMs();

    var embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR)
      .setTitle("Pong!")
      .setAuthor({ name: process.env.AUTHOR_MSG, iconURL: process.env.OWNER_PFP})
      // .setDescription('Some description here')
      .addFields(
        { name: "API Latency", value: `\`${Math.round(client.ws.ping)}\`ms`, inline: true },
        { name: "\u200B", value: "\u200B", inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Ran by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    var msg;
    if (!refreshed) {
      msg = await interaction.reply({embeds: [embed]});
    } else {
      msg = await interaction.update({embeds: [embed]});
    }

    embed.addFields(
      { name: "Initial Response", value: `\`${GeneralFunctions.getMs() - startMs}\`ms`, inline: true }
    );
    await msg.edit({embeds: [embed]});
    embed.addFields(
      { name: "Round Trip", value: `\`${GeneralFunctions.getMs() - startMs}\`ms`, inline: true }
    );

    var row = new ActionRowBuilder()
      .addComponents(
        GeneralFunctions.generateRefresh(interaction, "ping", "refresh"),
      );
    await msg.edit({embeds: [embed], components: [row]});
  },
  async btnEvent(interaction, client) {},
  async menuEvent(interaction, client, refreshed = false) {}
};