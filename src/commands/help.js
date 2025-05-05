import {
    SlashCommandBuilder,
    EmbedBuilder
  } from 'discord.js';
  
  export default {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show clickable help for all commands'),
  
    async execute(interaction) {
      // 1. FETCH: use guild commands if available, else global.
      const appCommands = interaction.guild
        ? await interaction.guild.commands.fetch()
        : await interaction.client.application.commands.fetch();
  
      // 2. Helper to mention (subcommand or top-level)
      //    Format: </name sub:commandId>  or </name:commandId>
      function mention(cmdName, subName) {
        const cmd = appCommands.find(c => c.name === cmdName);
        if (!cmd) return `\`${cmdName}${subName? ' '+subName: ''}\``;
        if (subName) {
          // subcommand mention
          return `</${cmdName} ${subName}:${cmd.id}>`;
        }
        // top-level mention
        return `</${cmdName}:${cmd.id}>`;
      }
  
      // 3. Build help lines
      const lines = [
        '**Users:**',
        `• ${mention('user','profile')} — View a GitHub user profile.`,
        `• ${mention('user','followers')} — View followers of a GitHub user.`,
        `• ${mention('user','following')} — View who a GitHub user is following.`,
        `• ${mention('user','statistics')} — Summary stats about a GitHub user.`,
        `• ${mention('user','repos')} — List public repositories for a GitHub user.`,
        `• ${mention('user','languages')} — Aggregated language usage across all public repositories.`,
        `• ${mention('user','activity')} — Show recent public GitHub activity from a user.`,
        `• ${mention('user','stars')} — List repositories starred by a GitHub user.`,
        `• ${mention('user','gists')} — List public gists for a GitHub user.`,
        `• ${mention('user','organizations')} — List organizations a GitHub user belongs to.`,
        '',
        '**Repository:**',
        `• ${mention('repo')} — Get details about a GitHub repository (usage: /repo [username] [repo]).`,
        '',
        '**Search:**',
        `• ${mention('search','repositories')} — Search GitHub repositories.`,
      ];
  
      // 4. Send embed
      const embed = new EmbedBuilder()
        .setTitle('📖 GitHub Stats Bot — Help')
        .setDescription(lines.join('\n'))
        .setColor(0x24292f)
        .setTimestamp();
  
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  };
  