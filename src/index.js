import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config(); // Load .env

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`file://${path.join(commandsPath, file)}`);
    client.commands.set(command.default.data.name, command.default);
}

// Load Events
const eventsPath = path.resolve('./events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = await import(`file://${path.join(eventsPath, file)}`);
    if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

// Register Slash Commands (guild + global)
async function registerCommands() {
  const commands = client.commands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🔁 Registering slash commands...');

    // Guild-specific (for testing/dev)
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Guild commands registered to ${process.env.GUILD_ID}`);
    }

    // Global registration (for production)
    if (process.env.ENVIRONMENT !== 'dev') {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Global commands registered');
    }
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
}

// Start Bot
await registerCommands();
client.login(process.env.TOKEN);
