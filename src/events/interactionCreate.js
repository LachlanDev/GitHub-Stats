export default {
    name: 'interactionCreate',
    async execute(interaction) {
      if (!interaction.isChatInputCommand()) return;
  
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
  
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: '❌ There was an error executing this command.',
          ephemeral: true
        });
      }
    }
  };
  