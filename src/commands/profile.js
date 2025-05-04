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
      .setName('profile')
      .setDescription('Get a GitHub user profile.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      const username = interaction.options.getString('username');
      const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
  
      const res = await fetch(url, { headers: githubHeaders });
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
          { name: '⭐ Followers', value: `${data.followers}`, inline: true },
          { name: '👥 Following', value: `${data.following}`, inline: true },
          ...(data.company ? [{ name: '🏢 Company', value: data.company, inline: true }] : []),
          ...(data.email ? [{ name: '📬 Email', value: data.email, inline: true }] : []),
          ...(data.public_gists ? [{
            name: '📓 Public Gists',
            value: `${data.public_gists}`,
            inline: true
          }] : []),
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
  
      await interaction.reply({ embeds: [embed], components: [buttonRow] });
    }
  };
  