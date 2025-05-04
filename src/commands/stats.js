import {
    SlashCommandBuilder,
    EmbedBuilder
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
      .setName('stats')
      .setDescription('Get GitHub user summary stats.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      await interaction.deferReply();
      const username = interaction.options.getString('username');
  
      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers: githubHeaders });
      const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: githubHeaders });
  
      if (!userRes.ok || !reposRes.ok) {
        return interaction.editReply({ content: '❌ Could not fetch GitHub user or repositories.' });
      }
  
      const user = await userRes.json();
      const repos = await reposRes.json();
  
      let stars = 0, forks = 0, watchers = 0;
      for (const repo of repos) {
        stars += repo.stargazers_count;
        forks += repo.forks_count;
        watchers += repo.watchers_count;
      }
  
      const totalCommits = repos.length * 30; // basic estimate
  
      const embed = new EmbedBuilder()
        .setTitle(`📊 GitHub Stats: ${username}`)
        .setURL(user.html_url)
        .setColor(0x1f6feb)
        .setThumbnail(`${user.avatar_url}&timestamp=${Date.now()}`)
        .setDescription(user.bio || '*No bio available.*')
        .addFields(
          { name: '⭐ Total Stars', value: `${stars}`, inline: true },
          { name: '🍴 Total Forks', value: `${forks}`, inline: true },
          { name: '👁️ Total Watchers', value: `${watchers}`, inline: true },
          { name: '👥 Followers', value: `${user.followers}`, inline: true },
          { name: '📈 Estimated Commits', value: `${totalCommits}`, inline: true },
          { name: '📦 Public Repos', value: `${user.public_repos}`, inline: true }
        )
        .setFooter({
          text: 'GitHub Stats • Made by @LachlanDev',
          iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        })
        .setTimestamp();
  
      await interaction.editReply({ embeds: [embed] });
    }
  };
  