const { createCanvas } = require("@napi-rs/canvas");
const { Chart, registerables } = require("chart.js");
Chart.register(...registerables);

Math.clamp = (min, num, max) => {
  return Math.min(Math.max(min, num), max);
};

function hr(length) {
  return "-".repeat(length);
}

function hhmmssToSeconds(time) {
  const parts = time.split(':');

  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;

  return (hours * 3600) + (minutes * 60) + seconds;
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

exports.createGraph = async (width, height, limit, named_stat) => {
  var teams = await fetchScoreboard(`/api/team/scores.php?${Date.now()}`);
  const dataset = teams.filter(team => {
    return team.play_time != null && team.score_time != null
  }).map(team => {
    switch (named_stat) {
      case "Score":
        return {
          label: parseInt(team.total ? team.total : team.ccs_score).toString(),
          value: parseInt(team.total ? team.total : team.ccs_score)
        };
      case "Play Time":
        return {
          label: team.play_time,
          value: hhmmssToSeconds(team.play_time)
        };
      case "Score Time":
        return {
          label: team.score_time,
          value: hhmmssToSeconds(team.score_time)
        };
      case "Location":
        return {
          label: team.location,
          value: parseInt(Array.from(team.location).map(char => char.charCodeAt(0)).join(""))
        };
      default:
        return {
          label: "unknown",
          value: 0
        };
    }
  });

  const counts = {};
  const map = {};

  dataset.forEach(entry => {
    counts[entry.value] = (counts[entry.value] || 0) + 1;
    if (!map[entry.value]) {
      map[entry.value] = entry.label;
    }
  });

  const counted = Object.entries(counts).map(([value, count]) => ({
    value: parseInt(value),
    count: count,
    label: map[value]
  }));

  const sorted = counted.sort((a, b) => b.count - a.count).slice(0, limit).sort((a, b) => a.value - b.value);
  const labels = sorted.map(entry => entry.label);
  const data = sorted.map(entry => entry.count);

  const base = 18;
  const ratio = 0.25;
  const font_size = Math.max(1, base - Math.floor(labels.length / (limit * ratio)));

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Number of Teams",
        data: data,
        backgroundColor: "rgba(114, 137, 218, 0.8)",
        borderColor: "rgba(114, 137, 218, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Teams",
            color: "#FFFFFF",
            font: {
              size: 18
            }
          },
          ticks: {
            color: "#FFFFFF",
            font: {
              size: 16
            }
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          }
        },
        x: {
          title: {
            display: true,
            text: named_stat,
            color: "#FFFFFF",
            font: {
              size: 18
            }
          },
          ticks: {
            type: "category",
            color: "#FFFFFF",
            font: {
              size: font_size
            },
            autoSkip: false,
            minRotation: 45,
            maxRotation: 90,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.1)"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#FFFFFF",
            font: {
              size: 18
            }
          }
        }
      },
      elements: {
        bar: {
          borderRadius: 5,
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

  if (!image_data.length) {
    return {
      content: `\`\`\`ansi\n${BOLD + RED}This team isn't currently competing in this round.\`\`\``
    }
  }

  var content = "```ansi\n";
  content += `${BOLD + BLUE}CyberPatriot Scoreboard\n`;
  content += `${CYAN + hr(80)}\n`;
  content += `${WHITE}Team Number | Location | Division | Score     | Play Time | Score Time | Codes**\n`;
  content += `${CYAN + hr(80)}\n`;

  team_data.forEach(team => {
    const team_number = `${MAGENTA + team.team_number}`.padEnd(19, " ");
    const location = `${GREEN + team.location}`.padEnd(16, " ");
    const division = `${GREEN + team.division}`.padEnd(16, " ");
    const score = `${BLUE + parseInt(team.total ? team.total : team.ccs_score)}`.padEnd(17, " ");
    const play_time = `${WHITE + (team.play_time ?? "N/A")}`.padEnd(17, " ");
    const score_time = `${WHITE + (team.score_time ?? "N/A")}`.padEnd(18, " ");
    const codes = `${RED + (team.code || "N/A")}`;
    content += `${team_number + location + division + score + play_time + score_time + codes}\n`;
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
  var teams = await fetchScoreboard(`/api/team/scores.php?${Date.now()}`);

  function addTeamEntries(entries) {
    return entries.map(entry => {
      const real_rank = teams.findIndex(team => team.team_number === entry.team_number) + 1;
      const rank = `${GREEN}#${real_rank}`.padEnd(12, " ");

      const team_number = `${MAGENTA + entry.team_number}`.padEnd(19, " ");
      const score = `${BLUE + parseInt(entry.total ? entry.total : entry.ccs_score)}`.padEnd(17, " ");
      const score_time = `${WHITE + (entry.score_time ?? "N/A")}`.padEnd(18, " ");
      const codes = `${RED + (entry.code || "N/A")}`;
      return `${rank + team_number + score + score_time + codes}`;
    }).join("\n");
  }

  if (location) teams = teams.filter(team => team.location.toUpperCase() == location.toUpperCase());
  const pages = Math.ceil(teams.length / entries);
  page = Math.clamp(0, page, pages - 1);

  var content = "```ansi\n";
  content += `${BOLD + BLUE}CyberPatriot Scoreboard\n`;
  content += `${CYAN + hr(53)}\n`;
  content += `${WHITE}Rank | Team Number | Score     | Score Time | Codes**\n`;
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