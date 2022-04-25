//============================================================
//
// Salty Simulations Discord Bot
// Author: saltysimulations
// URL: https://github.com/owen2007/Salty-Simulations-Discord-Bot/
// Date: 2022-04-25
// Version: 0.0.1
// License: AGPLv3
//
// Source based on:
// FlyByWire Discord Bot
// Author: flybywire
// URL: https://github.com/flybywiresim/discord-bot/
//
//============================================================
//
// This is the main file for the bot. It is responsible for
// setting up a discord.js bot client, importing and
// configuring all required modules, and loading all
// categories & commands.
//
//============================================================



// Import libraries
import Discord from 'discord.js';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import 'dotenv/config';
import 'process';

// Enter app directory
process.chdir(__dirname);

// Create discord.js client
const intents = new Discord.Intents();
intents.add(
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
);

const client = new Discord.Client({
    intents: intents
});

// Import config
import config from './config';

// Database connections
//TODO: None actually here yet lmao

// Load all event handlers
let eventList: string[] = fs.readdirSync('./events');

for (const file of eventList)
{
    // Load event
    const event = require(`./events/${file}`); 

    // Assign handler
    if(event.once)
    {
        client.once(event.event, function(...args: any[]) { event.run(client, ...args)});
    }
    else
    {
        client.on(event.event, function(...args: any[]) { event.run(client, ...args)});
    }
}

// Load all commands
let categoryList: string[] = fs.readdirSync('./commands');
let commands: any = {};
let commandAliases: any = [];

for(const cat of categoryList)
{
    // Load category
    const commandList: string[] = fs.readdirSync(`./commands/${cat}`);

    for(const file of commandList)
    {
        // Load command
        const command = require(`./commands/${cat}/${file}`).command;

        console.log(`Loaded command ${command.id}`);

        // Assign command
        if(Array.isArray(command.name))
        {
            // Command has aliases
            for(const name of command.name)
            {
                commands[name] = command;
                commands[name].alias = true;
            }
        }
        else
        {
            commands[command.name] = command;
        }

        commandAliases.push({ id: command.id, names: command.name });
    }
}

client.on('messageCreate', async function(message: Discord.Message) {
    // If message from a bot, ignore
    if(message.author.bot)
    {
        console.log("Bailing, message was from a bot");
        return;
    }

    // If message doesn't start with prefix, ignore
    if(message.content.indexOf(config.prefix) !== 0)
    {
        console.log("Bailing, message didn't start with prefix");
        return;
    }

    // If channel is a DM, ignore
    if(message.channel.type === 'DM')
    {
        console.log("Bailing, message was from a DM");
        return;
    }

    // Get command
    const args: string[] = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const commandReq = sanitize(args.shift().toLowerCase());

    try
    {
        // Run command
        const command = commands[commandReq];

        if(command)
        {
            await command.run(client, message, args);
        }
        else
        {
            message.reply(`Command \`${commandReq}\` not found!`);
        }
    }
    catch (err)
    {
        console.log(err);

        message.reply(`An error occurred while running command \`${commandReq}\`!`);
    }
});

// Set up error listening
client.on('warn', console.warn);
client.on('error', console.error);

// Login to discord
client.login(process.env.DISCORD_TOKEN);