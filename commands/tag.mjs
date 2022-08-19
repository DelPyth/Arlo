import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import BaseCommand from './base-command.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Cmd extends BaseCommand
{
	static name           = "tag";
	static description    = "Use a tag to send a custom preset message.";
	static usage          = "tag (<action: string> | <tag_name: string>)\n"
		+ "tag add <tag_name: string> <content: string>\n"
		+ "tag edit <tag_name: string> <content: string>\n"
		+ "tag remove <tag_name: string>\n"
		+ "tag clear\n"
		+ "tag list";
	static aliases        = [null];
	static config         = null;
	static rules = {
		delete_message:     true,
		owner_only:         false,
		nsfw_only:          false
	};

	static async init()
	{
		// Import database json file.
		try
		{
			// Just a precaution to make sure the folder exists as well as the file.
			if (!fs.existsSync(path.join(__dirname, '../database')))
			{
				fs.mkdirSync(path.join(__dirname, '../database'));
			}

			// Check if the file exists.
			if (fs.existsSync(path.join(__dirname, '../database/tag.json')))
			{
				// If it does, import the file.
				this.database = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/tag.json'), 'utf8'));
			}
			else
			{
				// If it doesn't, create the file and start fresh with a database.
				this.database = {};
				fs.writeFileSync(path.join(__dirname, '../database/tag.json'), "{}");
			}
		}
		catch(err)
		{
			console.error(err)
		}

		// Colors for success and error messages.
		this.error_color = "#B00020";
		this.success_color = "#198754";
		this.bot_color = "#FF9900";
	}

	static async exit()
	{
		// Save the database.
		fs.writeFileSync(path.join(__dirname, '../database/tag.json'), JSON.stringify(this.database));
	}

	static async run({message, args, config})
	{
		// If no arguments, show the usage.
		if (args.length == 0)
		{
			return message.channel.send("Usage: `" + this.usage + "`");
		}

		let action = args[0].toLowerCase();
		let tag_name = null;
		let content = null;
		let result;

		if (args.length > 1)
		{
			tag_name = args[1].toLowerCase();
		}

		if (args.length > 2)
		{
			content = args.splice(2);
		}

		// Fuck if switch statements work right?
		// I don't know if it was my own incompetence or that JS fucked me over with switch statements,
		// but I'm going to keep it as an if-else chain for now.
		if (action == "add")
		{
			// If the user has admin permissions, or if it's the bot owner, add the tag.
			if (!message.member.permissions.has("MANAGE_MESSAGES") || message.author.id != config.owner.id)
			{
				message.channel.send({embeds: [this.addEmbed("You do not have the proper role to add tags.", this.error_color).setTitle("Error")]});
				return false;
			}

			result = this.addTag(message, tag_name, content);
			if (!result)
			{
				return false;
			}

			message.channel.send({embeds: [this.addEmbed("Tag `" + tag_name + "` has been added.", this.success_color).setTitle("Success")]});
		}
		else if (action == "edit")
		{
			// If the user has admin permissions, or if it's the bot owner, edit the tag.
			if (!message.member.permissions.has("MANAGE_MESSAGES") || message.author.id != config.owner.id)
			{
				message.channel.send({embeds: [this.addEmbed("You do not have the proper role to edit tags.", this.error_color).setTitle("Error")]});
				return false;
			}

			result = this.editTag(message, tag_name, content);
			if (!result)
			{
				return false;
			}

			message.channel.send({embeds: [this.addEmbed("Tag `" + tag_name + "` has been edited.", this.success_color).setTitle("Success")]});
		}
		else if (action == "remove")
		{
			// If the user has admin permissions, or if it's the bot owner, remove the tag.
			if (!message.member.permissions.has("MANAGE_MESSAGES") || message.author.id != config.owner.id)
			{
				message.channel.send({embeds: [this.addEmbed("You do not have the proper role to remove tags.", this.error_color).setTitle("Error")]});
				return false;
			}

			result = this.removeTag(message, tag_name);
			if (!result)
			{
				return false;
			}

			message.channel.send({embeds: [this.addEmbed("Tag `" + tag_name + "` has been removed.", this.success_color).setTitle("Success")]});
		}
		else if (action == "clear")
		{
			// If the user has admin permissions, or if it's the bot owner, clear the tags.
			if (!message.member.permissions.has("MANAGE_MESSAGES") || message.author.id != config.owner.id)
			{
				message.channel.send({embeds: [this.addEmbed("You do not have the proper role to clear tags.", this.error_color).setTitle("Error")]});
				return false;
			}

			result = this.clearTags(message);
			if (!result)
			{
				return false;
			}

			message.channel.send({embeds: [this.addEmbed("All tags have been removed.", this.success_color).setTitle("Success")]});
		}
		else if (action == "list")
		{
			result = this.listTags(message);
			if (!result)
			{
				return false;
			}

			message.channel.send({embeds: [this.addEmbed(result, this.success_color).setTitle("These are the tags for this server.")]});
		}
		else
		{
			result = this.getTag(message, action);
			if (!result)
			{
				return false;
			}

			message.channel.send({embeds: [this.addEmbed(result, this.bot_color)]});
		}

		// EXIT_SUCCESS
		return true;
	}

	// Add tag to database if it doesn't already exist.
	static addTag(message, tag_name, content)
	{
		// If the tag wasn't provided, display an error.
		if (tag_name == null)
		{
			message.channel.send({embeds: [this.addEmbed("You must provide a tag name.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the current server doesn't have any tags, create an empty object.
		if (!(message.guild.id in this.database))
		{
			this.database[message.guild.id] = {};
		}

		// If the tag already exists, display an error.
		if (tag_name in this.database[message.guild.id])
		{
			message.channel.send({embeds: [this.addEmbed("A tag with that name already exists.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the content for the tag wasn't provided, display an error.
		if (!content)
		{
			message.channel.send({embeds: [this.addEmbed("You must specify content for the tag.", this.error_color).setTitle("Error")]});
			return false;
		}

		this.database[message.guild.id][tag_name] = content.join(' ');
		return true;
	}

	// Edit tag in database if it exists.
	static editTag(message, tag_name, content)
	{
		// If the tag wasn't provided, display an error.
		if (tag_name == null)
		{
			message.channel.send({embeds: [this.addEmbed("You must provide a tag name.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the tag doesn't exist, display an error.
		if (!(tag_name in this.database[message.guild.id]))
		{
			message.channel.send({embeds: [this.addEmbed("A tag with that name does not exist.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the content for the tag wasn't provided, display an error.
		if (!content)
		{
			message.channel.send({embeds: [this.addEmbed("You must specify content for the tag.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the content for the tag is the same as the current content, display an error.
		if (content.join(' ') == this.database[message.guild.id][tag_name])
		{
			message.channel.send({embeds: [this.addEmbed("The tag content is the same as the current content.", this.error_color).setTitle("Error")]});
			return false;
		}

		this.database[message.guild.id][tag_name] = content.join(' ');
		return true;
	}

	// Remove tag from database if it exists.
	static removeTag(message, tag_name)
	{
		// If the tag wasn't provided, display an error.
		if (tag_name == null)
		{
			message.channel.send({embeds: [this.addEmbed("You must specify a tag name.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the current server doesn't have any tags, create an empty object and display an error.
		if (!(message.guild.id in this.database))
		{
			this.database[message.guild.id] = {};
			message.channel.send({embeds: [this.addEmbed("There are no tags for this server.", this.error_color).setTitle("Error")]});
			return false;
		}

		// If the tag doesn't exist, display an error.
		if (!(tag_name in this.database[message.guild.id]))
		{
			message.channel.send({embeds: [this.addEmbed("A tag with that name does not exist.", this.error_color).setTitle("Error")]});
			return false;
		}

		delete this.database[message.guild.id][tag_name];
		return true;
	}

	// Clear all tags from database.
	static clearTags(message)
	{
		// If the current server doesn't have any tags, create an empty object and display an error.
		if (!(message.guild.id in this.database))
		{
			this.database[message.guild.id] = {};
			message.channel.send({embeds: [this.addEmbed("There are no tags for this server.", this.error_color).setTitle("Error")]});
			return false;
		}

		this.database[message.guild.id] = {};
		return true;
	}

	// List all tags for the server.
	static listTags(message)
	{
		// If the current server doesn't have any tags, create an empty object.
		if (!(message.guild.id in this.database))
		{
			this.database[message.guild.id] = {};
		}

		const tags = Object.keys(this.database[message.guild.id]);

		// If there are no tags, display an error.
		if (tags.length == 0)
		{
			message.channel.send({embeds: [this.addEmbed("There are no tags for this server.", this.error_color).setTitle("Error")]});

			// EXIT_FAILURE
			return false;
		}

		return "`" + tags.join(', ') + "`";
	}

	// Get tag content if it exists.
	static getTag(message, tag_name)
	{
		// If the current server doesn't have any tags, create an empty object and display an error.
		if (!(message.guild.id in this.database))
		{
			this.database[message.guild.id] = {};
			message.channel.send({embeds: [this.addEmbed("There are no tags for this server.", this.error_color).setTitle("Error")]});
		}

		// If the tag doesn't exist, display an error.
		if (!(tag_name in this.database[message.guild.id]))
		{
			message.channel.send({embeds: [this.addEmbed("A tag with that name does not exist.", this.error_color).setTitle("Error")]});
		}

		return this.database[message.guild.id][tag_name];
	}

	// Macro for adding an embed.
	static addEmbed(message, color)
	{
		return new EmbedBuilder()
			.setDescription(typeof(message) == "array" ? message.join(' ') : message)
			.setColor(color);
	}
};
