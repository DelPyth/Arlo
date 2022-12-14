import fs from 'fs';
import path from 'path';
import request from 'request';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';
import BaseCommand from './base-command.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Cmd extends BaseCommand
{
	static name           = "cat";
	static description    = "Display a random cat from the internet.";
	static usage          = "cat";
	static aliases        = ["kitty"];
	static config         = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/cat.json'), 'utf8'));
	static rules = {
		delete_message:     false,
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
		const failure_message = this.chooseRandom(this.config.failure.messages);
		const success_message = this.chooseRandom(this.config.success.messages);

		// Get a random cat from the internet.
		request.get({url: 'http://aws.random.cat/meow', json: true, headers: {'User-Agent': 'request'}}, function(err, res, body)
		{
			// If there was an error, send a message to the channel saying it couldn't do it and just cancel.
			if (err)
			{
				message.channel.send("I couldn't get a cat!");
				return;
			}

			// If the status code is not 200, log it and cancel.
			if (res.statusCode !== 200)
			{
				console.log('Status:', res.statusCode);
				message.channel.send(failure_message);
				return;
			}

			// If the image couldn't be used, either by error or because the website is down, just stop.
			if (!('file' in body) || (body.file == undefined))
			{
				return;
			}

			message.channel.send({embeds: [new EmbedBuilder().setColor("#ff9900").setTitle(success_message).setImage(body.file)]});
			return;
		});

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
