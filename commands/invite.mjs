import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';
import BaseCommand from './base-command.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Cmd extends BaseCommand
{
	static name           = "invite";
	static description    = "Get the invite link for this bot.";
	static usage          = "invite";
	static aliases        = null;
	static config         = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/say.json'), 'utf8'));
	static rules = {
		delete_message:     true,
		owner_only:         false,
		nsfw_only:          false
	};

	static async init()
	{
		return;
	}

	static async run({message, config})
	{
		const embed = new EmbedBuilder();
		embed.setAuthor({name: "Made by: " + config.owner.name, iconURL: config.owner.avatar, url: config.owner.url});
		embed.setDescription(config.bot.description);
		embed.setThumbnail(config.bot.avatar);
		embed.setColor(config.colors.bot);
		embed.setTitle("Invite this bot to your server!");
		embed.setURL(config.bot.invite);

		message.channel.send({embeds: [embed]});
		return true;
	}
};
