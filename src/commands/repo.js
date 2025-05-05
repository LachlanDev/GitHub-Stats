import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import crypto from 'crypto';

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
    .addStringOption(opt =>
      opt.setName('username').setDescription('GitHub user/org').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('repo').setDescription('Repository name').setRequired(true)
    )
    .addBooleanOption(opt =>
      opt.setName('interactive')
         .setDescription('Include interactive buttons?')
         .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const username    = interaction.options.getString('username');
      const repoName    = interaction.options.getString('repo');
      const interactive = interaction.options.getBoolean('interactive') ?? true;
      const sessionId   = crypto.randomUUID();

      // fetch the repo
      const repoRes = await fetch(
        `https://api.github.com/repos/${username}/${repoName}`,
        { headers: githubHeaders }
      );
      if (!repoRes.ok) {
        return interaction.reply({ content: '❌ Repository not found.', ephemeral: true });
      }
      const currentRepo = await repoRes.json();

      // helper to format size in KB → MB etc
      const formatSize = kb => {
        const units = ['KB','MB','GB','TB'];
        let idx = 0, size = kb;
        while (size >= 1024 && idx < units.length - 1) {
          size /= 1024; idx++;
        }
        return `${size.toFixed(2)} ${units[idx]}`;
      };

      // build the main embed
      const makeDetailEmbed = async repo => {
        const [langRes, relRes] = await Promise.all([
          fetch(repo.languages_url, { headers: githubHeaders }),
          fetch(`https://api.github.com/repos/${repo.full_name}/releases/latest`, { headers: githubHeaders })
        ]);
        const languages = langRes.ok ? Object.keys(await langRes.json()).join(', ') : 'Unknown';
        let latestRelease = 'None';
        if (relRes.ok) {
          const d = await relRes.json();
          if (d.tag_name) latestRelease = d.tag_name;
        }
        const createdAt = new Date(repo.created_at).toLocaleDateString('en-US', {
          year:'numeric', month:'long', day:'numeric'
        });

        return new EmbedBuilder()
          .setTitle(`📦 ${repo.full_name}`)
          .setURL(repo.html_url)
          .setDescription(repo.description || '*No description provided.*')
          .addFields(
            { name: '👤 Author',         value: repo.owner.login,            inline: true },
            { name: '📝 License',        value: repo.license?.name || 'None', inline: true },
            { name: '📅 Created',        value: createdAt,                    inline: true },
            { name: '⭐ Stars',          value: `${repo.stargazers_count}`,    inline: true },
            { name: '🍴 Forks',          value: `${repo.forks_count}`,         inline: true },
            { name: '📂 Default Branch', value: repo.default_branch,          inline: true },
            { name: '📦 Size',           value: formatSize(repo.size),         inline: true },
            { name: '🚀 Latest Release', value: latestRelease,                 inline: true },
            ...(repo.archived
              ? [{ name: '⚠️ Archived', value: 'This repo is archived.', inline: false }]
              : []
            )
          )
          .setColor(0x24292f)
          .setFooter({
            text: 'GitHub Stats • Made by @LachlanDev',
            iconURL: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
          })
          .setTimestamp();
      };

      // non-interactive: just embed + link
      if (!interactive) {
        const embed   = await makeDetailEmbed(currentRepo);
        const linkRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('View on GitHub')
            .setStyle(ButtonStyle.Link)
            .setURL(currentRepo.html_url)
        );
        return interaction.reply({ embeds: [embed], components: [linkRow] });
      }

      // interactive mode: pagination state
      let issuesPage = 0, prPage = 0, commitsPage = 0, relPage = 0;
      const issuesPerPage  = 5, prPerPage = 5, commitsPerPage = 5, relPerPage = 5;

      // build button rows
      const makeDetailButtons = () => {
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`tree_${sessionId}`).setLabel('📂 Root').setStyle(ButtonStyle.Primary),
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

      const backRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Back to Repo').setStyle(ButtonStyle.Secondary)
      );

      // generic paginator
      const paginate = (all, idx, per) => {
        const pages = Math.max(1, Math.ceil(all.length / per));
        const start = idx * per;
        return { slice: all.slice(start, start + per), pages, start };
      };

      // send initial interactive embed
      const detailEmbed = await makeDetailEmbed(currentRepo);
      const message = await interaction.reply({
        embeds:    [detailEmbed],
        components: makeDetailButtons()
      });

      // collector for buttons
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
      });

      collector.on('collect', async btn => {
        if (btn.user.id !== interaction.user.id) {
          return btn.reply({ content: '❌ Not for you.', ephemeral: true });
        }

        // Back to repo
        if (btn.customId === `detail_${sessionId}`) {
          const e = await makeDetailEmbed(currentRepo);
          return btn.update({ embeds: [e], components: makeDetailButtons() });
        }

        // Tree view
        if (btn.customId === `tree_${sessionId}`) {
          const treeRes = await fetch(
            `https://api.github.com/repos/${currentRepo.full_name}/git/trees/${currentRepo.default_branch}`,
            { headers: githubHeaders }
          );
          const tdata = await treeRes.json();
          const root = Array.isArray(tdata.tree)
            ? tdata.tree
                .filter(i => !i.path.includes('/'))
                .sort((a, b) =>
                  a.type === b.type ? a.path.localeCompare(b.path) : a.type === 'tree' ? -1 : 1
                )
            : [];
          const lines = root.map(i => i.type === 'tree' ? `📁 ${i.path}/` : `📄 ${i.path}`);
          const e = new EmbedBuilder()
            .setTitle(`📂 ${currentRepo.full_name}/`)
            .setDescription(lines.join('\n') || '*Empty.*')
            .setColor(0x24292f)
            .setTimestamp();
          return btn.update({ embeds: [e], components: [backRow] });
        }

        // defer for pagination
        await btn.deferUpdate();

        // Issues pagination
        if (btn.customId.startsWith(`issues_`)) {
          if (!currentRepo._issues) {
            const r = await fetch(
              `https://api.github.com/repos/${currentRepo.full_name}/issues?state=open&per_page=100`,
              { headers: githubHeaders }
            );
            currentRepo._issues = (await r.json()).filter(i => !i.pull_request);
          }
          const all = currentRepo._issues;
          if (btn.customId === `issues_prev_${sessionId}`) issuesPage = Math.max(issuesPage - 1, 0);
          if (btn.customId === `issues_next_${sessionId}`) issuesPage = Math.min(issuesPage + 1, Math.ceil(all.length / issuesPerPage) - 1);
          if (btn.customId === `issues_${sessionId}`) issuesPage = 0;

          const { slice, pages, start } = paginate(all, issuesPage, issuesPerPage);
          const e = new EmbedBuilder()
            .setTitle(`🐛 Issues (Page ${issuesPage + 1}/${pages})`)
            .setDescription(slice.length
              ? slice.map(i => `**#${i.number}** [${i.title}](${i.html_url})`).join('\n\n')
              : '*No open issues.*'
            )
            .setFooter({ text: `Showing ${start + 1}-${start + slice.length}/${all.length}` })
            .setColor(0xE74C3C)
            .setTimestamp();
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`issues_prev_${sessionId}`).setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(issuesPage === 0),
            new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`issues_next_${sessionId}`).setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(issuesPage === pages - 1)
          );
          return btn.editReply({ embeds: [e], components: [row] });
        }

        // PRs pagination
        if (btn.customId.startsWith(`prs_`)) {
          if (!currentRepo._prs) {
            const r = await fetch(
              `https://api.github.com/repos/${currentRepo.full_name}/pulls?state=open&per_page=100`,
              { headers: githubHeaders }
            );
            currentRepo._prs = await r.json();
          }
          const all = currentRepo._prs;
          if (btn.customId === `prs_prev_${sessionId}`) prPage = Math.max(prPage - 1, 0);
          if (btn.customId === `prs_next_${sessionId}`) prPage = Math.min(prPage + 1, Math.ceil(all.length / prPerPage) - 1);
          if (btn.customId === `prs_${sessionId}`) prPage = 0;

          const { slice, pages, start } = paginate(all, prPage, prPerPage);
          const e = new EmbedBuilder()
            .setTitle(`🔀 PRs (Page ${prPage + 1}/${pages})`)
            .setDescription(slice.length
              ? slice.map(p => `**#${p.number}** [${p.title}](${p.html_url})`).join('\n\n')
              : '*No open PRs.*'
            )
            .setFooter({ text: `Showing ${start + 1}-${start + slice.length}/${all.length}` })
            .setColor(0x7289DA)
            .setTimestamp();
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`prs_prev_${sessionId}`).setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(prPage === 0),
            new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`prs_next_${sessionId}`).setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(prPage === pages - 1)
          );
          return btn.editReply({ embeds: [e], components: [row] });
        }

        // Commits pagination
        if (btn.customId.startsWith(`commits_`)) {
          if (!currentRepo._commits) {
            const r = await fetch(
              `https://api.github.com/repos/${currentRepo.full_name}/commits?per_page=100`,
              { headers: githubHeaders }
            );
            currentRepo._commits = await r.json();
          }
          const all = currentRepo._commits;
          if (btn.customId === `commits_prev_${sessionId}`) commitsPage = Math.max(commitsPage - 1, 0);
          if (btn.customId === `commits_next_${sessionId}`) commitsPage = Math.min(commitsPage + 1, Math.ceil(all.length / commitsPerPage) - 1);
          if (btn.customId === `commits_${sessionId}`) commitsPage = 0;

          const { slice, pages, start } = paginate(all, commitsPage, commitsPerPage);
          const e = new EmbedBuilder()
            .setTitle(`🔨 Commits (Page ${commitsPage + 1}/${pages})`)
            .setDescription(slice.length
              ? slice.map(c => `• [${c.sha.slice(0,7)}](${c.html_url}) — ${c.commit.message.split('\n')[0]}`).join('\n\n')
              : '*No commits.*'
            )
            .setFooter({ text: `Showing ${start + 1}-${start + slice.length}/${all.length}` })
            .setColor(0x2ECC71)
            .setTimestamp();
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`commits_prev_${sessionId}`).setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(commitsPage === 0),
            new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`commits_next_${sessionId}`).setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(commitsPage === pages - 1)
          );
          return btn.editReply({ embeds: [e], components: [row] });
        }

        // Releases pagination
        if (btn.customId.startsWith(`releases_`)) {
          if (!currentRepo._releases) {
            const r = await fetch(
              `https://api.github.com/repos/${currentRepo.full_name}/releases?per_page=100`,
              { headers: githubHeaders }
            );
            currentRepo._releases = await r.json();
          }
          const all = currentRepo._releases;
          if (btn.customId === `releases_prev_${sessionId}`) relPage = Math.max(relPage - 1, 0);
          if (btn.customId === `releases_next_${sessionId}`) relPage = Math.min(relPage + 1, Math.ceil(all.length / relPerPage) - 1);
          if (btn.customId === `releases_${sessionId}`) relPage = 0;

          const { slice, pages, start } = paginate(all, relPage, relPerPage);
          const e = new EmbedBuilder()
            .setTitle(`🏷️ Releases (Page ${relPage + 1}/${pages})`)
            .setDescription(slice.length
              ? slice.map(r => `**${r.tag_name}** — ${new Date(r.published_at).toLocaleDateString()}`).join('\n\n')
              : '*No releases.*'
            )
            .setFooter({ text: `Showing ${start + 1}-${start + slice.length}/${all.length}` })
            .setColor(0xF1C40F)
            .setTimestamp();
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`releases_prev_${sessionId}`).setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(relPage === 0),
            new ButtonBuilder().setCustomId(`detail_${sessionId}`).setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`releases_next_${sessionId}`).setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(relPage === pages - 1)
          );
          return btn.editReply({ embeds: [e], components: [row] });
        }

        // Languages view
        if (btn.customId === `langs_${sessionId}`) {
          const langRes = await fetch(currentRepo.languages_url, { headers: githubHeaders });
          const ldata   = await langRes.json();
          const desc = Object.entries(ldata)
            .map(([l,b]) => `• **${l}**: ${b.toLocaleString()} bytes`)
            .join('\n') || '*No data.*';
          const e = new EmbedBuilder()
            .setTitle(`💻 Languages — ${currentRepo.full_name}`)
            .setDescription(desc)
            .setColor(0x3498DB)
            .setTimestamp();
          return btn.editReply({ embeds: [e], components: [backRow] });
        }
      });

      // hide buttons on timeout
      collector.on('end', () => {
        message.edit({ components: [] }).catch(() => null);
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
    }
  }
};
