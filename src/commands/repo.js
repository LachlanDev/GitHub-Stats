import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
  } from 'discord.js';
  import fetch from 'node-fetch';
  import { config } from 'dotenv';
  
  config();
  
  const githubHeaders = process.env.GITHUB_TOKEN
    ? {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'github-stats-bot'
      }
    : {};
  
  export default {
    data: new SlashCommandBuilder()
      .setName('repo')
      .setDescription('Get details about a GitHub repository.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username or organization')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('repo')
          .setDescription('Repository name')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      const username = interaction.options.getString('username');
      const repo = interaction.options.getString('repo');
      const repoUrl = `https://api.github.com/repos/${username}/${repo}`;
      const languagesUrl = `https://api.github.com/repos/${username}/${repo}/languages`;
      const releasesUrl = `https://api.github.com/repos/${username}/${repo}/releases/latest`;
  
      const repoRes = await fetch(repoUrl, { headers: githubHeaders });
      if (!repoRes.ok) {
        return interaction.reply({ content: '❌ Repository not found.', ephemeral: true });
      }
      const data = await repoRes.json();
  
      const langRes = await fetch(languagesUrl, { headers: githubHeaders });
      const langData = langRes.ok ? await langRes.json() : {};
      const languages = Object.keys(langData).length > 0 ? Object.keys(langData).join(', ') : 'Unknown';
  
      let latestRelease = 'None';
      const releaseRes = await fetch(releasesUrl, { headers: githubHeaders });
      if (releaseRes.ok) {
        const releaseData = await releaseRes.json();
        if (releaseData.tag_name) {
          latestRelease = releaseData.tag_name;
        }
      }
  
      const createdAt = new Date(data.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  
      function formatSize(kb) {
        const units = ['KB', 'MB', 'GB', 'TB'];
        let size = kb;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size = size / 1024;
          unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
      }
  
      const embed = new EmbedBuilder()
        .setTitle(`📦 ${data.full_name}`)
        .setURL(data.html_url)
        .setDescription(data.description || '*No description provided.*')
        .setColor(0x24292f)
        .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png')
        .addFields(
          { name: '👤 Author', value: data.owner.login, inline: true },
          { name: '📝 License', value: data.license?.name || 'None', inline: true },
          { name: '📅 Created', value: createdAt, inline: true },
          { name: '⭐ Stars', value: `${data.stargazers_count}`, inline: true },
          { name: '🍴 Forks', value: `${data.forks_count}`, inline: true },
          { name: '🛠️ Languages', value: languages, inline: true },
          { name: '🚀 Latest Release', value: latestRelease, inline: true },
          { name: '📂 Default Branch', value: data.default_branch, inline: true },
          { name: '📦 Repository Size', value: formatSize(data.size), inline: true },
          ...(data.archived
            ? [{
                name: '⚠️ Archived',
                value: 'This repository is archived and read-only.',
                inline: false
              }]
            : [])
        )
        .setFooter({
          text: 'GitHub Stats • Made by @LachlanDev',
          iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        })
        .setTimestamp();
  
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View on GitHub')
          .setStyle(ButtonStyle.Link)
          .setURL(data.html_url)
      );
  
      await interaction.reply({ embeds: [embed], components: [buttonRow] });
    }
  };
  