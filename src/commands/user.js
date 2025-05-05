// github-stats/user.js

// Import required Discord.js components
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  StringSelectMenuBuilder,
  AttachmentBuilder
} from 'discord.js';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { config } from 'dotenv';

// Load environment variables
config();

// GitHub API headers
const githubHeaders = process.env.GITHUB_TOKEN
  ? {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'User-Agent': 'github-stats-bot'
    }
  : {};

// Utility: Format size from KB to human readable string
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

// Utility: Format bytes to human readable string
function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Chart generator instance
const chartCanvas = new ChartJSNodeCanvas({ width: 800, height: 500 });

export default {
  // Command structure definition
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('GitHub user tools')
    .addSubcommand(sub =>
      sub.setName('profile')
        .setDescription('View a GitHub user profile.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('followers')
        .setDescription('View followers of a GitHub user.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('following')
        .setDescription('View who a GitHub user is following.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('statistics')
        .setDescription('Summary stats about a GitHub user.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('repos')
        .setDescription('List public repositories for a GitHub user.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('languages')
        .setDescription('Aggregated language usage across all public repositories.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('activity')
        .setDescription('Show recent public GitHub activity from a user.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('stars')
        .setDescription('List repositories starred by a GitHub user.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('gists')
        .setDescription('List public gists for a GitHub user.')
        .addStringOption(opt =>
          opt.setName('username')
            .setDescription('GitHub username')
            .setRequired(true)
          )
    )
    .addSubcommand(sub =>
      sub.setName('organizations')
        .setDescription('List organizations a GitHub user belongs to.')
        .addStringOption(opt =>
          opt.setName('username').setDescription('GitHub username').setRequired(true)
        )
    ),    

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const username = interaction.options.getString('username');

    // Stars sub command logic
    if (sub === 'stars') {
      try {
        await interaction.deferReply(); // No `ephemeral` warning now
    
        const res = await fetch(`https://api.github.com/users/${username}/starred?per_page=100`, {
          headers: githubHeaders
        });
    
        if (!res.ok) {
          return await interaction.editReply({ content: '❌ Could not fetch starred repositories.' });
        }
    
        const repos = await res.json();
        if (!repos.length) {
          return await interaction.editReply({ content: 'ℹ️ No starred repositories found.' });
        }
    
        let page = 0;
        const perPage = 10;
        const totalPages = Math.ceil(repos.length / perPage);
    
        
        const getEmbed = () => {
          const start = page * perPage;
          const currentRepos = repos.slice(start, start + perPage);
        
          const description = currentRepos.map((repo, i) => {
            const starredDate = new Date(repo.starred_at || repo.created_at).toLocaleString('en-AU', {
              dateStyle: 'long',
              timeStyle: 'short'
            });
        
            return `**${start + i + 1}. [${repo.full_name}](${repo.html_url})**\n${repo.description || '*No description*'}\n**⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}**\n**Starred at: ${starredDate}**`;
          }).join('\n\n');
        
          return new EmbedBuilder()
            .setTitle(`⭐ Starred Repositories for ${username}`)
            .setDescription(description)
            .setFooter({ text: `Page ${page + 1} of ${totalPages} • GitHub Stats • Made by @LachlanDev ` })
            .setColor(0xf1e05a)
            .setTimestamp();
        };
        
    
        const getButtons = (disabled = false) => [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('prev')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(disabled || page === 0),
    
            new ButtonBuilder()
              .setCustomId('next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(disabled || page >= totalPages - 1)
          )
        ];
    
        const message = await interaction.editReply({
          embeds: [getEmbed()],
          components: getButtons(),
          fetchReply: true
        });
    
        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000
        });
    
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ This interaction is not for you.', ephemeral: true });
          }
    
          if (i.customId === 'prev' && page > 0) page--;
          if (i.customId === 'next' && page < totalPages - 1) page++;
    
          await i.update({
            embeds: [getEmbed()],
            components: getButtons()
          });
        });
    
        collector.on('end', async () => {
          try {
            await message.edit({ components: getButtons(true) });
          } catch (err) {
            console.warn('🛑 Cleanup failed:', err.message);
          }
        });
    
      } catch (err) {
        console.error('❌ Error in /user stars:', err);
    
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ An unexpected error occurred.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ An unexpected error occurred.', ephemeral: true });
        }
      }
    
      return;
    }

    if (sub === 'organizations') {
      try {
        await interaction.deferReply();
    
        const res = await fetch(`https://api.github.com/users/${username}/orgs`, { headers: githubHeaders });
        if (!res.ok) {
          return await interaction.editReply({ content: '❌ Could not fetch organizations.' });
        }
    
        const orgs = await res.json();
        if (!orgs.length) {
          return await interaction.editReply({ content: 'ℹ️ No organizations found.' });
        }
    
        let page = 0;
        const perPage = 10;
        const totalPages = Math.ceil(orgs.length / perPage);
    
        const getEmbed = () => {
          const start = page * perPage;
          const current = orgs.slice(start, start + perPage);
          const description = current.map((org, i) => `**${start + i + 1}. [${org.login}](${org.url.replace('api.', '').replace('/orgs', '')})**`).join('\n');
    
          return new EmbedBuilder()
            .setTitle(`🏢 Organizations for ${username}`)
            .setDescription(description)
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
            .setColor(0xdbab09)
            .setTimestamp();
        };
    
        const getComponents = () => [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('prev_orgs')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('next_orgs')
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page >= totalPages - 1)
          )
        ];
    
        const message = await interaction.editReply({
          embeds: [getEmbed()],
          components: getComponents(),
          fetchReply: true
        });
    
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
    
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Not your interaction.', ephemeral: true });
          }
    
          if (i.customId === 'prev_orgs' && page > 0) page--;
          if (i.customId === 'next_orgs' && page < totalPages - 1) page++;
    
          await i.update({
            embeds: [getEmbed()],
            components: getComponents()
          });
        });
    
        collector.on('end', async () => {
          try {
            await message.edit({ components: [] });
          } catch (err) {
            console.warn('❌ Failed to cleanup orgs buttons:', err);
          }
        });
    
      } catch (err) {
        console.error('❌ Organizations error:', err);
        return interaction.editReply({ content: '❌ Something went wrong while fetching organizations.' });
      }
    }

    // Gists sub command logic
    if (sub === 'gists') {
      try {
        await interaction.deferReply();

        const sessionId = crypto.randomUUID();
        const res = await fetch(`https://api.github.com/users/${username}/gists?per_page=100`, {
          headers: githubHeaders
        });

        if (!res.ok) {
          return await interaction.editReply({ content: '❌ Could not fetch gists.' });
        }

        let gists = await res.json();
        if (!gists.length) {
          return await interaction.editReply({ content: 'ℹ️ No public gists found.' });
        }

        let page = 0;
        const perPage = 10;
        const totalPages = Math.ceil(gists.length / perPage);

        const getPaginatedEmbed = () => {
          const start = page * perPage;
          const current = gists.slice(start, start + perPage);

          const description = current.map((gist, i) => {
            const files = Object.keys(gist.files).join(', ');
            const created = new Date(gist.created_at).toLocaleString('en-AU', {
              dateStyle: 'long',
              timeStyle: 'short'
            });

            return `**${start + i + 1}. [${files}](${gist.html_url})**\n${gist.description || '*No description*'}\n🕒 Created: ${created}`;
          }).join('\n\n');

          return new EmbedBuilder()
            .setTitle(`📄 Public Gists for ${username}`)
            .setDescription(description)
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
            .setColor(0x6e5494)
            .setTimestamp();
        };

        const getPaginatedComponents = (disabled = false) => {
          const current = gists.slice(page * perPage, page * perPage + perPage);

          return [
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`select_gist_${sessionId}`)
                .setPlaceholder('📜 Select a gist to view')
                .addOptions(
                  current.map((gist, i) => ({
                    label: Object.keys(gist.files)[0]?.slice(0, 25) || `Gist ${i + 1}`,
                    description: gist.description?.slice(0, 50) || 'No description',
                    value: gist.id
                  }))
                )
                .setDisabled(disabled)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`prev_gist_${sessionId}`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || page === 0),
              new ButtonBuilder()
                .setCustomId(`next_gist_${sessionId}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || page >= totalPages - 1),
              new ButtonBuilder()
                .setLabel('View Profile')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://gist.github.com/${username}`)
            )
          ];
        };

        const message = await interaction.editReply({
          embeds: [getPaginatedEmbed()],
          components: getPaginatedComponents(),
          fetchReply: true
        });

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async (i) => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Not your interaction.', ephemeral: true });
          }

          if (i.isStringSelectMenu() && i.customId === `select_gist_${sessionId}`) {
            const gistId = i.values[0];
            const gistRes = await fetch(`https://api.github.com/gists/${gistId}`, {
              headers: githubHeaders
            });

            if (!gistRes.ok) {
              return i.reply({ content: '❌ Could not fetch selected gist.', ephemeral: true });
            }

            const gist = await gistRes.json();
            const fileList = Object.values(gist.files);
            const languages = [...new Set(fileList.map(f => f.language || 'Unknown'))].join(', ');
            const totalSizeKB = (fileList.reduce((sum, f) => sum + (f.size || 0), 0) / 1024).toFixed(3);
            const created = new Date(gist.created_at).toLocaleString('en-AU', {
              dateStyle: 'long',
              timeStyle: 'short'
            });
            const updated = new Date(gist.updated_at).toLocaleString('en-AU', {
              dateStyle: 'long',
              timeStyle: 'short'
            });
            const owner = gist.owner?.login || 'Unknown';
            const avatar = gist.owner?.avatar_url;
            const comments = gist.comments ?? 0;
            const forks = gist.forks?.length ?? 0;
            const filesDisplay = fileList.map(f => `📄 [${f.filename}](${f.raw_url}) — ${f.language || 'Unknown'}`).join('\n');
            const shortId = gist.id.substring(0, 8);

            const embed = new EmbedBuilder()
              .setTitle(`🎯 Gist Info | ${shortId}`)
              .setURL(gist.html_url)
              .setDescription(gist.description || '*No description provided*')
              .setThumbnail(avatar)
              .addFields(
                { name: '👤 Owner', value: owner, inline: true },
                { name: '⭐ Stars', value: '0', inline: true },
                { name: '💬 Comments', value: `${comments}`, inline: true },
                { name: '🍴 Forks', value: `${forks}`, inline: true },
                { name: '🧾 Gist ID', value: shortId, inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '📁 Files', value: filesDisplay || 'None' },
                { name: '\u200B', value: '\u200B' },
                { name: '🧠 Language(s)', value: languages || 'Unknown', inline: true },
                { name: '🗃️ Size', value: `${totalSizeKB} KB`, inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '🕒 Created At', value: created, inline: true },
                { name: '🔄 Updated At', value: updated, inline: true }
              )
              .setFooter({
                text: `GitHub Stats • Made by @LachlanDev • ${new Date().toLocaleString('en-AU', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                })}`,
                iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
              })
              .setColor(0x6e5494)
              .setTimestamp();

            const backRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`back_gist_${sessionId}`)
                .setLabel('⬅️ Back to Gists')
                .setStyle(ButtonStyle.Secondary)
            );

            try {
              await i.update({
                embeds: [embed],
                components: [backRow]
              });
            } catch (err) {
              if (err.code === 10062) {
                console.warn('⚠️ Interaction expired before update — rendered anyway.');
              } else {
                console.error('❌ Failed to update gist detail view:', err);
              }
            }
            return;
          }

          if (i.isButton()) {
            try {
              if (i.customId === `prev_gist_${sessionId}` && page > 0) page--;
              else if (i.customId === `next_gist_${sessionId}` && page < totalPages - 1) page++;
              else if (i.customId === `back_gist_${sessionId}`) {
                await i.update({
                  embeds: [getPaginatedEmbed()],
                  components: getPaginatedComponents()
                });
                return;
              }

              await i.update({
                embeds: [getPaginatedEmbed()],
                components: getPaginatedComponents()
              });
            } catch (err) {
              if (err.code === 10062) {
                console.warn('⚠️ Interaction expired before update — rendered anyway.');
              } else {
                console.error('❌ Failed to update button interaction:', err);
              }
            }
          }
        });

        collector.on('end', async () => {
          try {
            await message.edit({ components: [] });
          } catch (err) {
            console.warn('❌ Failed to clean up gist components:', err.message);
          }
        });

      } catch (err) {
        console.error('❌ Gist error:', err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '❌ Something went wrong while processing gists.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Something went wrong while processing gists.', ephemeral: true });
        }
      }

      return;
    }

    // Activity sub command logic
    if (sub === 'activity') {
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

  return interaction.reply({ embeds: [embed], components: [buttonRow] });
    }
    // Languages sub command logic
    if (sub === 'languages') {
      await interaction.deferReply();

      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
        headers: githubHeaders
      });

      if (!res.ok) {
        return interaction.editReply({ content: '❌ Could not fetch repositories.' });
      }

      const repos = await res.json();
      if (!repos.length) {
        return interaction.editReply({ content: 'ℹ️ No public repositories found.' });
      }

      const languageTotals = {};

      await Promise.all(repos.map(async (repo) => {
        try {
          const langRes = await fetch(repo.languages_url, { headers: githubHeaders });
          if (!langRes.ok) return;
          const langData = await langRes.json();
          for (const [language, bytes] of Object.entries(langData)) {
            languageTotals[language] = (languageTotals[language] || 0) + bytes;
          }
        } catch (_) {}
      }));

      const sortedArray = Object.entries(languageTotals).sort((a, b) => b[1] - a[1]);
      const sorted = sortedArray.map(([lang, bytes]) => `**${lang}** — ${formatBytes(bytes)}`);

      const embed = new EmbedBuilder()
        .setTitle(`🏷️ GitHub Language Stats: ${username}`)
        .setDescription(sorted.length ? sorted.join('\n') : '*No language data found.*')
        .setColor(0x1f6feb)
        .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png')
        .setFooter({
          text: 'GitHub Stats • Made by @LachlanDev',
          iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        })
        .setTimestamp();

      const chartBuffer = await chartCanvas.renderToBuffer({
        type: 'pie',
        data: {
          labels: sortedArray.map(([lang]) => lang),
          datasets: [{
            data: sortedArray.map(([, bytes]) => bytes),
            backgroundColor: [
              '#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#00a676', '#8e44ad', '#f39c12', '#3498db', '#2ecc71', '#e74c3c'
            ]
          }]
        },
        options: {
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#ffffff' }
            },
            title: { display: false }
          }
        }
      });

      const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'language-pie-chart.png' });
      embed.setImage('attachment://language-pie-chart.png');

      return interaction.editReply({ embeds: [embed], files: [chartAttachment] });
    }

    // Repos sub command logic
// Repos sub command logic
if (sub === 'repos') {
  try {
    const sessionId      = crypto.randomUUID();
    const perPage        = 5;
    let page             = 0;

    const issuesPerPage  = 5;
    let issuesPage       = 0;

    const prPerPage      = 5;
    let prPage           = 0;

    const commitsPerPage = 5;
    let commitsPage      = 0;

    const relPerPage     = 5;
    let relPage          = 0;

    let currentRepo      = null;

    // 1. Fetch repositories
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      { headers: githubHeaders }
    );
    if (!res.ok) {
      return interaction.reply({ content: '❌ Could not fetch repositories.', ephemeral: true });
    }
    let repos = await res.json();
    if (repos.length === 0) {
      return interaction.reply({ content: 'ℹ️ No public repositories found.', ephemeral: true });
    }
    repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const totalPages = Math.ceil(repos.length / perPage);

    // 2. List‐view helpers
    const getPaginatedEmbed = () => {
      const start = page * perPage;
      const slice = repos.slice(start, start + perPage);
      return new EmbedBuilder()
        .setTitle(`📚 Repositories for ${username}`)
        .setDescription(
          slice.map((repo, i) =>
            `**${start + i + 1}. [${repo.name}](${repo.html_url})**\n` +
            `⭐ ${repo.stargazers_count}  •  🍴 ${repo.forks_count}\n` +
            `${repo.description || '*No description.*'}`
          ).join('\n\n')
        )
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
        .setColor(0x24292f)
        .setTimestamp();
    };
    const getPaginatedComponents = (disabled = false) => {
      const start = page * perPage;
      const slice = repos.slice(start, start + perPage);
      return [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`select_${sessionId}`)
            .setPlaceholder('📦 Select a repository')
            .setDisabled(disabled)
            .addOptions(slice.map(r => ({ label: r.name, value: r.name })))
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`prev_${sessionId}`)
            .setLabel('⬅️ Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page === 0),
          new ButtonBuilder()
            .setCustomId(`next_${sessionId}`)
            .setLabel('Next ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page >= totalPages - 1)
        )
      ];
    };

    // 3. Send initial list
    const message = await interaction.reply({
      embeds:    [getPaginatedEmbed()],
      components: getPaginatedComponents()
    });

    // 4. Detail‐view helpers
    const makeDetailEmbed = async repo => {
      const [langRes, relRes] = await Promise.all([
        fetch(repo.languages_url, { headers: githubHeaders }),
        fetch(`https://api.github.com/repos/${username}/${repo.name}/releases/latest`, { headers: githubHeaders })
      ]);
      const languages = langRes.ok ? Object.keys(await langRes.json()).join(', ') : 'Unknown';
      let latestRelease = 'None';
      if (relRes.ok) {
        const data = await relRes.json();
        if (data.tag_name) latestRelease = data.tag_name;
      }
      const createdAt = new Date(repo.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const sizeMB = (repo.size / 1024).toFixed(2) + ' MB';

      return new EmbedBuilder()
        .setTitle(`📦 ${repo.full_name}`)
        .setURL(repo.html_url)
        .setDescription(repo.description || '*No description provided.*')
        .addFields(
          { name: '👤 Author',         value: repo.owner.login,             inline: true },
          { name: '📝 License',        value: repo.license?.name || 'None',  inline: true },
          { name: '📅 Created',        value: createdAt,                     inline: true },
          { name: '⭐ Stars',          value: `${repo.stargazers_count}`,     inline: true },
          { name: '🍴 Forks',          value: `${repo.forks_count}`,          inline: true },
          { name: '📂 Default Branch', value: repo.default_branch,           inline: true },
          { name: '📦 Size',           value: sizeMB,                         inline: true },
          { name: '🚀 Latest Release', value: latestRelease,                  inline: true }
        )
        .setColor(0x24292f)
        .setFooter({
          text: 'GitHub Stats • Made by @LachlanDev',
          iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        })
        .setTimestamp();
    };
    const makeDetailButtons = () => {
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`backList_${sessionId}`).setLabel('⬅️ Back to List').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`tree_${sessionId}`).setLabel('📂 View Root').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`issues_${sessionId}`).setLabel('🐛 Issues').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`prs_${sessionId}`).setLabel('🔀 PRs').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`commits_${sessionId}`).setLabel('🔨 Commits').setStyle(ButtonStyle.Secondary)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`releases_${sessionId}`).setLabel('🏷️ Releases').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`langs_${sessionId}`).setLabel('💻 Languages').setStyle(ButtonStyle.Secondary)
      );
      return [row1, row2];
    };

    // 5. Tree‐view helper
    const buildRootTreeEmbed = async repo => {
      const treeRes = await fetch(
        `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}`,
        { headers: githubHeaders }
      );
      const treeData = await treeRes.json();
      const root = Array.isArray(treeData.tree)
        ? treeData.tree
            .filter(i => !i.path.includes('/'))
            .sort((a, b) =>
              a.type === b.type ? a.path.localeCompare(b.path) : (a.type === 'tree' ? -1 : 1)
            )
        : [];
      const lines = root.map(i => i.type === 'tree' ? `📁 ${i.path}/` : `📄 ${i.path}`);
      return new EmbedBuilder()
        .setTitle(`📂 ${repo.name}/`)
        .setDescription(lines.join('\n') || '*Empty root.*')
        .setColor(0x24292f)
        .setTimestamp();
    };
    const backToRepoRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Back to Repo').setStyle(ButtonStyle.Secondary)
    );

    // 6. Paginate helper
    const paginate = (all, idx, per) => {
      const pages = Math.max(1, Math.ceil(all.length / per));
      const start = idx * per;
      const slice = all.slice(start, start + per);
      return { slice, pages, start };
    };

    // 7. Component collectors
    const buttonCollector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });
    const menuCollector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    buttonCollector.on('collect', async btn => {
      if (btn.user.id !== interaction.user.id)
        return btn.reply({ content: '❌ This isn’t for you.', ephemeral: true });

      // — Back to list —
      if (btn.customId === `backList_${sessionId}`) {
        currentRepo = null;
        return btn.update({
          embeds:    [getPaginatedEmbed()],
          components: getPaginatedComponents()
        });
      }

      // — Detail view —
      if (btn.customId === `detail_${sessionId}` && currentRepo) {
        const embed = await makeDetailEmbed(currentRepo);
        return btn.update({ embeds: [embed], components: makeDetailButtons() });
      }

      // — Tree view —
      if (btn.customId === `tree_${sessionId}` && currentRepo) {
        const embed = await buildRootTreeEmbed(currentRepo);
        return btn.update({ embeds: [embed], components: [backToRepoRow] });
      }

      // Only defer for paginated subviews
      await btn.deferUpdate();

      // — List pagination —
      if (btn.customId === `prev_${sessionId}` || btn.customId === `next_${sessionId}`) {
        page = btn.customId === `prev_${sessionId}` ? Math.max(page - 1, 0) : Math.min(page + 1, totalPages - 1);
        return btn.editReply({
          embeds:    [getPaginatedEmbed()],
          components: getPaginatedComponents()
        });
      }

      // Must have selected repo now
      if (!currentRepo) return;

      // — Issues pagination —
      if (btn.customId.startsWith(`issues_`)) {
        if (!currentRepo._cachedIssues) {
          const resp = await fetch(
            `https://api.github.com/repos/${currentRepo.full_name}/issues?state=open&per_page=100`,
            { headers: githubHeaders }
          );
          currentRepo._cachedIssues = resp.ok ? await resp.json() : [];
        }
        const all = currentRepo._cachedIssues.filter(i => !i.pull_request);
        if (btn.customId === `issues_prev_${sessionId}`) issuesPage = Math.max(issuesPage - 1, 0);
        if (btn.customId === `issues_next_${sessionId}`) issuesPage = Math.min(issuesPage + 1, Math.ceil(all.length / issuesPerPage) - 1);
        if (btn.customId === `issues_${sessionId}`) issuesPage = 0;

        const { slice, pages, start } = paginate(all, issuesPage, issuesPerPage);
        const embed = new EmbedBuilder()
          .setTitle(`🐛 Issues (Page ${issuesPage + 1}/${pages})`)
          .setDescription(slice.map(i => `**#${i.number}** [${i.title}](${i.html_url})`).join('\n\n') || '*No open issues.*')
          .setFooter({ text: `Showing ${start + 1}-${start + slice.length}/${all.length}` })
          .setColor(0xE74C3C)
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`issues_prev_${sessionId}`).setLabel('◀️').setDisabled(issuesPage===0).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Repo').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`issues_next_${sessionId}`).setLabel('▶️').setDisabled(issuesPage===pages-1).setStyle(ButtonStyle.Secondary)
        );
        return btn.editReply({ embeds: [embed], components: [row] });
      }

      // — PRs pagination —
      if (btn.customId.startsWith(`prs_`)) {
        if (!currentRepo._cachedPRs) {
          const resp = await fetch(
            `https://api.github.com/repos/${currentRepo.full_name}/pulls?state=open&per_page=100`,
            { headers: githubHeaders }
          );
          currentRepo._cachedPRs = resp.ok ? await resp.json() : [];
        }
        const all = currentRepo._cachedPRs;
        if (btn.customId === `prs_prev_${sessionId}`) prPage = Math.max(prPage - 1, 0);
        if (btn.customId === `prs_next_${sessionId}`) prPage = Math.min(prPage + 1, Math.ceil(all.length / prPerPage) - 1);
        if (btn.customId === `prs_${sessionId}`) prPage = 0;

        const { slice, pages, start } = paginate(all, prPage, prPerPage);
        const embed = new EmbedBuilder()
          .setTitle(`🔀 PRs (Page ${prPage + 1}/${pages})`)
          .setDescription(slice.map(p => `**#${p.number}** [${p.title}](${p.html_url})`).join('\n\n') || '*No open PRs.*')
          .setFooter({ text: `Showing ${start+1}-${start+slice.length}/${all.length}` })
          .setColor(0x7289DA)
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`prs_prev_${sessionId}`).setLabel('◀️').setDisabled(prPage===0).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Repo').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`prs_next_${sessionId}`).setLabel('▶️').setDisabled(prPage===pages-1).setStyle(ButtonStyle.Secondary)
        );
        return btn.editReply({ embeds: [embed], components: [row] });
      }

      // — Commits pagination —
      if (btn.customId.startsWith(`commits_`)) {
        if (!currentRepo._cachedCommits) {
          const resp = await fetch(
            `https://api.github.com/repos/${currentRepo.full_name}/commits?per_page=100`,
            { headers: githubHeaders }
          );
          currentRepo._cachedCommits = resp.ok ? await resp.json() : [];
        }
        const all = currentRepo._cachedCommits;
        if (btn.customId === `commits_prev_${sessionId}`) commitsPage = Math.max(commitsPage - 1, 0);
        if (btn.customId === `commits_next_${sessionId}`) commitsPage = Math.min(commitsPage + 1, Math.ceil(all.length / commitsPerPage) - 1);
        if (btn.customId === `commits_${sessionId}`) commitsPage = 0;

        const { slice, pages, start } = paginate(all, commitsPage, commitsPerPage);
        const embed = new EmbedBuilder()
          .setTitle(`🔨 Commits (Page ${commitsPage + 1}/${pages})`)
          .setDescription(slice.map(c => `• [${c.sha.slice(0,7)}](${c.html_url}) — ${c.commit.message.split('\n')[0]}`).join('\n\n') || '*No commits.*')
          .setFooter({ text: `Showing ${start+1}-${start+slice.length}/${all.length}` })
          .setColor(0x2ECC71)
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`commits_prev_${sessionId}`).setLabel('◀️').setDisabled(commitsPage===0).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Repo').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`commits_next_${sessionId}`).setLabel('▶️').setDisabled(commitsPage===pages-1).setStyle(ButtonStyle.Secondary)
        );
        return btn.editReply({ embeds: [embed], components: [row] });
      }

      // — Releases pagination —
      if (btn.customId.startsWith(`releases_`)) {
        if (!currentRepo._cachedReleases) {
          const resp = await fetch(
            `https://api.github.com/repos/${currentRepo.full_name}/releases?per_page=100`,
            { headers: githubHeaders }
          );
          currentRepo._cachedReleases = resp.ok ? await resp.json() : [];
        }
        const all = currentRepo._cachedReleases;
        if (btn.customId === `releases_prev_${sessionId}`) relPage = Math.max(relPage - 1, 0);
        if (btn.customId === `releases_next_${sessionId}`) relPage = Math.min(relPage + 1, Math.ceil(all.length / relPerPage) - 1);
        if (btn.customId === `releases_${sessionId}`) relPage = 0;

        const { slice, pages, start } = paginate(all, relPage, relPerPage);
        const embed = new EmbedBuilder()
          .setTitle(`🏷️ Releases (Page ${relPage + 1}/${pages})`)
          .setDescription(slice.map(r => `**${r.tag_name}** — ${new Date(r.published_at).toLocaleDateString()}`).join('\n\n') || '*No releases.*')
          .setFooter({ text: `Showing ${start+1}-${start+slice.length}/${all.length}` })
          .setColor(0xF1C40F)
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`releases_prev_${sessionId}`).setLabel('◀️').setDisabled(relPage===0).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Repo').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`releases_next_${sessionId}`).setLabel('▶️').setDisabled(relPage===pages-1).setStyle(ButtonStyle.Secondary)
        );
        return btn.editReply({ embeds: [embed], components: [row] });
      }

      // — Languages view —
      if (btn.customId === `langs_${sessionId}` && currentRepo) {
        const langRes = await fetch(currentRepo.languages_url, { headers: githubHeaders });
        const data = langRes.ok ? await langRes.json() : {};
        const desc = Object.entries(data).map(([l,b]) => `• **${l}**: ${b.toLocaleString()} bytes`).join('\n') || '*No data.*';
        const embed = new EmbedBuilder()
          .setTitle(`💻 Languages — ${currentRepo.name}`)
          .setDescription(desc)
          .setColor(0x3498DB)
          .setTimestamp();
        return btn.editReply({
          embeds: [embed],
          components: [backToRepoRow]
        });
      }
    });

    // 8. Repo select handler
    menuCollector.on('collect', async select => {
      if (select.user.id !== interaction.user.id)
        return select.reply({ content: '❌ This isn’t for you.', ephemeral: true });
      currentRepo = repos.find(r => r.name === select.values[0]);
      issuesPage = prPage = commitsPage = relPage = 0;
      const embed = await makeDetailEmbed(currentRepo);
      await select.update({ embeds: [embed], components: makeDetailButtons() });
    });

    // 9. Cleanup
    const cleanup = () => message.edit({ components: [] }).catch(() => null);
    buttonCollector.on('end', cleanup);
    menuCollector.on('end', cleanup);

  } catch (error) {
    console.error(error);
    const replyFn = interaction.replied || interaction.deferred
      ? interaction.followUp.bind(interaction)
      : interaction.reply.bind(interaction);
    await replyFn({ content: '❌ Something went wrong.', ephemeral: true });
  }

  return;
}








    // Statistics sub command logic
    if (sub === 'statistics') {
      await interaction.deferReply();

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

      return interaction.editReply({ embeds: [embed] });
    }

    const endpoint = sub === 'followers' ? 'followers' : sub === 'following' ? 'following' : null;

    if (endpoint) {
      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers: githubHeaders });
      const listRes = await fetch(`https://api.github.com/users/${username}/${endpoint}?per_page=100`, { headers: githubHeaders });

      if (!userRes.ok || !listRes.ok) {
        return interaction.reply({ content: `❌ Could not fetch ${endpoint} or user data.`, ephemeral: true });
      }

      const userData = await userRes.json();
      const users = await listRes.json();

      if (users.length === 0) {
        return interaction.reply({ content: `ℹ️ This user has no public ${endpoint}.`, ephemeral: true });
      }

      let page = 0;
      const perPage = 10;
      const totalPages = Math.ceil(users.length / perPage);

      const getEmbed = () => {
        const start = page * perPage;
        const currentUsers = users.slice(start, start + perPage);
        return new EmbedBuilder()
          .setTitle(`${sub === 'followers' ? '👥 Followers' : '➡️ Following'} of ${username}`)
          .setThumbnail(`${userData.avatar_url}&timestamp=${Date.now()}`)
          .setDescription(currentUsers.map((u, i) => `${start + i + 1}. [${u.login}](${u.html_url})`).join('\n'))
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
          .setColor(0x2f81f7)
          .setTimestamp();
      };

      const getComponents = () => [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
        )
      ];

      const message = await interaction.reply({
        embeds: [getEmbed()],
        components: getComponents(),
        fetchReply: true
      });

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: '❌ This interaction is not for you.', ephemeral: true });
        }

        if (i.customId === 'prev' && page > 0) page--;
        if (i.customId === 'next' && page < totalPages - 1) page++;

        await i.update({
          embeds: [getEmbed()],
          components: getComponents()
        });
      });

      collector.on('end',async () => {
        try {
          await message.edit({ components: [] });
        } catch (err) {
          console.error('❌ Failed to disable interaction after timeout:', err);
        }
      });

      return;
    }

    // Default: Profile logic
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers: githubHeaders });
    if (!res.ok) {
      return interaction.reply({ content: '❌ GitHub user not found.', ephemeral: true });
    }

    const data = await res.json();
    const achievements = [];

    if (data.site_admin) achievements.push('👑 GitHub Staff');
    if (data.hireable) achievements.push('💼 Open to Work');
    if (data.followers >= 1000) achievements.push('🌟 Influential Developer');
    else if (data.followers >= 100) achievements.push('🔥 Popular Developer');
    else if (data.followers >= 25) achievements.push('💬 Community Contributor');

    if (data.public_repos >= 100) achievements.push('🛠️ Open Source Powerhouse');
    else if (data.public_repos >= 30) achievements.push('🧰 Prolific Contributor');
    else if (data.public_repos >= 10) achievements.push('📦 Active Developer');

    const accountAgeYears = (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (accountAgeYears >= 10) achievements.push('🏅 GitHub Veteran');
    else if (accountAgeYears >= 5) achievements.push('⏳ Experienced User');
    else if (accountAgeYears >= 2) achievements.push('📈 Growing Dev');

    if (data.bio && /ai|machine learning|deep learning|bot/i.test(data.bio)) {
      achievements.push('🤖 AI Enthusiast');
    }

    const embed = new EmbedBuilder()
      .setTitle(`GitHub Profile: ${data.login}`)
      .setURL(data.html_url)
      .setDescription(data.bio || '*No bio available.*')
      .setThumbnail(`${data.avatar_url}&timestamp=${Date.now()}`)
      .setColor(0x24292f)
      .setTimestamp(new Date())
      .setFooter({
        text: 'GitHub Stats • Made by @LachlanDev',
        iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      })
      .addFields(
        ...(data.name ? [{ name: '🪪 Name', value: data.name, inline: true }] : []),
        { name: '📍 Location', value: data.location || 'Unknown', inline: true },
        data.blog
          ? {
              name: '🔗 Website',
              value: `[${data.blog.replace(/^https?:\/\//, '')}](https://${data.blog.replace(/^https?:\/\//, '')})`,
              inline: true
            }
          : { name: '\u200B', value: '\u200B', inline: true },
        {
          name: '📅 Joined GitHub',
          value: new Date(data.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          }),
          inline: true
        },
        { name: '📦 Public Repositories', value: `${data.public_repos}`, inline: true },
        { name: '📓 Public Gists', value: `${data.public_gists || 0}`, inline: true },
        { name: '⭐ Followers', value: `${data.followers}`, inline: true },
        { name: '👥 Following', value: `${data.following}`, inline: true },
        ...(data.twitter_username
          ? [{ name: '🐦 Twitter', value: `[@${data.twitter_username}](https://twitter.com/${data.twitter_username})`, inline: true }]
          : []),
        ...(data.company ? [{ name: '🏢 Company', value: data.company, inline: true }] : []),
        ...(data.email ? [{ name: '📬 Email', value: data.email, inline: true }] : []),
        { name: '\u200B', value: '\u200B', inline: false },
        {
          name: '🏆 Achievements',
          value: achievements.length > 0 ? achievements.join('\n') : '*No notable achievements yet*',
          inline: true
        }
      );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View on GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL(data.html_url)
    );

    return interaction.reply({ embeds: [embed], components: [buttonRow] });
  }
};