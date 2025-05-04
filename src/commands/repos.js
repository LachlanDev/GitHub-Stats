import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    StringSelectMenuBuilder
  } from 'discord.js';
  import fetch from 'node-fetch';
  import crypto from 'crypto';
  import { config } from 'dotenv';
  
  config();
  
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
  
  const githubHeaders = process.env.GITHUB_TOKEN
    ? {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'github-stats-bot'
      }
    : {};
  
  export default {
    data: new SlashCommandBuilder()
      .setName('repos')
      .setDescription('List public repositories for a GitHub user.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      const username = interaction.options.getString('username');
      const sessionId = crypto.randomUUID();
  
      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers: githubHeaders });
      if (!res.ok) {
        return interaction.reply({ content: '❌ Could not fetch repositories.', ephemeral: true });
      }
  
      let repos = await res.json();
      if (repos.length === 0) {
        return interaction.reply({ content: 'ℹ️ No public repositories found.', ephemeral: true });
      }
  
      repos = repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const perPage = 5;
      let page = 0;
      const totalPages = Math.ceil(repos.length / perPage);
  
      const getPaginatedEmbed = () => {
        const start = page * perPage;
        const currentRepos = repos.slice(start, start + perPage);
  
        return new EmbedBuilder()
          .setTitle(`📚 Repositories for ${username}`)
          .setDescription(
            currentRepos
              .map(
                (repo, i) =>
                  `**${start + i + 1}. [${repo.name}](${repo.html_url})** — ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}\n${repo.description || '*No description.*'}`
              )
              .join('\n\n')
          )
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
          .setColor(0x24292f)
          .setTimestamp();
      };
  
      const getPaginatedComponents = () => {
        const currentRepos = repos.slice(page * perPage, page * perPage + perPage);
  
        return [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`select_${sessionId}`)
              .setPlaceholder('📦 Select a repository to view')
              .addOptions(
                currentRepos.map((repo) => ({
                  label: repo.name,
                  value: repo.name
                }))
              )
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`prev_${sessionId}`)
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),
  
            new ButtonBuilder()
              .setCustomId(`next_${sessionId}`)
              .setLabel('Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page >= totalPages - 1),
  
            new ButtonBuilder()
              .setLabel('View Profile')
              .setStyle(ButtonStyle.Link)
              .setURL(`https://github.com/${username}`)
          )
        ];
      };
  
      let message = await interaction.reply({
        embeds: [getPaginatedEmbed()],
        components: getPaginatedComponents(),
        fetchReply: true
      });
  
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
      });
  
      const menuCollector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
      });
  
      collector.on('collect', async (btn) => {
        if (btn.user.id !== interaction.user.id) {
          return btn.reply({ content: '❌ This interaction isn’t for you.', ephemeral: true });
        }
  
        if (btn.customId === `prev_${sessionId}` && page > 0) page--;
        if (btn.customId === `next_${sessionId}` && page < totalPages - 1) page++;
  
        await btn.update({
          embeds: [getPaginatedEmbed()],
          components: getPaginatedComponents()
        });
      });
  
      menuCollector.on('collect', async (select) => {
        if (select.user.id !== interaction.user.id) {
          return select.reply({ content: '❌ This menu isn’t for you.', ephemeral: true });
        }
  
        const selectedRepoName = select.values[0];
        const repo = repos.find((r) => r.name === selectedRepoName);
        if (!repo) return;
  
        const [langRes, releaseRes] = await Promise.all([
          fetch(repo.languages_url, { headers: githubHeaders }),
          fetch(`https://api.github.com/repos/${username}/${repo.name}/releases/latest`, { headers: githubHeaders })
        ]);
  
        const langData = langRes.ok ? await langRes.json() : {};
        const languages = Object.keys(langData).join(', ') || 'Unknown';
  
        let latestRelease = 'None';
        if (releaseRes.ok) {
          const releaseJson = await releaseRes.json();
          if (releaseJson.tag_name) latestRelease = releaseJson.tag_name;
        }
  
        const createdAt = new Date(repo.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
  
        const embed = new EmbedBuilder()
          .setTitle(`📦 ${repo.full_name}`)
          .setURL(repo.html_url)
          .setDescription(repo.description || '*No description provided.*')
          .setColor(0x24292f)
          .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png')
          .addFields(
            { name: '👤 Author', value: repo.owner.login, inline: true },
            { name: '📝 License', value: repo.license?.name || 'None', inline: true },
            { name: '📅 Created', value: createdAt, inline: true },
            { name: '⭐ Stars', value: `${repo.stargazers_count}`, inline: true },
            { name: '🍴 Forks', value: `${repo.forks_count}`, inline: true },
            { name: '🛠️ Languages', value: languages, inline: true },
            { name: '🚀 Latest Release', value: latestRelease, inline: true },
            { name: '📂 Default Branch', value: repo.default_branch, inline: true },
            { name: '📦 Repository Size', value: formatSize(repo.size), inline: true },
            ...(repo.archived
              ? [
                  {
                    name: '⚠️ Archived',
                    value: 'This repository is archived and read-only.',
                    inline: false
                  }
                ]
              : [])
          )
          .setFooter({
            text: 'GitHub Stats • Made by @LachlanDev',
            iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
          })
          .setTimestamp();
  
        const backRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`back_${sessionId}`)
            .setLabel('⬅️ Back to Repos')
            .setStyle(ButtonStyle.Secondary)
        );
  
        await select.update({
          embeds: [embed],
          components: [backRow]
        });
      });
  
      const backCollector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
      });
  
      backCollector.on('collect', async (btn) => {
        if (btn.customId === `back_${sessionId}` && btn.user.id === interaction.user.id) {
          try {
            await btn.message.edit({
              embeds: [getPaginatedEmbed()],
              components: getPaginatedComponents()
            });
          } catch (err) {
            console.error('❌ Failed to return to repos view:', err);
            if (!btn.replied) {
              await btn.reply({ content: 'Something went wrong returning to the list.', ephemeral: true });
            }
          }
        }
      });
  
      const cleanup = async () => {
        try {
          await message.delete();
        } catch {}
      };
  
      collector.on('end', cleanup);
      menuCollector.on('end', cleanup);
      backCollector.on('end', cleanup);
    }
  };
  