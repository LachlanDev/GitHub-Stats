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
      .setName('activity')
      .setDescription('Show recent public GitHub activity from a user.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      const username = interaction.options.getString('username');
      const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public`;
  
      const res = await fetch(url, { headers: githubHeaders });
      if (!res.ok) {
        return interaction.reply({ content: '❌ Could not fetch user activity.', ephemeral: true });
      }
  
      const events = await res.json();
      if (!Array.isArray(events) || events.length === 0) {
        return interaction.reply({ content: 'ℹ️ No recent public activity found.', ephemeral: true });
      }
  
      const lines = [];
      for (const event of events.slice(0, 8)) {
        const repo = event.repo?.name || 'Unknown Repo';
        const createdAt = new Date(event.created_at).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
  
        switch (event.type) {
          case 'PushEvent': {
            const commits = event.payload.commits?.length || 0;
            lines.push(`📝 **Pushed ${commits} commit(s)** to \`${event.payload.ref?.replace('refs/heads/', '')}\` in [${repo}](https://github.com/${repo}) — *${createdAt}*`);
            break;
          }
          case 'IssuesEvent': {
            const action = event.payload.action;
            const issue = event.payload.issue;
            lines.push(`🐛 **${action} issue** [#${issue.number} ${issue.title}](https://github.com/${repo}/issues/${issue.number}) — *${createdAt}*`);
            break;
          }
          case 'PullRequestEvent': {
            const pr = event.payload.pull_request;
            const action = event.payload.action;
            lines.push(`🔀 **${action} pull request** [#${pr.number} ${pr.title}](https://github.com/${repo}/pull/${pr.number}) — *${createdAt}*`);
            break;
          }
          case 'WatchEvent': {
            lines.push(`⭐ **Starred** [${repo}](https://github.com/${repo}) — *${createdAt}*`);
            break;
          }
          case 'ForkEvent': {
            lines.push(`🍴 **Forked** [${repo}](https://github.com/${repo}) to [${event.payload.forkee.full_name}](https://github.com/${event.payload.forkee.full_name}) — *${createdAt}*`);
            break;
          }
          default:
            lines.push(`📌 **${event.type}** in [${repo}](https://github.com/${repo}) — *${createdAt}*`);
        }
      }
  
      const embed = new EmbedBuilder()
        .setTitle(`Recent GitHub Activity for ${username}`)
        .setDescription(lines.join('\n\n'))
        .setColor(0x24292f)
        .setTimestamp(new Date())
        .setFooter({
          text: 'GitHub Stats • Made by @LachlanDev',
          iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        });
  
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View GitHub Profile')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://github.com/${username}`),
      );
  
      await interaction.reply({ embeds: [embed], components: [buttonRow] });
    }
  };