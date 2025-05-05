import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ComponentType
  } from 'discord.js';
  import fetch from 'node-fetch';
  import crypto from 'crypto';
  
  const githubHeaders = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'User-Agent': 'github-stats-bot' }
    : {};
  
  export default {
    data: new SlashCommandBuilder()
      .setName('search')
      .setDescription('GitHub search tools')
      .addSubcommand(sub =>
        sub
          .setName('repositories')
          .setDescription('Search GitHub repositories')
          .addStringOption(opt =>
            opt.setName('query').setDescription('Search query').setRequired(true)
          )
      ),
  
    async execute(interaction) {
      if (interaction.options.getSubcommand() !== 'repositories') return;
      await interaction.deferReply();
  
      // — STATE —
      const query     = interaction.options.getString('query', true);
      const sessionId = crypto.randomUUID();
      const perPage   = 10;
      let page        = 0;
      let viewState   = 'list';  // 'list' | 'detail' | 'sub'
      let detailRepo  = null;
      let issuesPage  = 0, prPage = 0, commitsPage = 0, relPage = 0;
      const issuesPer = 5, prPer = 5, commitsPer = 5, relPer = 5;
  
      // — FETCH SEARCH —
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=100`,
        { headers: githubHeaders }
      );
      if (!res.ok) return interaction.editReply('❌ Could not search repositories.');
      const items = (await res.json()).items || [];
      if (!items.length) return interaction.editReply('ℹ️ No repositories found.');
      const totalPages = Math.ceil(items.length / perPage);
  
      // — HELPERS —
      const formatSize = kb => {
        const units = ['KB','MB','GB','TB'];
        let idx = 0, sz = kb;
        while (sz >= 1024 && idx < units.length - 1) sz /= 1024, idx++;
        return `${sz.toFixed(2)} ${units[idx]}`;
      };
      const paginate = (arr, idx, per) => {
        const pages = Math.max(1, Math.ceil(arr.length / per));
        const start = idx * per;
        return { slice: arr.slice(start, start + per), pages, start };
      };
  
      // — LIST VIEW —
      const makeListEmbed = () => {
        const { slice } = paginate(items, page, perPage);
        return new EmbedBuilder()
          .setTitle(`🔍 Results for “${query}”`)
          .setDescription(
            slice.map((r,i) =>
              `**${page*perPage + i + 1}. [${r.full_name}](${r.html_url})**\n` +
              `⭐ ${r.stargazers_count} • 🍴 ${r.forks_count}\n` +
              `${r.description || '_No description._'}`
            ).join('\n\n')
          )
          .setFooter({ text: `Page ${page+1}/${totalPages}` })
          .setColor(0x24292f)
          .setTimestamp();
      };
      const makeListComponents = disabled => {
        const { slice } = paginate(items, page, perPage);
        return [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`select_${sessionId}`)
              .setPlaceholder('Select a repo')
              .setDisabled(disabled)
              .addOptions(slice.map(r => ({
                label: r.full_name,
                value: r.full_name
              })))
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
  
      // — DETAIL VIEW —
      const makeDetailEmbed = async r => {
        const [langRes, relRes] = await Promise.all([
          fetch(r.languages_url, { headers: githubHeaders }),
          fetch(`https://api.github.com/repos/${r.full_name}/releases/latest`, { headers: githubHeaders })
        ]);
        const langs = langRes.ok ? Object.keys(await langRes.json()).join(', ') : 'Unknown';
        let latest = 'None';
        if (relRes.ok) {
          const d = await relRes.json();
          if (d.tag_name) latest = d.tag_name;
        }
        const created = new Date(r.created_at).toLocaleDateString('en-US',{
          year:'numeric', month:'long', day:'numeric'
        });
        return new EmbedBuilder()
          .setTitle(`📦 ${r.full_name}`)
          .setURL(r.html_url)
          .setDescription(r.description || '_No description._')
          .addFields(
            { name:'👤 Author',         value:r.owner.login,        inline:true },
            { name:'📝 License',        value:r.license?.name||'None', inline:true },
            { name:'📅 Created',        value:created,               inline:true },
            { name:'⭐ Stars',          value:`${r.stargazers_count}`, inline:true },
            { name:'🍴 Forks',          value:`${r.forks_count}`,      inline:true },
            { name:'📂 Default Branch', value:r.default_branch,      inline:true },
            { name:'📦 Size',           value:formatSize(r.size),    inline:true },
            { name:'🚀 Latest Release', value:latest,                 inline:true },
            { name:'💻 Languages',      value:langs,                  inline:true }
          )
          .setColor(0x24292f)
          .setTimestamp();
      };
  
      // — BUTTON ROWS —
      const backToDetailRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`back_detail_${sessionId}`)
          .setLabel('⬅️ Back to Repo')
          .setStyle(ButtonStyle.Secondary)
      );
      const backToSearchRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`back_search_${sessionId}`)
          .setLabel('⬅️ Back to Search')
          .setStyle(ButtonStyle.Secondary)
      );
      const makeDetailButtons = () => {
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`tree_${sessionId}`).setLabel('📂 Tree').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`issues_${sessionId}`).setLabel('🐛 Issues').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`prs_${sessionId}`).setLabel('🔀 PRs').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`commits_${sessionId}`).setLabel('🔨 Commits').setStyle(ButtonStyle.Secondary)
        );
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`releases_${sessionId}`).setLabel('🏷️ Releases').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`langs_${sessionId}`).setLabel('💻 Languages').setStyle(ButtonStyle.Secondary),
          backToSearchRow.components[0]  // show Back to Search on detail
        );
        return [row1, row2];
      };
  
      // — SEND LIST —
      await interaction.editReply({
        embeds:    [makeListEmbed()],
        components: makeListComponents(false)
      });
      const message = await interaction.fetchReply();
  
      // — COLLECTORS —
      const btnCol  = message.createMessageComponentCollector({ componentType: ComponentType.Button, time:120000 });
      const menuCol = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time:120000 });
  
      btnCol.on('collect', async btn => {
        if (btn.user.id !== interaction.user.id) {
          return btn.reply({ content:'❌ Not for you.', ephemeral:true });
        }
  
        // LIST STATE
        if (viewState === 'list') {
          if (btn.customId === `prev_${sessionId}` || btn.customId === `next_${sessionId}`) {
            page = btn.customId === `prev_${sessionId}` ? page - 1 : page + 1;
            return btn.update({
              embeds:    [makeListEmbed()],
              components: makeListComponents(false)
            });
          }
          return;
        }
  
        // DETAIL STATE
        if (viewState === 'detail') {
          if (btn.customId === `back_search_${sessionId}`) {
            viewState = 'list';
            return btn.update({
              embeds:    [makeListEmbed()],
              components: makeListComponents(false)
            });
          }
          // enter subview
          if (/^(tree|issues|prs|commits|releases|langs)_/.test(btn.customId)) {
            viewState = 'sub';
          } else {
            return;
          }
        }
  
        // SUBVIEW STATE
        if (viewState === 'sub') {
          // back to detail
          if (btn.customId === `back_detail_${sessionId}`) {
            viewState = 'detail';
            const e = await makeDetailEmbed(detailRepo);
            return btn.update({ embeds: [e], components: makeDetailButtons() });
          }
  
          // TREE
          if (btn.customId === `tree_${sessionId}`) {
            const tRes = await fetch(
              `https://api.github.com/repos/${detailRepo.full_name}/git/trees/${detailRepo.default_branch}`,
              { headers: githubHeaders }
            );
            const tdata = await tRes.json();
            const entries = Array.isArray(tdata.tree)
              ? tdata.tree.filter(e=>!e.path.includes('/'))
              : [];
            const desc = entries.map(e=> e.type==='tree'? `📁 ${e.path}/` : `📄 ${e.path}`).join('\n')||'*Empty.*';
            const e = new EmbedBuilder()
              .setTitle(`📂 ${detailRepo.full_name}/`)
              .setDescription(desc)
              .setColor(0x24292f)
              .setTimestamp();
            return btn.update({ embeds: [e], components: [backToDetailRow] });
          }
  
          // ISSUES
          if (btn.customId.startsWith(`issues_`)) {
            if (!detailRepo._issues) {
              const r = await fetch(
                `https://api.github.com/repos/${detailRepo.full_name}/issues?state=open&per_page=100`,
                { headers: githubHeaders }
              );
              detailRepo._issues = (await r.json()).filter(i=>!i.pull_request);
            }
            const all = detailRepo._issues;
            if (btn.customId === `issues_prev_${sessionId}`) issuesPage = Math.max(issuesPage - 1, 0);
            if (btn.customId === `issues_next_${sessionId}`) issuesPage = Math.min(issuesPage + 1, Math.ceil(all.length / issuesPer) - 1);
            if (btn.customId === `issues_${sessionId}`) issuesPage = 0;
            const { slice, pages, start } = paginate(all, issuesPage, issuesPer);
            const e = new EmbedBuilder()
              .setTitle(`🐛 Issues (${issuesPage+1}/${pages})`)
              .setDescription(slice.map(i=>`**#${i.number}** [${i.title}](${i.html_url})`).join('\n\n')||'*None.*')
              .setFooter({ text:`Showing ${start+1}-${start+slice.length}/${all.length}` })
              .setColor(0xE74C3C)
              .setTimestamp();
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`issues_prev_${sessionId}`).setLabel('◀️').setDisabled(issuesPage===0).setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`back_detail_${sessionId}`).setLabel('⬅️ Back to Repo').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`issues_next_${sessionId}`).setLabel('▶️').setDisabled(issuesPage===pages-1).setStyle(ButtonStyle.Secondary)
            );
            return btn.update({ embeds: [e], components: [row] });
          }
  
          // PRs
          if (btn.customId.startsWith(`prs_`)) {
            if (!detailRepo._prs) {
              const r = await fetch(
                `https://api.github.com/repos/${detailRepo.full_name}/pulls?state=open&per_page=100`,
                { headers: githubHeaders }
              );
              detailRepo._prs = await r.json();
            }
            const all = detailRepo._prs;
            if (btn.customId === `prs_prev_${sessionId}`) prPage = Math.max(prPage - 1, 0);
            if (btn.customId === `prs_next_${sessionId}`) prPage = Math.min(prPage + 1, Math.ceil(all.length / prPer) - 1);
            if (btn.customId === `prs_${sessionId}`) prPage = 0;
            const { slice, pages, start } = paginate(all, prPage, prPer);
            const e = new EmbedBuilder()
              .setTitle(`🔀 PRs (${prPage+1}/${pages})`)
              .setDescription(slice.map(p=>`**#${p.number}** [${p.title}](${p.html_url})`).join('\n\n')||'*None.*')
              .setFooter({ text:`Showing ${start+1}-${start+slice.length}/${all.length}` })
              .setColor(0x7289DA)
              .setTimestamp();
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`prs_prev_${sessionId}`).setLabel('◀️').setDisabled(prPage===0).setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`back_detail_${sessionId}`).setLabel('⬅️ Back to Repo').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`prs_next_${sessionId}`).setLabel('▶️').setDisabled(prPage===pages-1).setStyle(ButtonStyle.Secondary)
            );
            return btn.update({ embeds: [e], components: [row] });
          }
  
          // COMMITS
          if (btn.customId.startsWith(`commits_`)) {
            if (!detailRepo._commits) {
              const r = await fetch(
                `https://api.github.com/repos/${detailRepo.full_name}/commits?per_page=100`,
                { headers: githubHeaders }
              );
              detailRepo._commits = await r.json();
            }
            const all = detailRepo._commits;
            if (btn.customId === `commits_prev_${sessionId}`) commitsPage = Math.max(commitsPage - 1, 0);
            if (btn.customId === `commits_next_${sessionId}`) commitsPage = Math.min(commitsPage + 1, Math.ceil(all.length / commitsPer) - 1);
            if (btn.customId === `commits_${sessionId}`) commitsPage = 0;
            const { slice, pages, start } = paginate(all, commitsPage, commitsPer);
            const e = new EmbedBuilder()
              .setTitle(`🔨 Commits (${commitsPage+1}/${pages})`)
              .setDescription(slice.map(c=>`• [${c.sha.slice(0,7)}](${c.html_url}) — ${c.commit.message.split('\n')[0]}`).join('\n\n')||'*None.*')
              .setFooter({ text:`Showing ${start+1}-${start+slice.length}/${all.length}` })
              .setColor(0x2ECC71)
              .setTimestamp();
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`commits_prev_${sessionId}`).setLabel('◀️').setDisabled(commitsPage===0).setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`back_detail_${sessionId}`).setLabel('⬅️ Back to Repo').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`commits_next_${sessionId}`).setLabel('▶️').setDisabled(commitsPage===pages-1).setStyle(ButtonStyle.Secondary)
            );
            return btn.update({ embeds: [e], components: [row] });
          }
  
          // RELEASES
          if (btn.customId.startsWith(`releases_`)) {
            if (!detailRepo._releases) {
              const r = await fetch(
                `https://api.github.com/repos/${detailRepo.full_name}/releases?per_page=100`,
                { headers: githubHeaders }
              );
              detailRepo._releases = await r.json();
            }
            const all = detailRepo._releases;
            if (btn.customId === `releases_prev_${sessionId}`) relPage = Math.max(relPage - 1, 0);
            if (btn.customId === `releases_next_${sessionId}`) relPage = Math.min(relPage + 1, Math.ceil(all.length / relPer) - 1);
            if (btn.customId === `releases_${sessionId}`) relPage = 0;
            const { slice, pages, start } = paginate(all, relPage, relPer);
            const e = new EmbedBuilder()
              .setTitle(`🏷️ Releases (${relPage+1}/${pages})`)
              .setDescription(slice.map(r=>`**${r.tag_name}** — ${new Date(r.published_at).toLocaleDateString()}`).join('\n\n')||'*None.*')
              .setFooter({ text:`Showing ${start+1}-${start+slice.length}/${all.length}` })
              .setColor(0xF1C40F)
              .setTimestamp();
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`releases_prev_${sessionId}`).setLabel('◀️').setDisabled(relPage===0).setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`back_detail_${sessionId}`).setLabel('⬅️ Back to Repo').setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId(`releases_next_${sessionId}`).setLabel('▶️').setDisabled(relPage===pages-1).setStyle(ButtonStyle.Secondary)
            );
            return btn.update({ embeds: [e], components: [row] });
          }
  
          // LANGUAGES
          if (btn.customId === `langs_${sessionId}`) {
            const r = await fetch(detailRepo.languages_url, { headers: githubHeaders });
            const data = await r.json();
            const desc = Object.entries(data).map(([l,b])=>`• **${l}**: ${b.toLocaleString()} bytes`).join('\n') || '*None.*';
            const e = new EmbedBuilder()
              .setTitle(`💻 Languages — ${detailRepo.full_name}`)
              .setDescription(desc)
              .setColor(0x3498DB)
              .setTimestamp();
            return btn.update({ embeds: [e], components: [backToDetailRow] });
          }
        }
      });
  
      menuCol.on('collect', async sel => {
        if (sel.user.id !== interaction.user.id) {
          return sel.reply({ content:'❌ Not for you.', ephemeral:true });
        }
        detailRepo = items.find(r=>r.full_name===sel.values[0]);
        viewState  = 'detail';
        issuesPage=prPage=commitsPage=relPage=0;
        const e = await makeDetailEmbed(detailRepo);
        return sel.update({ embeds:[e], components:makeDetailButtons() });
      });
  
      btnCol.on('end',    () => message.edit({ components: [] }).catch(()=>null));
      menuCol.on('end', () => message.edit({ components: [] }).catch(()=>null));
    }
  };
  