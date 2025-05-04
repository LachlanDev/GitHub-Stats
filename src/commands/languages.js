import {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder
  } from 'discord.js';
  import fetch from 'node-fetch';
  import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
  import { config } from 'dotenv';
  
  config();
  
  const githubHeaders = process.env.GITHUB_TOKEN
    ? {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'github-stats-bot'
      }
    : {};
  
  function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
  
  const chartCanvas = new ChartJSNodeCanvas({ width: 800, height: 500 });
  
  export default {
    data: new SlashCommandBuilder()
      .setName('languages')
      .setDescription('Aggregates all languages used across a user\'s public GitHub repositories.')
      .addStringOption(option =>
        option.setName('username')
          .setDescription('GitHub username')
          .setRequired(true)
      ),
  
    async execute(interaction) {
      await interaction.deferReply();
  
      const username = interaction.options.getString('username');
  
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
      const sorted = sortedArray.map(([lang, bytes]) => `**${lang}** — ${formatSize(bytes)}`);
  
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
                labels: {
                  color: '#ffffff'
                }},
            title: {
              display: false,
              text: `Language Usage for ${username}`
            }
          }
        }
      });
  
      const chartAttachment = new AttachmentBuilder(chartBuffer, { name: 'language-pie-chart.png' });
      embed.setImage('attachment://language-pie-chart.png');
  
      await interaction.editReply({ embeds: [embed], files: [chartAttachment] });
    }
  };
  