"use strict"
const { isSlash, isInteractionCallbackResponse } = require(`../../utils/appCmdHelp.js`)
const getBotInviteUrl = require(`../../utils/botInvite.js`)
const { ApplicationCommandType, ApplicationCommandOptionType } = require(`discord.js`)
/**
 * 	Displaying all the available commands. Complete with the usage.
 * 	@author klerikdust
 */
module.exports = {
	name: `help`,
	aliases: [`help`, `help`, `cmdhelp`],
	description: `Displaying all the available commands. Complete with the usage.`,
	usage: `help <Category/CommandName>(Optional)`,
	permissionLevel: 0,
	multiUser: false,
	applicationCommand: true,
	options: [
		{
			name: `search`,
			description: `query the commands by name`,
			type: ApplicationCommandOptionType.Subcommand,
			options: [{
				name: `command`,
				description: `command name you would like to search`,
				type: ApplicationCommandOptionType.String,
				required: true
			}]
		}, {
			name: `commands`,
			description: `Show all commands available`,
			type: ApplicationCommandOptionType.Subcommand
		}
	],
	type: ApplicationCommandType.ChatInput,
	messageCommand: true,
	server_specific: false,
	commandpediaButton: `📖`,
	ignoreGroups: [`developer`, `custom`],
	async Iexecute(client, reply, interaction, options, locale) {
		const subCommand = interaction.options.getSubcommand()
		if (subCommand == `commands`) {
			return await this.noArg(client, reply, interaction, locale, `/`)
		} else if (subCommand == `search`) {
			const cmd = interaction.options.getString(`command`)
			return await this.suppliedArg(client, reply, locale, cmd, `/`)
		}
	},
	async execute(client, reply, message, arg, locale, prefix) {
		//  Displaying the help center if user doesn't specify any arg
		if (!arg) {
			return await this.noArg(client, reply, message, locale, prefix)
		}
		return await this.suppliedArg(client, reply, locale, arg, prefix)
	},
	async noArg(client, reply, messageRef, locale, prefix) {
		const cmds = this.getCommandStructures(client)

		messageRef = isSlash(messageRef) ? messageRef.member.user : messageRef.author
		// Display 5 most used commands suggestions
		return await reply.send(locale(`HELP.LANDING`), {
			socket: {
				emoji: await client.getEmoji(`692428988177449070`),
				prefix: prefix
			},
			header: `Hi, ${messageRef.username}!`,
			thumbnail: client.user.displayAvatarURL()
		})
			.then(response => {
				response = isInteractionCallbackResponse(response) ? response.resource.message : response
				response.react(this.commandpediaButton)
				const filter = (reaction, user) => (reaction.emoji.name === this.commandpediaButton) && (user.id === messageRef.id)
				const bookEmojiCollector = response.createReactionCollector({ filter, time: 300000, max: 1 })
				//  Display Commandpedia layout once user pressed the :book: button
				bookEmojiCollector.on(`collect`, async () => {
					response.delete()
					await reply.send(locale(`HELP.COMMANDPEDIA.HEADER`), {
						socket: {
							prefix: prefix,
							serverLink: `[${locale(`JOIN_SUPPORT_SERVER`)}](${client.supportServer})`,
							botInviteLink: `[${locale(`INVITE_ANNIE`)}](${getBotInviteUrl(client)})`,
							commandList: this.prettifyCommandpedia(cmds, locale)
						},
						image: `commandpedia`,
						customHeader: [`Commandpedia`, client.user.displayAvatarURL()]
					})
				})
			})
	},
	async suppliedArg(client, reply, locale, arg, prefix) {
		//  Display command's properties based on given keyword (if match. Otherwise, return)
		const { isCategory, res } = await this.findCommandByKeyword(arg, client.message_commands.filter(node => !this.ignoreGroups.includes(node.group)))
		if (!res) return await reply.send(locale(`HELP.UNABLE_TO_FIND_COMMAND`), {
			socket: {
				emoji: await client.getEmoji(`692428969667985458`)
			}
		})
		//  Handle helpCategory display
		if (isCategory) {
			const commands = client.message_commands.filter(node => node.group === res).map(node => `\`${node.name}\``)
			return await reply.send(locale(`HELP.CATEGORY`), {
				socket: {
					category: locale(`HELP.CATEGORY_HEADER_DESC.${res.toUpperCase()}`),
					commands: commands.join(`, `)
				},
				header: `${locale(`HELP.CATEGORY_HEADER.START`)}${res}${locale(`HELP.CATEGORY_HEADER.END`)}`,
				thumbnail: client.user.displayAvatarURL()
			})
		}
		const perm = this.getPermissionProperties(res.permissionLevel, client)
		const cmdName = res.name.charAt(0).toUpperCase() + res.name.slice(1)
		const cmdDesc = `"${res.description.charAt(0).toUpperCase() + res.description.slice(1)}"`
		const footer = locale(`HELP.USAGE_FOOTER`)
		return await reply.send(`**${cmdName}**\n${cmdDesc}\n${footer}`, {
			socket: {
				prefix: prefix,
				usage: res.usage,
				permLvl: perm.level,
				permName: perm.name
			}
		})
	},
	/**
	 * Finding command by a category, name or alias.
	 * @param {String} [keyword=``] user input
	 * @param {Map} [src={}] tree-structural commands list 
	 * @returns {object}
	 */
	async findCommandByKeyword(keyword = ``, src = {}) {
		//  Find group
		let parents = src.map(node => node.group.toLowerCase())
		if (parents.includes(keyword)) return { isCategory: true, res: keyword }
		//  Find by command master name
		if (src.has(keyword)) return { isCategory: false, res: src.get(keyword) }
		//  Find by aliases
		const aliasSearch = src.filter(node => node.aliases.includes(keyword))
		if (aliasSearch.size > 0) return { isCategory: false, res: aliasSearch.first() }
		return { isCategory: false, res: null }
	},

	/**
	 * Parsing registered commands into a tree-structured map collection.
	 * @param {Client} client Current client/bot instance
	 * @returns {CommandsObject}
	 */
	getCommandStructures(client) {
		let obj = {}
		let groups = client.message_commands.map(el => el.group)
		let uniqueGroups = [...new Set(groups)].filter(el => !this.ignoreGroups.includes(el))
		for (let groupName of uniqueGroups) {
			const groupChilds = client.message_commands.filter(el => el.group === groupName && !el.invisible)
			obj[groupName] = groupChilds
		}
		return obj
	},

	/**
	 * Fetch complete properties of given permission level
	 * @param {Number} [lvl=0] Permission level.
	 * @param {Client} client Current client/bot instance.
	 * @returns {PermissionObject}
	 */
	getPermissionProperties(lvl = 0, client) {
		const src = client.permission
		for (let key in src) {
			if (src[key].level === lvl) return src[key]
		}
	},

	/**
	 * Prettifying commands collection into a readable list.
	 * @param {Object} [obj={}] returned result from [this.getCommandStructures()]
	 * @returns {String}
	 */
	prettifyCommandpedia(obj = [], locale) {
		let str = ``
		for (let group in obj) {
			const cmdNames = obj[group].map(el => `\`${el.name.toLowerCase()}\``)
			str += `**${group}**\n*${locale(`HELP.CATEGORY_DESC.${group.toUpperCase()}`)}*\n${cmdNames.join(`, `)}\n\n`
		}
		return str
	},
}