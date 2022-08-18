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
		nsfw_only:          false,
		internals_required: true
	};

	static async init()
	{
		// Instance variables section.
		// Stuff such as a saved value in between command executions.
		this.cached_index = 0;
	}

	static async run(message, args, commands, config)
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
			// EXIT_FAILURE
			return false;
		}

		// Otherwise, send the help message.
		const embed = new EmbedBuilder();
		embed.setTitle(command.name);
		embed.setColor("#ff9900");
		embed.setAuthor({name: config.owner.name, iconURL: config.owner.avatar});
		embed.setDescription(command.description);
		embed.addFields({name: "Usage", value: '```\n' + config.prefix + command.usage + '\n```'});
		let param_doc = "`<variable: type>` Required.\n";
			param_doc += "`[variable: type]` Optional.\n";
			param_doc += "`{variable: type}` URI-like flags separated by semicolons (`name=George;age=24;message=Hello world!`). Optional.";

		embed.addFields({name: "Documentation:", value: param_doc});
		// embed.addField("Aliases", command.aliases.join(", "));
		embed.setFooter({text: "Developed by " + config.owner.name});
		message.channel.send({embeds: [embed]});

		// EXIT_SUCCESS
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
			embed.addFields({name: commands[cmds[i]].usage, value: commands[cmds[i]].description});
		}
		embed.setFooter({text: "Developed by " + config.owner.name});
		return embed;
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
};
