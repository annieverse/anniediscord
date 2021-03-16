const Command = require(`../../libs/commands`)
const category = require(`../../config/commandCategories`)
/**
 * 	Displaying all the available commands. Complete with the usage.
 * 	@author klerikdust
 */
class Help extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		this.defaultColor = `crimson`
		this.commandpediaButton = `📖`
		this.ignoreGroups = [`Developer`, `modmail`, `Moderation`]
		this.commandpediaThumbnail = `https://i.ibb.co/kHfmDv0/book.png`
		this.permmissionInteger = 268823638
		this.botInviteUrl = `https://discord.com/oauth2/authorize?client_id=${this.bot.user.id}&permissions=${this.permmissionInteger}&scope=bot`
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, name, emoji, bot:{db, supportServer} }) {
		await this.requestUserMetadata(1)
		const cmds = this.getCommandStructures()

		//  Displaying the help center if user doesn't specify any arg
		if (!this.fullArgs)	{

			// Display 5 most used commands suggestions
			const commandSuggestions = await db.mostUsedCommands()
			return reply(this.locale.HELP.LANDING, {
				socket: {
					user: name(this.user.master.id),
					recommendedCommands: this.prettifySuggestions(commandSuggestions),
					serverLink: supportServer,
					emoji: emoji(`AnnieWave`),
					prefix: this.bot.prefix
				},
				color: this.defaultColor,
				header: `Hi, ${name(this.user.master.id)}!`,
				thumbnail: this.bot.user.displayAvatarURL()
			})
			
			.then(response => {
				response.react(this.commandpediaButton)
				const bookEmoji = (reaction, user) => (reaction.emoji.name === this.commandpediaButton) && (user.id === this.user.master.id)
				const bookEmojiCollector = response.createReactionCollector(bookEmoji, {
					time: 60000
				})

				//  Display Commandpedia layout once user pressed the :book: button
				bookEmojiCollector.on(`collect`, () => {
					response.delete()
					reply(this.locale.HELP.COMMANDPEDIA.HEADER, {
						socket: {
							prefix: this.bot.prefix,
							serverLink: `[Join Support Server](${supportServer})`,
							botInviteLink: `[Invite Annie](${this.botInviteUrl})`,
							commandList: this.prettifyCommandpedia(cmds)
						},
						image: `banner_help`,
						thumbnail: this.commandpediaThumbnail,
						customHeader: [`Commandpedia`, this.bot.user.displayAvatarURL()],
						color: this.defaultColor
					})
				})
			})
		}

		//  Display command's properties based on given keyword (if match. Otherwise, return)
		const res = await this.findCommandByKeyword(this.fullArgs, cmds)
		if (!res) return reply(this.locale.HELP.UNABLE_TO_FIND_COMMAND, {color: `red`})
		//  Handle helpCategory display
		if (this.helpCategory) {
			const commands = [...cmds[res].keys()].map(node => `\`${node}\``)
			return reply(category[res.toUpperCase()] + `\n**Here's the list!**\n${commands.join(`, `)}`, {
				header: `The ${res} Commands!`,
				thumbnail: this.bot.user.displayAvatarURL()
			})
		}
		const perm = this.getPermissionProperties(res.help.permissionLevel)
		const cmdName = res.help.name.charAt(0).toUpperCase() + res.help.name.slice(1)
		const cmdDesc = `"${res.help.description.charAt(0).toUpperCase() + res.help.description.slice(1)}"`
		const footer = `\`\`\`javascript\nUSAGE: ${this.prefix}${res.help.usage}\nPERM_LVL: ${perm.level} or equivalent to ${perm.name} privileges\`\`\``

		return reply(`**${cmdName}**\n${cmdDesc}\n${footer}`, {
			color: this.defaultColor
		})

	}

	/**
	 * Finding command by a category, name or alias.
	 * @param {String} [keyword=``] user input
	 * @param {Map} [src={}] tree-structural commands list 
	 * @returns {CommandProperties}
	 */
	async findCommandByKeyword(keyword=``, src={}) {
		let res = null
		let parents = (Object.keys(src)).map(node => node.toLowerCase())
		keyword = keyword.endsWith(`s`) ? keyword.slice(0, keyword.length-1) : keyword
		if (parents.includes(keyword)) {
			this.helpCategory = true
			return keyword.charAt(0).toUpperCase() + keyword.slice(1)
		}
		//  Returns if keyword has matched with parent
		if (src[keyword]) res = src[keyword]
		//  Find on deep layer and recursively
		for (let group in src) {
			src[group].filter(child => {
				//  Returns result if keyword has matched with command's name
				if (child.help.name === keyword) res = child
				//  Returns result if keyword has matched with command's aliases
				if (child.help.aliases.includes(keyword)) res = child
			})	
		}
		return res
	}

	/**
	 * Parsing registered commands into a tree-structured map collection.
	 * @returns {CommandsObject}
	 */
	getCommandStructures() {
		let obj = {}
		let groups = this.bot.commands.names.map(el => el.help.group)
		let uniqueGroups = [...new Set(groups)].filter(el => !this.ignoreGroups.includes(el))
		for (let groupName of uniqueGroups) {
			const groupChilds = this.bot.commands.names.filter(el => el.help.group === groupName && !el.help.invisible)
			obj[groupName] = groupChilds
		}
		return obj
	}

	/**
	 * Fetch complete properties of given permission level
	 * @param {Number} [lvl=0] Permission level.
	 * @returns {PermissionObject}
	 */
	getPermissionProperties(lvl=0) {
		const src = this.bot.permission
		for (let key in src) {
			if (src[key].level === lvl) return src[key]
		}
	}

	/**
	 * Prettifying commands collection into a readable list.
	 * @param {Object} [obj={}] returned result from [this.getCommandStructures()]
	 * @returns {String}
	 */
	prettifyCommandpedia(obj=[]) {
		let str = ``
		for (let group in obj) {
			const cmdNames = obj[group].map(el => `\`${el.help.name.toLowerCase()}\``)
			str += `**${group}**\n*${this._getCategoryDescription(group)}*\n${cmdNames.join(`, `)}\n\n`
		}
		return str
	}

	/**
	 * Pull category's description
	 * @param {string} [category]
	 * @return {string}
	 */
	_getCategoryDescription(category=``) {
		const descriptions = {
			Artsy: `Art-related commands will fall under this category and still undergoing development!`,
			Fun: `Wanna have fun with your friends?!`,
			Setting: `Configurations modules that you may need to set up your guild and your custom profile!`,
			System: `Miscellaneous commands to check the state of Annie.`,
			User: `Everything you need are in here. Well-refined, just for you.`
		}
		return descriptions[category]
	}

	/**
	 * Prettifying suggested commands array
	 * @param {Array} [arr=[]] returned result from [Database.mostUsedCommands()]
	 * @returns {String}
	 */
	prettifySuggestions(arr=[]) {
		const cmdNames = arr.map(el => { return `\`${this.bot.prefix}${el.command_alias}\``})
		return cmdNames.join(`,`)
	}

}

module.exports.help = {
	start: Help,
	name: `help`,
	aliases: [`help`, `help`, `cmdhelp`],
	description: `Displaying all the available commands. Complete with the usage.`,
	usage: `help <Category/CommandName>(Optional)`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}