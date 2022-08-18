/**
 * @name BaseCommand
 * @description The base command class.
 * @author TopHatCat
 * @version 1.0.0
*/
/*
	You must extend this class to create a new command.
	Override the `run` method to define the command's behavior.
	It's not required, but the command should return a boolean value of true if the command was run successfully.
*/
export default class BaseCommand
{
	/** @type {string} The name of the command. This is what is (soon to be) the command text required to run it. */
	static name           = null;
	/** @type {string} A description of what the command does. Do not include examples. */
	static description    = null;
	/** @type {string} The usage of how to run the command. Not the example. */
	static usage          = null;
	/** @type {string[]} The other names for the command in case it's a common command to run. */
	static aliases        = [null];
	/** @type {Object} Config stuff for the current command. */
	static config         = {};
	/** @type {Object} Rules simplified into a single object for better clarity. */
	static rules = {
		/** @type {boolean} Whether to delete the user's message or not for the command. */
		delete_message:     false,
		/** @type {boolean} Whether the command can only be used by owner or not. */
		owner_only:         false,
		/** @type {boolean} Whether the command can only be used in an nsfw channel or not. */
		nsfw_only:          false,
		/** @type {boolean} Whether the command needs information such as the command list and the bot's config. */
		internals_required: false
	};

	/**
	 * @name init
	 * @description Initializes the command. Use this to create a connection for web scrapers, open a handle for a file, or manage config stuff before the command is ran.
	 * @note Only runs once.
	*/
	static init()
	{
		return;
	}

	/**
	 * @name run
	 * @description Runs the command.
	 * @param {Discord.Message} message The message that triggered the command.
	 * @param {string[]} args The arguments that were passed to the command.
	 * @param {Object} commands `rules.internals_required` must be true. The commands list of the bot.
	 * @param {Object} config `rules.internals_required` must be true. The config object of the bot.
	 * @note Runs every time the command is ran.
	*/
	static async run(message, args)
	{
		throw new Error("Command not implemented.");
	}
};
