const Discord = require(`discord.js`)
const fs = require(`fs`)

class help {
	constructor(Stacks) {
		this.utils = Stacks.utils
		this.message = Stacks.message
		this.bot = Stacks.bot
		this.args = Stacks.args
		this.palette = Stacks.palette
		this.log = Stacks.log
		this.role = Stacks.roles
		this.stacks = Stacks
		this.needHelp = `Need further help? Please DM <@507043081770631169>.`
		this.embed = new Discord.RichEmbed()
		this.dm = false
		this.pathForCommands = Stacks.paths.help_js
		this.logger = Stacks.bot.logger
	}

	async allowedToUse() {
		if (this.message.member.roles.find(r => Object.keys(this.role.admin).some(i => this.role.admin[i] == r.id))) return true
		return false
	}

	/**
     * Formats a string to have a captial first letter and a period at the end
     * @param {string} string 
     */
	formatDescription(string) {
		if (string.charAt(string.length - 1) === `.`) {
			return string.charAt(0).toUpperCase() + string.slice(1)
		} else {
			return string.charAt(0).toUpperCase() + string.slice(1) + `.`
		}
	}

	/**
     * locates all groups names
     * @returns {Array} group names
     */
	async groupNames() {
		let file_arr = []
		fs.readdir(this.pathForCommands, (err, files) => {
			if (err) this.logger.error(`Failed to grouping help commands. > `, err)
			const src = require(`./${files[0]}`)
			file_arr.push(src.help.group.toLowerCase())
			for (let file in files) {
				const src = require(`./${files[file]}`)
				if (!file_arr.includes(src.help.group.toLowerCase())) {
					file_arr.push(src.help.group.toLowerCase())
				}
			}
		})
		await this.stacks.pause(200)
		return file_arr
	}

	/**
     * grabs the main name for all commands
     * @returns {string} command names joined by \n
     */
	async mainNames(groupname) {

		let file_arr = []
		fs.readdir(this.pathForCommands, (err, files) => {
			if (err) this.logger.error(`Failed to retrieve mainNames for help command. > `, err)

			for (let file in files) {
				const src = require(`./${files[file]}`)
				if (src.help.group.toLowerCase() === groupname) {
					if (src.help.public) { file_arr.push(src.help.name) }
				}
			}
		})
		await this.stacks.pause(200)
		file_arr = file_arr.join(`\n`)
		return file_arr
	}

	/**
     * Grabs any usage for a file if one exists
     * @param {String} file file name
     * @returns {String} string of usage 
     */
	async usage(file) {
		let file_rst
		const src = require(`./${file}`)
		file_rst = src.help.usage.toLowerCase()
		await this.stacks.pause(200)
		return file_rst
	}

	/**
     * Grabs any description for a file if one exists
     * @param {String} file file name
     * @returns {String} string of description 
     */
	async description(file) {
		let file_rst
		const src = require(`./${file}`)
		file_rst = src.help.description.toLowerCase()
		file_rst = this.formatDescription(file_rst)
		await this.stacks.pause(200)
		return file_rst
	}

	/**
     * Grabs any group for a file if one exists
     * @param {String} file file name
     * @returns {String} string of group 
     */
	async group(file) {
		let file_rst
		let src
		src = require(`./${file}`)
		file_rst = src.help.group.toLowerCase()
		await this.stacks.pause(200)
		return file_rst
	}

	/**
     * Grabs any file name baised on an alias or file inputed
     * @param {String} cmd file name
     * @returns {String} string of file
     */
	async returnFileName(cmd) {
		let file_name = cmd
		fs.readdir(this.pathForCommands, (err, files) => {
			if (err) this.logger.error(`Failed to retrieve the fileName for help command. > `, err)
			for (let file in files) {
				const src = require(`./${files[file]}`)
				if (src.help.name.toLowerCase() === cmd.toLowerCase || src.help.aliases.includes(cmd.toLowerCase())) {
					file_name = src.help.name
					continue
				}
			}
		})
		await this.stacks.pause(200)
		return file_name
	}

	deleteObjectFromArr(arr, obj) {
		var index = arr.indexOf(obj)
		if (index > -1) {
			arr.splice(index, 1)
		}
	}

	/**
     * Displays all avaible commands in each category
     */
	async helpAll(dmState) {
		this.message.channel.send(this.stacks.code.HELP.FETCHING).then(async load => {
			let page = [], pages = []
			let pageHeaderOptions = await this.groupNames()
			pageHeaderOptions.sort()

			if (await this.allowedToUse() === false) deleteObjectFromArr(pageHeaderOptions)

			function deleteObjectFromArr(arr) {
				var index = arr.indexOf(`admin`)
				if (index > -1) {
					arr.splice(index, 1)
				}
			}

			for (let x = 0; x < pageHeaderOptions.length; x++) {
				page.push(new Array())
				let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`))
				for (let index = 0; index < mainNames.length; index++) {
					page[x].push(`**\`${mainNames[index]}\`** : ${await this.description(mainNames[index])}`)
				}
			}

			if (dmState) {
				for (let i = 0; i < page.length; i++) {
					pages.push(this.stacks.chunk(page[i], 10))
					let header = `\n**Below are my commands documentation for the \`${pageHeaderOptions[i].toUpperCase()}\` group.**\n`
					pages[i].forEach((element, index) => {
						if (index === 0) { element.unshift(header) }
					})
				}
				let newPageEdit = []

				pages.forEach((element) => {
					element.forEach((obj) => {
						newPageEdit.push(obj.join(`\n`))
					})
				})
				let splitPages = this.stacks.chunk(newPageEdit, 2)
				this.stacks.reply(this.needHelp, { field: this.stacks.message.author })
				splitPages.forEach(element => {
					this.stacks.reply(element, { field: this.stacks.message.author })
				})

			} else {
				for (let i = 0; i < page.length; i++) {
					pages.push(this.stacks.chunk(page[i], 6))
					let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[i].toUpperCase()}\` group.\n`
					pages[i].forEach((element, index) => {
						if (index === 0) { element.unshift(header) } else { element.unshift(header + `**Continued**.\n`) }
					})
				}
				this.utils.pages(this.message, pages, this.embed)
				this.stacks.reply(this.needHelp)
			}
			return load.delete()
		})

	}

	/**
     * Displays all avaible commands for a specific category
     * @param {String} group group name
     */
	async help(group, dmState) {
		let pageHeaderOptions = await this.groupNames()
		pageHeaderOptions.sort()

		if (group.toLowerCase() === `help`) {
			return this.stacks.reply(`My available commands are:\n\nhelp: \`\`\`fix\nTo view all availble commands\`\`\`help group: \`\`\`fix\nTo look at one specific group of commands\`\`\`My available groups are: \`\`\`fix\n${pageHeaderOptions.join(`, `)}\`\`\`help command:\`\`\`fix\nTo look at a specific command\`\`\``)
		}

		if (group === `admin`) {
			if (await this.allowedToUse() === false) return this.stacks.reply(this.stacks.code.ROLE.ERR.WRONG.ROLE)
		}

		this.message.channel.send(this.stacks.code.HELP.FETCHING).then(async load => {
			let pages, page = []
			let position = 0
			for (let x = 0; x < pageHeaderOptions.length; x++) {
				if (group.toLowerCase() === pageHeaderOptions[x]) {
					position = x
					page.push(new Array())
					let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`))
					for (let index = 0; index < mainNames.length; index++) {
						page[0].push(`**\`${mainNames[index]}\`** : ${await this.description(mainNames[index])}`)
					}
				}
			}
			let header = `<:AnnieHi:501524470692053002> **Hello, I'm Annie!**\nBelow are my commands documentation for the \`${pageHeaderOptions[position].toUpperCase()}\` group.\n`
			pages = this.stacks.chunk(page[0], 10)

			if (dmState) {
				let newPage = []
				pages[0].unshift(header)
				pages.forEach((element) => {
					newPage.push(element.join(`\n`))
				})
				this.stacks.reply(this.needHelp, { field: this.stacks.message.author })
				newPage.forEach(element => {
					this.stacks.reply(element, { field: this.stacks.message.author })
				})
			} else {
				pages.forEach((element, index) => {
					if (index === 0) { element.unshift(header) } else { element.unshift(header + `**Continued**.\n`) }
				})
				this.utils.pages(this.message, pages, this.embed)
				this.stacks.reply(this.needHelp)
			}
			return load.delete()
		})
	}

	async specificCommandsHelp(cmdFile, group, dmState) {
		if (group === `admin`) {
			if (await this.allowedToUse() === false) return this.stacks.reply(this.stacks.code.ROLE.ERR.WRONG.ROLE)
		}
		this.message.channel.send(this.stacks.code.HELP.FETCHING).then(async load => {
			let pages, page = []
			this.embed.setFooter(`<required>|[optional]`)
			page.push(new Array(`\`\`\`fix\n${await this.usage(cmdFile)}\`\`\``))
			page[0].push(`Information\n\`\`\`ymal\n${await this.description(cmdFile)}\`\`\``)
			pages = this.stacks.chunk(page[0], 6)
			if (dmState) {
				this.stacks.reply(pages[0], { field: this.stacks.message.author, footer: `<required>|[optional]` })
			} else {
				this.utils.pages(this.message, pages, this.embed)
			}
			return load.delete()
		})
	}

	async startUp(dmState) {
		const { message, reply, utils: { pages }, environment, socketing, code: { HELP: { HEADER, ADVANCEDHELPMENU, OTHER_INFO, STARTER_COMMANDS}}} = this.stacks
		let p, ps = []
		let pageHeaderOptions = await this.groupNames()
		pageHeaderOptions.sort()
		let General = await this.mainNames(`general`).then(str => str.split(`\n`))
		let Fun = await this.mainNames(`fun`).then(str => str.split(`\n`))
		let shop = await this.mainNames(`shop`).then(str => str.split(`\n`))
		let server = await this.mainNames(`server`).then(str => str.split(`\n`))
		p = HEADER + socketing(STARTER_COMMANDS, [General.length, Fun.length, shop.length, server.length]) + `\n` + socketing(OTHER_INFO,[environment.prefix])
		ps.push(p)
		ps.push(socketing(ADVANCEDHELPMENU,[environment.prefix, pageHeaderOptions.join(`, `), environment.prefix]))
		if (dmState) {
			reply(this.needHelp, { field: message.author })
			reply(ps, { field: message.author })
			//this.utils.pages(this.message, pages, this.embed);
		} else {
			pages(message, ps, this.embed)
		}
	}

	async helpCenter() {
		const { args } = this.stacks
		let obj = `--dm`
		if (args.some(value => value.toLowerCase() === `--dm`)) {
			this.deleteObjectFromArr(args, obj)
			this.dm = true
			this.helpCenter()
		} else {
			if (!args[0]) return this.startUp(this.dm)

			if (args[0] === `all`) return this.helpAll(this.dm) // Sends the basic overall help of all available commands and groups, when no args are detected
            
			let file = await this.returnFileName(args[0]) // grabs the file name of a command
			let pageHeaderOptions = await this.groupNames() // Intializes the groups for all commands
			if (args[0].toLowerCase() === `help`) return this.help(args[0].toLowerCase(), this.dm) // Sends a help message for the help command, ie. ${prefix}help help
            
			for (let x = 0; x < pageHeaderOptions.length; x++) { // Loops through all available groups
				let mainNames = await this.mainNames(pageHeaderOptions[x]).then(str => str.split(`\n`)) // Gets all available commands and assigns them to their groups
				if (pageHeaderOptions.some(x => x.toLowerCase() === args[0].toLowerCase())) return this.help(args[0], this.dm) // if a group name is detected, only the commands for that group will be sent
				
				// Set the Group name if their is a groups name availiable 
				let group_name
				try {
					group_name = await this.group(file)
				} catch (err) {
					group_name = undefined
				}
				if (group_name === undefined) return this.stacks.reply(this.stacks.code.ROLE.ERR.WRONG.FILE)
				if (group_name.toLowerCase() === pageHeaderOptions[x] && group_name !== undefined) { // Tests to see if the arg being passed through is a command in a group
					for (let index = 0; index < mainNames.length; index++) { // Loops through all available options for the command
						if (file === mainNames[index]) { // Tests for the correct file
							return this.specificCommandsHelp(mainNames[index], pageHeaderOptions[x], this.dm) // returns a help message for that specific command
						}
					}
				}
			}
		}
	}

	async execute() {
		const {args} = this.stacks
		if (!args[0]) return this.startUp()
		this.helpCenter()
	}
}

module.exports.help = {
	start: help,
	name: `help`,
	aliases: [`thelp`],
	description: `all avaible commands`,
	usage: `help`,
	group: `general`,
	public: true,
	require_usermetadata: true,
	multi_user: false
}