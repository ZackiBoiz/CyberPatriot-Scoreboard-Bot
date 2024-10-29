const { createCanvas } = require("@napi-rs/canvas");
const { Chart, registerables } = require("chart.js");
Chart.register(...registerables);

Math.clamp = (min, num, max) => {
  return Math.min(Math.max(min, num), max);
};

function hr(length) {
  return "-".repeat(length);
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const UNDERLINE = "\x1b[2m";
const WHITE = "\x1b[37m";
const RED = "\x1b[31m";
const GOLD = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";

async function fetchScoreboard(route) {
  var response = await fetch("https://scoreboard.uscyberpatriot.org" + route, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return (await response.json()).data;
}

exports.createGraph = async (width, height, named_stat, stat) => {
  const teams = await fetchScoreboard("/api/team/scores.php");

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  var counts = {};
  teams.forEach(team => {
    counts[team[stat]] ??= 0;
    counts[team[stat]]++;
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Number of Teams",
        data: data,
        backgroundColor: "rgba(114, 137, 218, 0.8)", // Discord-like color
        borderColor: "rgba(114, 137, 218, 1)",
        borderWidth: 1
          }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Optional: allows the chart to resize
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Teams",
            color: "#FFFFFF", // White color for the title
            font: {
              size: 18 // Increase title font size
            }
          },
          ticks: {
            color: "#FFFFFF", // White color for tick labels
            font: {
              size: 16 // Increase tick label font size
            }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)" // Light grid lines for better visibility
          }
        },
        x: {
          title: {
            display: true,
            text: named_stat,
            color: "#FFFFFF", // White color for the title
            font: {
              size: 18 // Increase title font size
            }
          },
          ticks: {
            type: "category",
            color: "#FFFFFF", // White color for tick labels
            font: {
              size: 14 // Increase tick label font size
            }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)" // Light grid lines for better visibility
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#FFFFFF", // White color for legend labels
            font: {
              size: 18 // Increase legend font size
            }
          }
        }
      },
      elements: {
        bar: {
          borderRadius: 5, // Rounded corners for bars
        }
      }
    }
  });

  chart.update();
  return canvas.toBuffer("image/png");
};

exports.fetchTeam = async (team_name) => {
  const team_data = await fetchScoreboard(`/api/team/scores.php?team=${team_name}`);
  const image_data = await fetchScoreboard(`/api/image/scores.php?team=${team_name}`);

  var content = "```ansi\n";
  content += `${BOLD + BLUE}CyberPatriot Scoreboard\n`;
  content += `${CYAN + hr(80)}\n`;
  content += `${WHITE}Team Number | Location | Division | CCS Score | Play Time | Score Time | Codes**\n`;
  content += `${CYAN + hr(80)}\n`;

  team_data.forEach(team => {
    const team_number = `${MAGENTA + team.team_number}`.padEnd(19, " ");
    const location = `${GREEN + team.location}`.padEnd(16, " ");
    const division = `${GREEN + team.division}`.padEnd(16, " ");
    const ccs_score = `${BLUE + team.ccs_score}`.padEnd(17, " ");
    const play_time = `${WHITE + team.play_time}`.padEnd(17, " ");
    const score_time = `${WHITE + team.score_time}`.padEnd(18, " ");
    const codes = `${RED + (team.code || "N/A")}`;
    content += `${team_number + location + division + ccs_score + play_time + score_time + codes}\n`;
  });
  content += `${CYAN + hr(80)}\n`;
  content += `${RED}**Codes:\n${GOLD}  M = Multiple instances\n  T = Time exceeded`;
  content += "```";

  content += "```ansi\n";
  content += `${BOLD + BLUE}CyberPatriot Scoreboard\n`;
  content += `${CYAN + hr(82)}\n`;
  content += `${WHITE}Image             | CCS Score | Duration | Found | Remaining | Penalties | Codes**\n`;
  content += `${CYAN + hr(82)}\n`;

  image_data.forEach(image => {
    const image_name = `${MAGENTA + image.image}`.padEnd(25, " ");
    const ccs_score = `${BLUE + image.ccs_score}`.padEnd(17, " ");
    const duration = `${WHITE + image.duration}`.padEnd(16, " ");
    const found = `${BLUE + image.found}`.padEnd(13, " ");
    const remaining = `${BLUE + image.remaining}`.padEnd(17, " ");
    const penalties = `${RED + image.penalties}`.padEnd(17, " ");
    const codes = `${RED + (image.code || "N/A")}`;
    content += `${image_name + ccs_score + duration + found + remaining + penalties + codes}\n`;
  });

  content += `${CYAN + hr(82)}\n`;
  content += `${RED}**Codes:\n${GOLD}  M = Multiple instances\n  T = Time exceeded`;
  content += "```";

  return { content };
};

exports.fetchScores = async (entries, page, pins, location = null) => {
  var teams = await fetchScoreboard("/api/team/scores.php");

  function addTeamEntries(entries) {
    return entries.map(entry => {
      const real_rank = teams.findIndex(team => team.team_number === entry.team_number) + 1;
      const rank = `${GREEN}#${real_rank}`.padEnd(12, " ");

      const team_number = `${MAGENTA + entry.team_number}`.padEnd(19, " ");
      const ccs_score = `${BLUE + entry.ccs_score}`.padEnd(17, " ");
      const score_time = `${WHITE + entry.score_time}`.padEnd(18, " ");
      const codes = `${RED + (entry.code || "N/A")}`;
      return `${rank + team_number + ccs_score + score_time + codes}`;
    }).join("\n");
  }

  if (location) teams = teams.filter(team => team.location.toUpperCase() == location.toUpperCase());
  const pages = Math.ceil(teams.length / entries);
  page = Math.clamp(0, page, pages - 1);

  var content = "```ansi\n";
  content += `${BOLD + BLUE}CyberPatriot Scoreboard\n`;
  content += `${CYAN + hr(53)}\n`;
  content += `${WHITE}Rank | Team Number | CCS Score | Score Time | Codes**\n`;
  content += `${CYAN + hr(53)}\n`;

  const pinned_scores = teams.filter(team => pins.includes(team.team_number));
  if (pinned_scores.length) {
    content += addTeamEntries(pinned_scores) + "\n";
    content += `${CYAN + hr(53)}\n`;
  }
  const paginated_scores = teams.slice(entries * page, entries * (page + 1));
  if (paginated_scores.length) {
    content += addTeamEntries(paginated_scores) + "\n";
    content += `${CYAN + hr(53)}\n`;
  }

  content += `${RED}**Codes:\n${GOLD}  M = Multiple instances\n  T = Time exceeded\n\n`;
  content += `${GOLD}Showing ${Math.max(1, entries * page + 1)} to ${Math.min(teams.length, entries * (page + 1))} of ${teams.length} entries from ${location ? location.toUpperCase() : "all locations"}. ${WHITE}(page ${page + 1} of ${pages})`;
  content += "```";

  return { pages, content };
};