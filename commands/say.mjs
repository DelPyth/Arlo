import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import BaseCommand from './base-command.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Cmd extends BaseCommand
{
	static name           = "say";
	static description    = "Repeat a message.";
	static usage          = "say [message: string]";
	static aliases        = ["echo"];
	static config         = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/say.json'), 'utf8'));
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

	static async run({message, args})
	{
		// If they didn't say anything, use a random message.
		if (args.length == 0)
		{
			const random_message = this.chooseRandom(this.config.messages);
			message.channel.send(random_message);
			return;
		}

		// Otherwise, use the message they said.
		message.channel.send(args.join(" "));

		// EXIT_SUCCESS
		return true;
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
