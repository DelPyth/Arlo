import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';
import BaseCommand from './base-command.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Cmd extends BaseCommand
{
	static name           = "help";
	static description    = "Get help on a command. Or list all commands.";
	static usage          = "help [command: string]";
	static aliases        = ["helpme", "?"];
	static config         = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/help.json'), 'utf8'));
	static rules = {
		delete_message:     true,
		owner_only:         false,
		nsfw_only:          false
	};

	static async init()
	{
		// Instance variables section.
		// Stuff such as a saved value in between command executions.
		this.cached_index = 0;
	}

	static async run({message, args, commands, config})
	{
		// If they didn't give us any arguments, list the available commands.
		if (args.length == 0)
		{
			message.channel.send({embeds: [this.generateHelpMessage(commands, config)]});
			return;
		}

		// Otherwise, get the command they want help with.
		const command = this.findCommand(args[0], commands);
		if (!command)
		{
			const failure_message = this.chooseRandom(this.config.messages);
			message.channel.send(failure_message);
			return false;
		}

		// Otherwise, send the help message.
		const embed = new EmbedBuilder();
		embed.setTitle(command.name);
		embed.setColor("#ff9900");
		embed.setAuthor({name: config.owner.name, iconURL: config.owner.avatar});

		if (command.usage == null || command.usage === undefined)
		{
			message.channel.send({embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription("This command doesn't have documentation! Contact the developer to fix this!")]});
			return false;
		}

		let description = command.description;

		switch (typeof(command.usage))
		{
			case "string":
			{
				description += '\n```\n' + config.prefix + command.usage + '\n```'
				break;
			}
			case "object":
			{
				let obj = {};

				if ('simple' in command.usage)
				{
					obj.name = '`' + command.usage.simple + '`'
				}
				if ('complex' in command.usage)
				{
					obj.value = '```\n'
					for (let i = 0; i < command.usage.complex.length; i++)
					{
						obj.value += command.usage.complex[i] + '\n';
					}
					obj.value += '\n```';
				}
				embed.addFields(obj);
				break;
			}
		}
		embed.setDescription(description);

		embed.addFields({name: "Documentation:", value: "`<variable: type>` Required parameter.\n"
			+ "`[variable: type]` Optional parameter.\n"
			+ "`{variable: type}` URI-like flags separated by semicolons. Optional."
		});

		if (command.aliases != null)
		{
			embed.addFields({name: "Aliases", value: '`' + command.aliases.join(", ") + '`'});
		}
		embed.setFooter({text: "Developed by " + config.owner.name});
		message.channel.send({embeds: [embed]});
		return true;
	}

	static generateHelpMessage(commands, config)
	{
		const embed = new EmbedBuilder();
		embed.setTitle("Available Commands");
		embed.setColor("#ff9900");
		embed.setDescription("Use `" + config.prefix + "help <command>` to get more information on a command.");
		let cmds = Object.getOwnPropertyNames(commands);
		for (let i = 0; i < cmds.length; i++)
		{
			switch (typeof(commands[cmds[i]].usage))
			{
				case "string":
				{
					embed.addFields({name: '`' + config.prefix + commands[cmds[i]].usage + '`', value: commands[cmds[i]].description});
					break;
				}
				case "object":
				{
					if ('simple' in commands[cmds[i]].usage)
					{
						embed.addFields({name: '`' + config.prefix + commands[cmds[i]].usage.simple + '`', value: commands[cmds[i]].description});
					}
					else
					{
						continue;
					}
					break;
				}
			}
		}
		embed.setFooter({text: "Developed by " + config.owner.name});
		return embed;
	}

	static findCommand(name, commands)
	{
		let cmds = Object.getOwnPropertyNames(commands);
		for (let i = 0; i < cmds.length; i++)
		{
			if (commands[cmds[i]].name == name)
			{
				return commands[cmds[i]];
			}
		}
		return null;
	}

	static chooseRandom(array)
	{
		let rando = Math.floor(Math.random() * array.length);
		if (rando == this.cached_index)
		{
			rando = (rando + 1) % array.length;
		}
		this.cached_index = rando;

		return array[rando];
	}
};
