/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-useless-escape */
/** Notes:
 *  - refactor userFind regex
 *  - Locked DM
 *  - log() into Embed()
 */

class clan_wrapper {
	constructor(Stacks) {
		this.stacks     = Stacks
	}
	async execute() {
		let authorname  = this.stacks.meta.author.user.username
		let bot         = this.stacks.bot
		let message     = this.stacks.message
		let args        = this.stacks.args
		let code        = this.stacks.code
		let palette     = this.stacks.palette
		let emoji       = this.stacks.emoji
		let pause       = this.stacks.pause

        
		/***************************************************************************************************
         * GLOBAL VARIABLE INITIALIZATION
         ***************************************************************************************************/
		/*  Global General-Purpose Data
         *  Put data that will be used within any sub-command 
         */
		const Discord = require(`discord.js`)                      //  Temporary
		const env = require(`../../.data/environment.json`)        //  Temporary

		const commandname = exports.help.name
		const prefix = env.prefix                                  //  Temporary
        
		const delay = 200
		const timeout1 = 60000
		const promptcolor = palette.darkmatte
		const collectorcolor = palette.green

		const sql = require(`sqlite`)
		const sqlpath = `.data/database.sqlite`
		sql.open(sqlpath)

		const authorfilter = m => m.author.id === message.author.id
		const collector = new Discord.MessageCollector(
			message.channel,
			m => m.author.id === message.author.id, {
				max: 1,
				time: 30000,
			}
		)

		//  Initialize special globals
		let user, target, msg, cmdpath, accessmap

		/***************************************************************************************************
         * GLOBAL CLASS / FUNCTION INITIALIZATION
         ***************************************************************************************************/
		class User {
			constructor(search) {
				this._input = search
				this._exists = false
			}

			get exists()        { return this._exists}
			get input()         { return this._input }
			//  PUBLIC OUTPUT: User Class Data
			get client()        { return this.$client }
			get discriminator() { return this.$client.user.discriminator }
			get name()          { return this.$client.user.username }
			get pfp()           { return this.$client.user.displayAvatarURL }
			get nickname()      { return this.$client.nickname }
			get id()            { return this.$client.id }
			get roles()         { return this.$client.roledata }
			//  PUBLIC OUTPUT: Server Database Data
			get level()         { return this.$userdata.level }
			get artcoins()      { return this.$userinventories.artcoins }
			get clantag()       { return null }
			get nametag()       { return null }
			get isLeader()      { return false }
			get isMember()      { return false }


			//  OBTAIN: Property Container Functions
			async _get_user() { this.$client = await this._findUser() }
			async _get_userData() { this.$userdata = await sql.get(`SELECT * FROM userdata WHERE userID = "${this.$client.id}"`) }
			async _get_inventory() { this.$userinventories = await sql.get(`SELECT * FROM userinventories WHERE userID = "${this.$client.id}"`) }
			async _get_userCheck() { this.$userstatus = await sql.get(`SELECT * FROM usercheck WHERE userID = "${this.$client.id}"`) }
			async _get_userRoles() {
				let allroles = await this.$client.roles.array()
				this.$client.roledata = {} 
				allroles.forEach(e => this.$client.roledata[e.id] = e.name) 
			}


			//  PRIVATE UTILITY METHODS
			async _isValidUser() { return await this._findUser() ? true : false }
			async _findUser() {
				const userPattern = /^(?:<@!?)?([0-9]+)>?$/
				if (userPattern.test(this._input)) this._input = this._input.replace(userPattern, `$1`)
				let members = message.guild.members
				const filter = member =>
					member.user.id === this._input ||
                    member.displayName.toLowerCase() === this._input.toLowerCase() ||
                    member.user.username.toLowerCase() === this._input.toLowerCase() ||
                    member.user.tag.toLowerCase() === this._input.toLowerCase()
				return members.filter(filter).first()
			}
			async _botHasNicknamePerms() {
				return message.guild.members.get(bot.user.id).hasPermission(`MANAGE_NICKNAMES`) &&
                message.guild.members.get(bot.user.id).hasPermission(`CHANGE_NICKNAME`)
			}
			async _setNickname(newnickname) {
				await this._get_user()
				if (await this._botHasNicknamePerms()) {
					await this.$client.setNickname(newnickname)
					await this._get_user()
				} else throw error
			}


			// PUBLIC METHODS
			async addClanTag() {}
			async removeClanTag() {}
			async init() {
				if (await this._isValidUser()) {

					this._exists = true
					await this._get_user()
					await this._get_userRoles()
					await this._get_userData()
					await this._get_inventory()
					await this._get_userCheck()

				} else this._exists = false
				return this
			}      
		}

		class Member extends User {

		}

		class Clan {
			constructor(search = null) {
				this._input = search
				this._exists = false
			}

			//  PUBLIC OUTPUT
			get input()         { return this._input }
			get exists()        { return this._exists }

			get data()          { return this.$data }
			get id()            { return this.$data.id }
			get name()          { return this.$data.name }
			get tag()           { return this.$data.tag }
			get motto()         { return this.$data.motto }
			get color()         { return this.$data.color }
			get leaderid()      { return this.$data.leader }
			get maxmembers()    { return this.$data.maxmembers }
			get foundingdate()  { return this.$data.foundingdate }

			get members()       { return this.$members}

			//  OBTAIN: Property Container Functions
			async _get_clanData() { this.$data = await this._findClan() }

			//  PRIVATE UTILITY METHODS
			async _isValidClan() { return await this._findClan() ? true : false}
			async _findClan() {
				return await sql.get(`
                    SELECT * 
                    FROM clandata 
                    WHERE replace(lower(name), ' ', '') = '${this._input.toLowerCase().replace(` `,``)}' 
                    OR replace(lower(tag), ' ', '') = '${this._input.toLowerCase().replace(` `,``)}'
                    OR id = '${this._input}'`)
			}

			//  PUBLIC METHODS
			async init() {
				if (await this._isValidClan()) {

					this._exists = true
					await this._get_clanData()

				} else this._exists = false
				return this
			}
			async setName(name) {

				return this
			}
			async setTag(tag) {

				return this
			}
			async setColor(color) {

				return this
			}
			async setMotto(motto) {

				return this
			}
			async setLeader(leader) {

				return this
			}
			async addMember(member) {

				return this
			}
			async removeMember(member) {

				return this
			}

		}

		class Metadata {
			constructor(name) {
				this.name = name.toLowerCase()
				this.alias = []
				this.info = `Command Information not set.`
				this.arguments = []
				this.name === `help` 
					? this.commandlist = [] 
					: this.commandlist = [help]
				this.access = {
					clanstatus: `public`,
					roles: `developer`,
					level: -1
				}
				this.input = { 
					prompt: `Prompt message not set.`,
					require: false
				}
			}

			//  PRIVATE UTILITY METHOD
			_isString(input) { return typeof input === `string` || input instanceof String }
			_isArray(input) { return input && typeof input === `object` && input.constructor === Array  }
			_isObject(input) { return input && typeof input === `object` && input.constructor === Object }

			//  PUBLIC SET DATA
			setAlias(input) {
				if (this._isArray(input) && input.every(this._isString)) this.alias = input
				if (this._isString(input)) this.alias.push(input)
				return this
			}
			setInfo(input) {
				if (this._isString(input)) this.info = input
				return this
			}
			setArguments(input) {
				if (this._isArray(input) && input.every(this._isString)) this.arguments = input
				if (this._isString(input)) this.arguments.push(input)
				return this
			}
			setCommandList(input) {
				if (this._isArray(input) && input.every(this._isObject)) this.commandlist = this.commandlist.concat(input)
				if (this._isObject(input)) this.commandlist.push(input)
				return this
			}
			setAccess(input) {
				if (this._isObject(input)) {
					for (let group in input) {
						if (this.access[group] && this.access.hasOwnProperty(group) && typeof this.access[group] === typeof input[group])
							this.access[group] = input[group]
					}
				}
				return this
			}
			setInput(input) {
				for (let group in input) {
					if (this.input.hasOwnProperty(group) && typeof this.input[group] === typeof input[group])
						this.input[group] = input[group]
				}
				return this
			}
		}
        
		class Subcommand {
			constructor (metadata, search = args[0]) {
				this._input = search
				this._exists = false
				this.$invoker = metadata
			}

			//  PUBLIC OUTPUT
			get input()     { return this._input }
			get name()      { return this.$subcommand.metadata.name }
			get exists()    { return this._exists }

			set input(input) {
				this._input = input
				this.init()
			}

			//  OBTAIN: Property Container Functions
			_get_subcommand() { this.$subcommand = this._findSubcommand() }

			//  PRIVATE UTILITY METHODS
			_isValidSubCommand() { return this._findSubcommand() ? true : false }
			_normalizeSubcommand() { if (this._input) { this._input = this._input.toLowerCase() } }
			_findSubcommand() {
				let subcommand = null
				this.$invoker.commandlist.forEach((element) => {
					if (element.metadata.name === this._input || element.metadata.alias.indexOf(this._input) >= 0) { subcommand = element }
				})
				return subcommand
			}

			//  PRIVATE RESTRICTION METHODS
			_checkClanStatus(value) { return accessmap.clanstatus[value] }
			_checkRoles(value) {
				for (let key in accessmap.roles[value]) { if (user.roles.hasOwnProperty(key)) return true }
				return false
			}
			_checkLevel(value) { return user.level >= value }
			accessGranted() {
				let check = {
					"clanstatus" : this._checkClanStatus,
					"roles" : this._checkRoles,
					"level" : this._checkLevel
				}
				let lock = []
				for (let key in this.$subcommand.metadata.access) { lock.push(check[key](this.$subcommand.metadata.access[key])) }
				return lock.every(e => e === true)
			}


			//  PUBLIC METHODS
			formattedinvokerCommandList() {
				let longest = 0
				let outputlist = []
				let list = this.$invoker.commandlist
				for (let e of list) { if (e.metadata.name.length > longest) longest = e.metadata.name.length }
				for (let e of list) {
					let tab = ``
					for (let i = 0; i < longest - e.metadata.name.length; i++) {tab += ` `}
					if (new Subcommand(this.$invoker, e.metadata.name).init().accessGranted())
						outputlist.push(`• ${e.metadata.name} ${tab}: ${e.metadata.info}`)
				}
				return outputlist.join(`\n`)
			}
			init() {
				this._normalizeSubcommand()
				if (this._isValidSubCommand()) { 

					this._exists = true
					this._get_subcommand()

				} else this._exists = false 
				return this
			}
			async execute() {
				if (!this.accessGranted()) return msg.embedWrapper(palette.red, `Sorry ${user.name}...\nYou don't have access to this command. ${emoji(`aauSatanialaugh`,bot)}`)
				else {
					args.shift()
                    
					let current = false
					let next = false
					let collect = false
					if (args[0]) {
                        
						if (new Subcommand(this.$subcommand.metadata).init().exists) next = true
						else if (this.$subcommand.metadata.arguments.length - args.length <= 0) current = true
						else await msg.embedWrapper(promptcolor, this.$subcommand.metadata.input.prompt).then(async prompt => {
							collect = true
							for (let e of this.$subcommand.metadata.arguments.slice(args.length)) {
								await pause(delay)
								msg .clearData()
									.setColor(collectorcolor)
									.setDescription(msg.codeBlock(`${e}?`,`CSS`,`**`))
									.setFooter(`Type \'cancel\' to quit.`)
                                    
								await msg.send().then(async m => {
									await message.channel.awaitMessages(authorfilter, { maxMatches: 1, time: timeout1, errors: [`time`]})
										.then(async collected => {
											await pause(delay)
											await collected.first().delete()
											await m.delete()
											args.push(collected.first().content)
											current = true;
											[`CANCEL`, `EXIT`, `QUIT`].forEach(e => { if (e === collected.first().content.toUpperCase()) return current = false })
										})
										.catch(async () => { await m.delete(); return current = false })
								})
								if (!current) break
							}
							//await pause(delay) 
							//await prompt.delete()
						})

					} else {

						if (!this.$subcommand.metadata.input.require) current = true
						else await msg.embedWrapper(promptcolor, this.$subcommand.metadata.input.prompt).then(async prompt => {
							collect = true
							for (let [i, e] of this.$subcommand.metadata.arguments.entries()) {
								let append = ` / subcommand`
								if (i === 0) e = e.concat(append)
								msg .clearData()
									.setColor(collectorcolor)
									.setDescription(msg.codeBlock(`${e}?`,`CSS`,`**`))
									.setFooter(`Type \'cancel\' to quit.`)
                                
								await pause(delay)
								await msg.send().then(async m => {
									await message.channel.awaitMessages(authorfilter, { maxMatches: 1, time: timeout1, errors: [`time`]})
										.then(async collected => {
											await pause(delay)
											await collected.first().delete()
											await m.delete()
											args.push(collected.first().content)
											current = true;
											[`CANCEL`, `EXIT`, `QUIT`].forEach(e => { if (e === collected.first().content.toUpperCase()) return next = current = false })
											if (i === 0 && new Subcommand(this.$subcommand.metadata).init().exists) { next = true; return current = false }
										})
										.catch(async () => { m.delete(); return next = current = false })
								})
								if (!current) break
							}
							//await pause(delay) 
							//await prompt.delete() 
						})

					}
                    
					if (this._input.toLowerCase() !== `help`) cmdpath.push(this.name)
					if (collect) await pause(delay)
					if (current) {
						this._input.toLowerCase() === `help` 
							? this.$subcommand.execute(this.$invoker) 
							: this.$subcommand.execute(this.$subcommand.metadata)
					}
					else if (next) {
						let nextsubcommand = new Subcommand(this.$subcommand.metadata).init()
						return nextsubcommand.execute(nextsubcommand.metadata)
					}
				}
			}


		}

		class Embed extends Discord.RichEmbed {
			constructor() { super() }

			//  Private Methods
			_formatString(input) { let s = input; return input = s.replace(/(^\s+)|(\s+$)/g,``).replace(/\n[ \t]+/g,`\n`) }
			_formatAllStrings() {
				for (let key1 in this) {
					if (typeof this[key1] === `string`) this[key1] = this._formatString(this[key1])
					if (typeof this[key1] === `object`) { for (let key2 in this[key1]) { if (typeof this[key1][key2] === `string`) this[key1][key2] = this._formatString(this[key1][key2]) } }
					if (key1 === `fields`) { this[key1].forEach((e) => { for (let key in e) { if (typeof e[key] === `string`) e[key] = this._formatString(e[key]) } }) }
				}
			}

			//  Public Methods
			send() { 
				this._formatAllStrings() 
				return message.channel.send(this) 
			}
			sendTo(channel) {
				this._formatAllStrings()
				return /^\d+$/.test(channel) ?
					bot.channels.find(x => x.id === channel).send(this) :
					bot.channels.find(x => x.name === channel.toLowerCase()).send(this)
			}
			sendDM(target) {
				this._formatAllStrings() 
				return target.client.send(this)
			}   
			sendRaw(text) { return message.channel.send(this._formatString(text)) }
			sendRawTo(channel, text) {
				return /^\d+$/.test(channel) ?
					bot.channels.find(x => x.id === channel).send(this._formatString(text)) :
					bot.channels.find(x => x.name === channel.toLowerCase()).send(this._formatString(text))
			}
			sendRawDM(target, text) { return target.client.send(this._formatString(text)) }
            
			//  Legacy Support Method
			embedWrapper(color, text) { return this.clearData().setColor(color).setDescription(this._formatString(text)).send() }

			//  Utility Methods
			clearData() { for (let key in this) { typeof this[key] !== `object` ? this[key] = undefined : this[key] = [] } return this}
			formatComma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`) }
			codeBlock(message, style = ``, markdown = ``) { return `${markdown}\`\`\`${style}\n${this._formatString(message)}\`\`\`${markdown.split(``).reverse().join(``)}` }
		}
        
		function ClanOld(name) {

			this.addMember = async(user_id) => {
				let target = message.guild.members.array().find(x => x.id === user_id)
				await addClanRole(target)
				msg.embedWrapper(palette.green, `**You have been assigned a new role!**`)
				await addClanTag(target)
				return msg.embedWrapper(palette.green, `**You have been given a new clan tag!**`)
			}

			const addClanRole = async(target) => await target.addRole(metadata.id)

			const addClanTag = async(target) => {
				if (await hasNicknamePerms(bot.user.id)) {
					let old_nickname = target.nickname
					message.guild.members.get(target.id).setNickname(`『${metadata.tag}』${old_nickname}`)
				} else return msg.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`)
			}

			const isValidClan = async(clan) => {
				sql.get(SELECT)
			}

		}

		//  Define special globals
		user = await new User(authorname).init()
		msg = new Embed()
		cmdpath = [`${prefix}${commandname}`]
		accessmap = {
			clanstatus : {
				public : true,
				member : user.isMember,
				leader : user.isLeader
			},
			roles : {
				public : { 
					"459891664182312980" : `@everyone`
				},
				developer : { 
					"502843277041729546" : `Development Team`,
					"591050122876551180" : `AAU Creative Lead`
				},
				admin : { 
					"459936023498063902" : `Grand Master`,
					"465587578327007233" : `Creators Council`
				},
				bot : {
					"459924414885265419" : `Bot`
				},
				test : {
					"598213651077267469" : `Beta Tester`
				},
				nobody : {
					"999999999999999999" : `Nonexistant Test Role`
				}
			}
		}

		/***************************************************************************************************
         * GLOBAL OUTPUT LOG
         ***************************************************************************************************/
		const log = (codelist) =>{
			const loglist = codelist.split(` `)
			const logtable = {
				"LB": {
					color: palette.white, 
					text: `\n`
				},
				"GREET_NEUTRAL" : {
					color: palette.white, 
					text: `Hey ${user.name}~ `
				},
				"GREET_APOLOGY" : {
					color: palette.white, 
					text: `Sorry ${user.name}... `
				},
				"SHORT_GUIDE" : {
					color: palette.green,
					text: `[Short Guide Here]`
				},
				"TRIAGE_HELP" : {
					color: palette.green, 
					text: `Here are a list of commands to get you started:
                        **Clan Creation**
                        \`${prefix}${commandname} create\`
                        **Clan Management**
                        \`${prefix}${commandname} manage, add, remove\``
				},
				"NOT_VALID_COMMAND" : {
					color: palette.red, 
					text: `I cannot find that sub-command... ${emoji(`aauWallSlam`,bot)}`
				},
				"TEST" : {
					color: palette.golden, 
					text: `Hello! ${emoji(`aauinlove`,bot)}`
				},
				"ERROR" : {
					color: palette.red, 
					text: `I have run into an error... ${emoji(`aauWallSlam`,bot)}`
				},
				"INVALID_TAG_LENGTH" : {
					color: palette.red,
					text: `The tag must be 10 characters or less... ${emoji(`aauWallSlam`,bot)}`
				},
				"INVALID_USER" : {
					color: palette.red,
					text: `I couldn't find that user... ${emoji(`aauWallSlam`,bot)}`
				}
			}
			const displist =[]
			loglist.forEach((code, i) => {
				displist[i] = logtable[code].text
			})
			return msg.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join(``)}`)
		}

        
		/***************************************************************************************************
         * UTILITY COMMANDS
         ***************************************************************************************************/
		let help = {
			metadata: new Metadata(`help`)
				.setInfo(`Displays complete guide of this subcommand.`)
				.setAccess({ roles: `test` }),

			execute: async(metadata) => {

				let style = `HTTP`
				let bold = `**`
				metadata.arguments.forEach((e, i)  => metadata.arguments[i] = `<${e}>`)

				msg .clearData()
					.setColor(palette.darkmatte)
					.setDescription(`
                        Command Shortcut:   ${msg.codeBlock(`${cmdpath.join(` `)} ${metadata.arguments.join(` `)}`, `yaml`, bold)}
                        Information:        ${msg.codeBlock(metadata.info, style, bold)}
                        Subcommands List:   ${msg.codeBlock(new Subcommand(metadata).formattedinvokerCommandList(), style, bold)}`)

				if (args[0] === `DEVMODE`) return msg
					.setDescription(`
                        Command Shortcut:   ${msg.codeBlock(`${cmdpath.join(` `)} ${metadata.arguments.join(` `)}`, `yaml`, bold)}
                        Information:        ${msg.codeBlock(metadata.info, style, bold)}
                        Formal Name:        ${msg.codeBlock(metadata.name, style, bold)}
                        Alias:              ${msg.codeBlock(metadata.alias.length ? metadata.alias.join(`, `) : `--`, style, bold)}
                        Subcommand List:    ${msg.codeBlock(new Subcommand(metadata).formattedinvokerCommandList(), style, bold)}
                        Access Permissions: ${msg.codeBlock(JSON.stringify(metadata.access).replace(/{|"|}/g,``).replace(/,/g,`\n`).replace(/:/g,`: `), style, bold)}`)
					.setFooter(`${user.name} | Developer Mode`)
					.send()
				else return msg.send()
			}
		}

		/***************************************************************************************************
         * ♡♡♡ TESTING ♡♡♡
         ***************************************************************************************************/
		let test_userNicknameChange = {
			metadata: new Metadata(`namechange`)
				.setAlias([`nickname`, `change`])
				.setInfo(`Change a user's nickname.`)
				.setArguments([`target user`, `new nickname`])
				.setAccess({ roles: `developer` })
				.setInput({ 
					prompt: msg.codeBlock(`[Target User] 🡆 [New Nickname]`,`ini`,`**`),
					require: true
				}),

			execute: async(metadata) => {
				target = await new User(args[0]).init()
				if (target.exists) {
					let old_nickname = target.nickname
					try {
						await target._setNickname(args[1])
						msg .clearData()
							.setColor(`#0099ff`)
							.setDescription(msg.codeBlock(`[${old_nickname}] 🡆 [${target.nickname}]`,`ini`,`**`))
							.setFooter(`Completed.`)
							.send()
					} catch (e) { return msg.embedWrapper(palette.red, `Sorry ${user.name}... I couldn't change this user's nickname!`) }
				} else return msg.embedWrapper(palette.red, `Sorry, I couldn't find: \`${target.input}\``)
			}
		}

		let test_userFind = {
			metadata: new Metadata(`userfind`)
				.setAlias([`userdata`, `userinfo`, `user`, `find`])
				.setInfo(`Used to find all user information.`)
				.setArguments(`username (optional)`)
				.setAccess({ roles: `developer` }),

			execute: async(metadata) => {

				if (args.length === 0) target = user
				else if (args.length >= 1) target = await new User(args.join(` `)).init()
				else return msg.embedWrapper(palette.golden, `User Info Find: \`${prefix}${commandname} find <Blank or Target User>\``)

				if (target.exists) {

					let style = `HTTP`
					return msg
						.clearData()
						.setAuthor(user.name, user.pfp)
						.setColor(palette.darkmatte)
						.addField(`Search Input:`,      msg.codeBlock(target.input, style))
						.addField(`User ID:`,           msg.codeBlock(target.id, style))
						.addField(`User Name:`,         msg.codeBlock(`${target.name}#${target.discriminator}`, style))
						.addField(`Nickname:`,          msg.codeBlock(target.nickname, style))
						.addField(`Profile Image URL:`, msg.codeBlock(target.pfp, style))
						.addField(`Clan Tag:`,          msg.codeBlock(target.nametag, style))
						.addField(`Level:`,             msg.codeBlock(target.level, style))
						.addField(`Balance:`,           msg.codeBlock(`${msg.formatComma(target.artcoins)} Artcoins`, style))
						.addField(`Roles:`,             msg.codeBlock(JSON.stringify(target.roles).replace(/{|"|}/g,``).replace(/,/g,`\n`).replace(/:/g,` : `), style))
						.send()
				} else return log(`GREET_APOLOGY LB INVALID_USER`) 

			}
		}

		let test_sendMessage = {
			metadata: new Metadata(`message`)
				.setAlias([`send`, `msg`])
				.setInfo(`Sends a test message.`)
				.setAccess({ roles: `developer` }),

			execute: async(metadata) => {

				return msg 
					.clearData()
					.setColor(`#0099ff`)
					.setAuthor(`Requested by: ${user.name}`, user.pfp)
					.setDescription(`Here's Naphy's favorite .gif for you. ♡`)
					.setImage(`https://i.kym-cdn.com/photos/images/newsfeed/000/751/316/ede.gif`)
					.send()

			}
		}

		let test_botCommand = {
			metadata: new Metadata(`bot_command`)
				.setInfo(`Only availible to \'bot\' role.`)
				.setAccess({ roles: `bot` }),

			execute: async(metadata) => {
				msg.embedWrapper(palette.white, `Hello, I see you are a bot!`)
			}
		}

		let test_2 = {
			metadata: new Metadata(`test2`)
				.setAlias([`2`, `22`, `222`])
				.setInfo(`Test Info for Test 2`)
				.setArguments(`clan name`)
				.setAccess({ roles: `developer` })
				.setInput({ 
					prompt: msg.codeBlock(`[Clan Name] 🡆 Find Clan Data`,`ini`,`**`),
					require: true
				}),
                
			execute: async(metadata) => {
				let clan = await new Clan(args[0]).init()
				console.log(clan)
			}
		}

		let test_1 = {
			metadata: new Metadata(`test1`)
				.setAlias(`1`)
				.setInfo(`Test Info for Test 1`)
				.setCommandList(test_2)
				.setAccess({ roles: `developer` }),

			execute: async(metadata) => {
				let markdown = `HTTP\n`
				msg.embedWrapper(palette.green,  
					`__**Clan Creation Form**__
                    ★ Please respond with the following format:
                    ★ *You may use* \`[shift] + [enter]\` *for a new line!*
                    \`\`\`${markdown}Name: <clan name here>\nTag: <clan tag here>\nMotto: <clan description/motto here>\`\`\`
                    **Example:**
                    \`\`\`${markdown}Name: Debauchery Tea Party\nTag: Tea Party\nMotto: We love tea~ ♡\`\`\``) 
				msg.embedWrapper(palette.golden, 
					`★ \`CANCEL\`, \`EXIT\`, \`QUIT\` will terminate this session!
                    *${user.name}, I'll be waiting for your msg~* ${emoji(`aauinlove`,bot)}`)
					.then(async prompt_message => {
						collector.on(`collect`, async (userreply) => {
							prompt_message.delete()
							userreply.delete()
        
							let user_input = userreply.content
							msg.embedWrapper(palette.green, 
								`Thank you for your msg!
                                **User Input:** ${user_input}`)
                            
						})
					})
			}
		}
		/***************************************************************************************************
         * TIER 2 COMMANDS
         ***************************************************************************************************/

		/***************************************************************************************************
         * TIER 1 COMMANDS
         ***************************************************************************************************/
		let clanCreation = { 
			metadata: new Metadata(`create`)
				.setAlias(`make`)
				.setInfo(`Clan Create Info Here.`)
				.setArguments([`Clan Name`,`Clan Tag`,`Clan Motto`])
				.setAccess({ 
					roles: `test`,
					level: -1
				})
				.setInput({
					prompt: msg.codeBlock(`[Clan Information] 🡆 Create New Clan`,`ini`,`**`),
					require: true
				}),

			execute: async(metadata) => {

				let name = args[0]
				let tag = args[1].slice(0,10)
				let motto = args[2]

				let roledata = {
					name: args[0],
					position: message.guild.roles.find(x => x.id === `598256155235582047`).position - 1,
					permissions: 0x00,
				}

				msg .clearData()
					.setColor(palette.golden)
					.setDescription(msg.codeBlock(`
                        • Name  : ${name}
                        • Tag   : ${tag}
                        • Motto : ${motto}`,`HTTP`,`**`))
					.setFooter(`Confirm? ( Y / N )`)
					.send()
					.then(async confimration => {
						await message.channel.awaitMessages(authorfilter, { maxMatches: 1, time: timeout1 })
							.then(async collected => {

								await pause(delay)
								await collected.first().delete()
								await confimration.delete()
								if (collected.first().content.toLowerCase() === `y` || collected.first().content.toLowerCase() === `yes`)
									msg.sendRaw(`\`Creating new clan . .\``).then(async loading => {

										let clanrole = await (message.guild.createRole(roledata, `New Clan Created!`))
										await sql.run(`INSERT INTO clandata (id, name, tag, motto, color, leader, maxmembers, foundingdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
											[clanrole.id, name, tag, motto, null, user.id, 5, Date.now()])
										await loading.delete()
										msg .clearData()
											.setColor(palette.darkmatte)
											.setDescription(msg.codeBlock(`[${name}] 🡆 New Clan Created!`,`ini`,`**`))
											.setFooter(`Completed.`)
											.send()
										return
									})
							})
					})

			}
            
		} 

		let clanManagement = {
			metadata: {
				name: `manage`,
				alias: [`management`, `settings`],
				commandlist: [help]
			},
			execute: async(metadata) => {
				return msg.embedWrapper(palette.green, `Executing Clan Management!`)  
			}
		}

		/***************************************************************************************************
         * EXECUTION:
         ***************************************************************************************************/
		let clanMain = {
			metadata: new Metadata(`clan`)
				.setInfo(`Main clan interface command.`)
				.setArguments(`subcommand`)
				.setCommandList([
					//clanManagement,
					clanCreation,
					test_botCommand,
					test_userNicknameChange,
					test_userFind,
					test_sendMessage,
					test_1,
					test_2
				])
				.setAccess({ roles: `public` }),

			execute: async() => {

				let subcommand = await new Subcommand(clanMain.metadata).init()
				if (subcommand.exists) return await subcommand.execute()
				else msg.sendRaw(`\`Loading Clan Interface . .\``).then(async loading => {
					args = []
					await msg
						.clearData()
						.attachFiles([`./images/clan_banner.png`])
						.setColor(promptcolor)
						.setDescription(`${msg.codeBlock(new Subcommand(clanMain.metadata).formattedinvokerCommandList(),`HTTP`,`**`)}`)
						.send()
						.then(async claninterface => {
							await loading.delete()
							await pause(delay)
							let subcommand
							let terminate = false
							msg .clearData()
								.setColor(collectorcolor)
								.setDescription(msg.codeBlock(`subcommand?`,`CSS`,`**`))
								.setFooter(`Type \'cancel\' to quit.`)

							await msg.send().then(async m => {
								await message.channel.awaitMessages(authorfilter, { maxMatches: 1, time: timeout1, errors: [`time`]})
									.then(async collected => {
										await pause(delay)
										await collected.first().delete()
										await m.delete()
										args.push(collected.first().content);
										[`CANCEL`, `EXIT`, `QUIT`].forEach(e => { if (e === collected.first().content.toUpperCase()) return terminate = true })
										subcommand = await new Subcommand(clanMain.metadata).init()
										if (!terminate && !subcommand.exists) {
											await pause(delay)
											msg.embedWrapper(palette.darkmatte, `**\`${args[0]}\`** is not a valid subcommand.`)
											return terminate = true
										}
									})
									.catch(async () => { await m.delete(); return terminate = true })
							})
                            
							//await claninterface.delete()
							await pause(delay)
							if (!terminate) return subcommand.execute()
						})
				})

			}
		}
            
		return clanMain.execute()
	}
}

module.exports.help = {
	start: clan_wrapper,
	name: `clan`,
	aliases: [`guild`, `yuuni`, `yunyun`, `yun`],
	description: `Clans`,
	usage: `clan2`,
	group: `Admin`,
	public: false,
	required_usermetadata: true,
	multi_user: false
}