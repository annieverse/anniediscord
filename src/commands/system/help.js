const category = require(`../../config/commandCategories`)
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
    commandpediaButton: `📖`,
	ignoreGroups: [`developer`],
	permmissionInteger: 268823638,
    /**
     * Client/Bot invite generator.
     * @param {Client} client Current client instancee.
     * @return {string}
     */
    getBotInviteUrl(client) {
        return `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${this.permmissionInteger}&scope=bot`
    },
    async execute(client, reply, message, arg, locale, prefix) {
		const cmds = this.getCommandStructures(client)
		//  Displaying the help center if user doesn't specify any arg
		if (!arg)	{
			// Display 5 most used commands suggestions
			return reply.send(locale.HELP.LANDING, {
				socket: {
					emoji: await client.getEmoji(`692428988177449070`),
					prefix: prefix
				},
				header: `Hi, ${message.author.username}!`,
				thumbnail: client.user.displayAvatarURL()
			})
			.then(response => {
				response.react(this.commandpediaButton)
				const bookEmoji = (reaction, user) => (reaction.emoji.name === this.commandpediaButton) && (user.id === message.author.id)
				const bookEmojiCollector = response.createReactionCollector(bookEmoji, {
					time: 60000
				})
				//  Display Commandpedia layout once user pressed the :book: button
				bookEmojiCollector.on(`collect`, () => {
					response.delete()
					reply.send(locale.HELP.COMMANDPEDIA.HEADER, {
						socket: {
							prefix: prefix,
							serverLink: `[Join Support Server](${client.supportServer})`,
							botInviteLink: `[Invite Annie](${this.getBotInviteUrl(client)})`,
							commandList: this.prettifyCommandpedia(cmds)
						},
						image: `commandpedia`,
						customHeader: [`Commandpedia`, client.user.displayAvatarURL()]
					})
				})
			})
		}
		//  Display command's properties based on given keyword (if match. Otherwise, return)
		const res = await this.findCommandByKeyword(arg, client.commands.filter(node => !this.ignoreGroups.includes(node.group)))
		if (!res) return reply.send(locale.HELP.UNABLE_TO_FIND_COMMAND, {
			socket: {
				emoji: await client.getEmoji(`692428969667985458`)
			}
		})
		//  Handle helpCategory display
		if (this.helpCategory) {
			const commands = client.commands.filter(node => node.group === res).map(node => `\`${node.name}\``)
			return reply.send(category[res.toUpperCase()] + `\n**here's the list!**\n${commands.join(`, `)}`, {
				header: `the ${res} commands!`,
				thumbnail: client.user.displayAvatarURL()
			})
		}
		const perm = this.getPermissionProperties(res.permissionLevel, client)
		const cmdName = res.name.charAt(0).toUpperCase() + res.name.slice(1)
		const cmdDesc = `"${res.description.charAt(0).toUpperCase() + res.description.slice(1)}"`
		const footer = `\`\`\`javascript\nUSAGE: ${prefix}${res.usage}\nPERM_LVL: ${perm.level} or equivalent to ${perm.name} privileges\`\`\``
		return reply.send(`**${cmdName}**\n${cmdDesc}\n${footer}`)
    },

    /**
	 * Finding command by a category, name or alias.
	 * @param {String} [keyword=``] user input
	 * @param {Map} [src={}] tree-structural commands list 
	 * @returns {CommandProperties}
	 */
	async findCommandByKeyword(keyword=``, src={}) {
        //  Find group
		let parents = src.map(node => node.group.toLowerCase())
		if (parents.includes(keyword)) {
			this.helpCategory = true
			return keyword
		}
		//  Find by command master name
		if (src.has(keyword)) return src.get(keyword)
		//  Find by aliases
        const aliasSearch = src.filter(node => node.aliases.includes(keyword))
        if (aliasSearch.length > 0) return aliasSearch[0]
		return null
	},

	/**
	 * Parsing registered commands into a tree-structured map collection.
     * @param {Client} client Current client/bot instance
	 * @returns {CommandsObject}
	 */
	getCommandStructures(client) {
		let obj = {}
		let groups = client.commands.map(el => el.group)
		let uniqueGroups = [...new Set(groups)].filter(el => !this.ignoreGroups.includes(el))
		for (let groupName of uniqueGroups) {
			const groupChilds = client.commands.filter(el => el.group === groupName && !el.invisible)
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
	getPermissionProperties(lvl=0, client) {
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
	prettifyCommandpedia(obj=[]) {
		let str = ``
		for (let group in obj) {
			const cmdNames = obj[group].map(el => `\`${el.name.toLowerCase()}\``)
			str += `**${group}**\n*${this._getCategoryDescription(group)}*\n${cmdNames.join(`, `)}\n\n`
		}
		return str
	},

	/**
	 * Pull category's description
	 * @param {string} [category]
	 * @return {string}
	 */
	_getCategoryDescription(category=``) {
		const descriptions = {
			artsy: `My artsy stuffs that will assist your creative process!`,
			fun: `Wanna have fun with your friends?!`,
			setting: `Configurations modules that you may need to set up your guild and your custom profile!`,
			system: `Miscellaneous commands to check the state of Annie.`,
			user: `Everything you need are in here. Well-refined, just for you.`
		}
		return descriptions[category]
	}
}
