# Arlo
The lightweight, simple, and "no moderation" bot. Designed purely to send messages based on a command you gave. That's it.

# Commands
The following commands are already made for you. Here's a quick legend:
- `<variable: type>` Required.
- `[variable: type]` Optional.
- `{variable: type}` URI-like flags separated by semicolons (`name=George;age=24;message=Hello world!`). Optional.

| Name   | Usage                     |
| ------ | ------------------------- |
| bunny  | `~bunny`                  |
| cat    | `~cat`                    |
| dog    | `~dog`                    |
| fox    | `~fox`                    |
| help   | `~help [command: string]` |
| say    | `~say [message: string]`  |

# Setup and Running the Bot
If you so choose to download this repository (or clone it) and use it as your own, you must to the following:
- Open `config/base-example.jsonc` and read though the header entirely.
- Install the required dependencies.
- Use `node .` in a console to start your bot.

# To Do
- [x] Add fox command for random fox picture.
- [x] Add bunny command for random bunny picture.
- [x] Add help command.
- [ ] Possibly add pony command for random pony picture (maybe? Debatable).
- [ ] Add dictionary command.
- [ ] Add thesaurus command.
- [x] Add tag command.
	- `ADD` subcommand to add new tag.
	- `REMOVE` subcommand to remove created tag.
	- `LIST` subcommand to show tags.
	- `EMPTY` subcommand to empty all tags from the current server.
	- `EDIT` subcommand to modify existing tag.
- [ ] Add bug report command.

# Code Styling
My style of code is done with 4 tab indentation, Allman style bracket/indentation, and the following styling:
```
file-names.txt
ClassNames
functionNames
CONSTANT_VARIABLES
normal_variables
```
