# 📊 GitHub Stats — Discord Bot

A modern and interactive Discord bot for exploring GitHub profiles, repositories, languages, and more — directly from Discord. Built with [Discord.js](https://discord.js.org), powered by the GitHub API, and tailored for developers and communities.

<p align="center">
  <a href="https://discord.com/oauth2/authorize?client_id=1368511664676274186&permissions=277025508352&scope=bot%20applications.commands">
    👉 Invite GitHub Stats Bot to your server
  </a>
</p>

---

<p align="center">
  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Logo" width="100" />
</p>


---

## ✨ Features

- 🧑‍💻 View GitHub user profiles with achievements and stats  
- 📦 Get detailed information on any public repository  
- 📚 Browse through all public repos with buttons and menus  
- 📈 See total stars, forks, watchers, and commits  
- 🧠 Analyze all languages used with pie chart visualization  
- 📰 View recent public GitHub activity  

---

## 💻 Commands

| Command       | Description                                                      |
|---------------|------------------------------------------------------------------|
| `/profile`    | View a detailed GitHub user profile with achievements            |
| `/repo`       | Get full details about a specific public repository              |
| `/repos`      | Browse all public repos (paginated, selectable, interactive)     |
| `/stats`      | Total stats: stars, forks, commits, repos, followers, etc.       |
| `/languages`  | Shows language breakdown with a pie chart                        |
| `/activity`   | Display last 5 GitHub public events (commits, PRs, issues, etc.) |

---

## 🚀 Getting Started

```bash
git clone https://github.com/your-username/github-stats-bot.git
cd github-stats-bot
npm install

```
Rename the ``.env.example`` to ``.env.example`` and fill in the following fields.

```
TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_guild_id_if_dev_only
GITHUB_TOKEN=your_github_token
ENVIRONMENT=dev
```

Run the bot:
```bash
node src/index.js
```

## 🧪 Tech Stack
- Node.js + Discord.js v14

- GitHub REST API (with personal access token)

- Chart.js via chartjs-node-canvas (for language pie charts)

## 🛠️ Contributing
PRs are welcome! Please fork the repo and submit your improvements or suggestions.

## 📄 License
MIT © @LachlanDev