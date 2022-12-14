import * as fs from 'fs';
import * as path from 'path';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEV_LEVEL_NONE = 0;
const DEV_LEVEL_INFO = 1;
const DEV_LEVEL_WARN = 2;
const DEV_LEVEL_ALL  = 3;

class Arlo
{
	constructor()
	{
		this.name         = "Arlo";
		this.version      = "0.1.0";
		this.description  = "A simple, no permission bot to do basic and tedious everyday tasks. Need help? Use `~help`.";
		this.commands     = {};
		this.config       = {};
		this.aliases      = {};
		this.config_file  = "./config/base.json";
		this.debug_level  = DEV_LEVEL_INFO;
	}

	debug(...args)
	{
		if (this.debug_level >= DEV_LEVEL_NONE)
		{
			return console.log(...args);
		}
	}

	init()
	{
		// So the program will not close instantly (?)
		process.stdin.resume();

		// Handle when the program closes automatically.
		process.on('exit', this.disconnect.bind(this));

		// Handle Ctrl+C.
		process.on('SIGINT', this.disconnect.bind(this));

		// Catches "kill pid" (for example: nodemon restart)
		process.on('SIGUSR1', this.disconnect.bind(this));
		process.on('SIGUSR2', this.disconnect.bind(this));

		// Catches uncaught exceptions
		process.on('uncaughtException', this.disconnect.bind(this));

		this.handleCmdArgs(process.argv.slice(2));
		this.loadConfig();
		this.loadCommands();
		this.connect();
		this.setupEvents();
	}

	loadConfig()
	{
		// Read the config file.
		this.config = JSON.parse(fs.readFileSync(this.config_file, "utf8"));
	}

	loadCommands()
	{
		this.debug("Loading commands and aliases...");
		fs.readdirSync(path.join(__dirname, "commands")).forEach(async (file) =>
		{
			// Ignore inactive commands.
			if (file.startsWith('_'))
			{
				return;
			}

			// Ignore non-js files.
			// This is to prevent problems with loading configs as commands or for documentation being loaded.
			if (!(file.endsWith(".js") || file.endsWith(".mjs")))
			{
				return;
			}

			// Ignore the base command file.
			// This file is used as a skeleton for the other commands.
			// It is not meant to be used as a command itself.
			if (file.toLowerCase() == 'base-command.mjs')
			{
				return;
			}

			let cmd = await import("./commands/" + file)
			this.commands[cmd.default.name] = cmd.default;
			this.commands[cmd.default.name].init();

			if ('aliases' in this.commands[cmd.default.name])
			{
				if (this.commands[cmd.default.name].aliases != null)
				{
					for (let i = 0; i < this.commands[cmd.default.name].aliases.length; i++)
					{
						if (this.commands[cmd.default.name].aliases[i] in this.aliases)
						{
							console.error("Duplicate alias command: " + this.commands[cmd.default.name].aliases[i]);
							continue;
						}

						this.aliases[this.commands[cmd.default.name].aliases[i]] = cmd.default.name;
					}
				}
			}
			this.debug(`  - \x1b[38;5;4m${cmd.default.name}\x1b[38;5;15m`);
		});
	}

	connect()
	{
		// IDEA: Possibly let config do this?
		this.client = new Client(
		{
			intents:
			[
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.MessageContent
			]
		});
		this.client.login(this.config.token);
	}

	setupEvents()
	{
		// Error Logging
		this.client.on('error', (e) =>
		{
			this.debug(e)
		});

		if (this.debug_level >= DEV_LEVEL_WARN)
		{
			// Warn Logging
			this.client.on('warn', (e) =>
			{
				this.debug(e)
			});
		}

		// comment the below one out when not using it to debug
		if (this.debug_level == DEV_LEVEL_ALL)
		{
			this.client.on('debug', (e) =>
			{
				this.debug(e)
			});
		}

		// Upon losing client connection...
		process.on('unhandledRejection', (error) =>
		{
			this.debug('Unhandled promise rejection:', error)
		});

		// Handle messages sent in chat.
		this.client.on("messageCreate", this.handleMessage.bind(this));

		// Upon client connection...
		this.client.once("ready", () =>
		{
			console.log(`[ \x1b[38;5;2m%s\x1b[38;5;15m ] Logged in as ${this.client.user.tag}.`, "???");
		});
	}

	handleMessage(message)
	{
		// Ignore messages from bots.
		if (message.author.bot)
		{
			return;
		}

		// Ignore messages from DMs.
		if (message.channel.type == "dm")
		{
			return;
		}

		// Check if the message doesn't start with the prefix then cancel.
		if (!message.content.startsWith(this.config.prefix))
		{
			return;
		}

		// Get the command name and the arguments.
		// For now, I'll just use space as the delimiter.

		// Ideas:
		// - Split the message by commas with escaping.
		// - Make command work in the style of a function:  ping() || say("Hello world.") || help(ping)
		const args = message.content.slice(this.config.prefix.length).split(/ +/);
		const command_name = args.shift().toLowerCase();

		let cmd = null;

		// Check if the command exists as an standard commmand or an alias.
		if (command_name in this.commands)
		{
			cmd = this.commands[command_name];
		}
		else if (command_name in this.aliases)
		{
			cmd = this.commands[this.aliases[command_name]];
		}
		else
		{
			// Otherwise display an error.
			const embed = new EmbedBuilder();
			embed.setTitle("Unknown Command: `" + command_name + '`');
			embed.setDescription("I do not know of this command, nor is this an alias for an existing command.\n"
				+ "Possibly check your spelling or if this exists regardless.\n"
				+ "Use `" + this.config.prefix + "help` to look for the command you want.");
			embed.setColor(this.config.colors.error);

			message.channel.send({embeds: [embed]});
			return;
		}

		// Check if the command requires to be the owner of the bot.
		if (cmd.rules.owner_only && message.author.id != this.config.owner.id)
		{
			message.channel.send(`You must be the owner of the bot to use this command.`);
			return;
		}

		// Check if the command requires to be ran only in an nsfw channel.
		if (cmd.rules.nsfw_only && !message.channel.nsfw)
		{
			return;
		}

		// Give every item via an object so no value is lost.
		cmd.run({
			message:    message,
			args:       args,
			commands:   this.commands,
			config:     this.config
		});

		// Log the command
		if (this.debug_level >= DEV_LEVEL_INFO)
		{
			console.log(`[${message.guild.name}] \x1b[38;5;1m${message.author.tag}\x1b[38;5;15m (\x1b[38;5;2m${message.author.id}\x1b[38;5;15m) ran command \x1b[38;5;12m${cmd.name}\x1b[38;5;15m%s\x1b[38;5;15m`, args.length ? ` with arguments \x1b[38;5;11m${JSON.stringify(args)}` : '');
		}

		// Attempt to delete the message. If the bot doesn't have permissions to delete the message, it will fail silently and continue on.
		if (cmd.rules.delete_messages)
		{
			try
			{
				message.delete();
			}
			catch (e) {}
		}
	}

	disconnect()
	{
		try
		{
			this.client.destroy();
		}
		catch (e) {}

		let cmds = Object.getOwnPropertyNames(this.commands);
		for (let i = 0; i < cmds.length; i++)
		{
			if (typeof(this.commands[cmds[i]].exit) == "function")
			{
				this.commands[cmds[i]].exit();
			}
		}
		process.exit();
	}

	handleCmdArgs(args)
	{
		for (let i = 0; i < args.length; i++)
		{
			switch (args[i])
			{
				case "--debug":
				{
					this.debug_level = DEV_LEVEL_ALL;
					break;
				}
				case "--help":
				{
					this.printHelp();
					process.exit(0);
					break;
				}
				default:
				{
					this.debug("Unknown argument: " + args[i]);
				}
			}
		}
	}

	printHelp()
	{
		console.log("Usage:");
		console.log("\tnode index.mjs [--help] [--debug]");
		console.log("\tnode . [--help] [--debug]");
		console.log("Flags:");
		console.log("\t--help        Show this help message.");
		console.log("\t--debug       Enable debug mode.");
	}
};

const bot = new Arlo()
bot.init();
