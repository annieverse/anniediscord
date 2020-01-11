const { RichEmbed, Attachment, MessageCollector } = require(`discord.js`)
const databaseManager = require(`./databaseManager`)
const fsn = require(`fs-nextra`)
const { get } = require(`snekfetch`)
/**
 *  Micro framework to support Annie's structure
 *  Lightweight, portable and opinionated
 *  @Pistachio
 *  
 *  This was originally made by Pan to aggregate all the essential
 *  functions as a single package of utils.
 *  But since then, it got bigger and putting much advantage into our 
 *  day to day workflow,
 *  It might be a good idea to give it a unique name
 *  so here our smol @Pistachio !
 *  
 */
class Pistachio {
	constructor(Components) {
		this.components = Components
	}
	

	/**
	 * 	This is the default method to pull standard Pistachio's Components
	 * 	@bag
	 */
	bag() {
		//  Get main this.components to make pistachio works
		let { bot, message } = this.components

		// Initialize default container
		let container = { ...this.components }

		//  Storing message codes
		container.code = require(`./predefinedMessages`)

		// Storing file paths
		container.paths = require(`./filePaths.json`)

		//  Storing colorset
		container.palette = require(`./colorset`)

		//  Storing role ids
		container.roles = require(`./role-list`)

		//  Storing functions.js functions
		container.utils = require(`./functions`)(bot, message)

		//  Storing transaction checkout handler
		container.Checkout = require(`./transactionCheckout`)
		
		//  Storing main transaction handler
		container.Transaction = require(`./transactionHandler`)

		//  Storing environment.json keys
		container.environment = require(`../../.data/environment.json`)

		//  Storing cards data
		container.metacards = require(`./cards-metadata`)

		//  Get user metadata manager
		container.Data = require(`./userdataSelector`)

		//  Get event-discussion channel object
		container.eventLobby = bot.channels.get(`460615157056405505`)

		//  Get general aau channel object
		container.world = bot.channels.get(`459891664182312982`)

		//  Get gacha-unlocked channel
		container.gachaField = bot.channels.get(`485922866689474571`)

		//  Sub-pistachio which require guild properties and not in DM.
		if (message.member && message.guild) {

			//  Check if current channel is included in gacha-allowed list
			container.isGachaField = [bot.channels.get(`485922866689474571`).name, bot.channels.get(`614737097454125056`).name].includes(message.channel.name)

			//  Check for administrator authority
			container.isAdmin = message.member.hasPermission(`ADMINISTRATOR`)

			// Check for moderator authority
			container.isModerator = message.member.hasPermission(`MANAGE_ROLES`)

			//  Check for developer authority
			container.isDev = container.roles.annie_developer.includes(message.member.id)

			//  Check for event team authority
			container.isEventManager = message.member.roles.find(r => r.id === `591050124114001952`)

			// Check for staff team authority
			container.isStaff = message.member.roles.find(r => Object.keys(container.roles.teams).some(i => container.roles.teams[i] == r.id))

			//  Check for booster user
			container.isVIP = message.member.roles.find(r => r.id === `585550404197285889`)

			// Check for event team authority
			container.isEventMember = message.member.roles.find(r => Object.keys(container.roles.events).some(i => container.roles.events[i] == r.id))


			/**
			 *  Delete bulk of messages in current channel
			 *  @param {Integer} amount must be atleast above zero.
			 */
			container.deleteMessages = (amount = 1) => message.channel.bulkDelete(amount)

			
			/**
			 *  Instant message collector
			 *  @param {Default} max only catch 1 response
			 *  @param {Default} time 60 seconds timeout
			 */
			container.collector = new MessageCollector(message.channel,
				m => m.author.id === message.author.id, {
					max: 1,
					time: 60000,
				})


			/**
			 *  (Multi-layering)Instant message collector
			 *  @param {Object} msg current message instance
			 *  @param {Default} max only catch 1 response
			 *  @param {Default} time 60 seconds timeout
			 */
			container.multicollector = (msg = {}) => new MessageCollector(msg.channel,
				m => m.author.id === msg.author.id, {
					max: 1,
					time: 60000,
				})


			/**
			 * To check whether the user has the said role or not
			 * @param {String} rolename for role name code
			 * @return {Boolean} of role
			 * @hasRole
			 */
			container.hasRole = (rolename = ``) => {
				return message.member.roles.find(r => r.name === rolename || r.id === rolename)
			}

			/**
			 * Returning of given role name
			 * @param {String} rolename for role name code
			 * @return {Object} of role
			 * @addRole
			 */
			container.addRole = (rolename = ``, user = message.author.id) => {
				return message.guild.member(user).addRole(message.guild.roles.find(r => r.name === rolename || r.id === rolename))
			}

			/**
			 * Returning of given role name
			 * @param {String} rolename for role name code
			 * @return {Object} of role
			 * @addRole
			 */
			container.removeRole = (rolename = ``, user = message.author.id) => {
				return message.guild.member(user).removeRole(message.guild.roles.find(r => r.name === rolename || r.id === rolename))
			}
		}

		//  Automatically convert weird number notation into real value.
		container.trueInt = (str) => {
			return (!Number.isNaN(Number(str)) && !(Math.round(Number(str)) <= 0) && Number.isFinite(Number(str))) 
				? Math.round(Number(str)) : NaN
		}

		//  Returns username based on the id.
		container.name = (id) => {
			return bot.users.get(id).username
		}

		//  Wrapping out avatar message.
		container.avatarWrapper = (id) => {
			message.react(`📸`)
			const reactions = [
				`Amazing!`,
				`I wuv it ❤`,
				`Awesome art!`,
				`Magnificent~`,
				`#2k19 #topselfie`,
				`Beautiful!!`,
				`Avatar of the day!`
			]
			const randomReactions = reactions[Math.floor(Math.random() * reactions.length)]
			const [Avatar, Name] = [container.avatar(id), container.name(id)]
			const embed = new RichEmbed()
				.setImage(Avatar)
				.setAuthor(Name, Avatar)
				.setColor(container.palette.darkmatte)
				
		
			return message.channel.send(embed)
				.then(() => {
					message.channel.send(randomReactions)
				})
		}


		//  An emoji finder. Returns as unicode
		container.emoji = (name) => {
			try {
				return bot.emojis.find(e => e.name === name)
			} catch (e) {
				throw new TypeError(`${name} is not a valid emoji.`)
			}
		}

		//  Format numbers with more than 3 digits
		container.commanifier = (number = 0) => {
			return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`)
		}

		//  Get closest upper element from an array
		container.closestUpper = (array, val) => {
			return Math.min.apply(null, array.filter(function (v) {
				return v > val
			}))
		}

		//  Removing first few non-alphabet character from string
		container.relabel = (str) => {
			let res = str.replace(/[^A-Za-z]+/, ``)
			return res
		}

		//  Outputing bot's ping
		container.ping = container.commanifier(Math.round(bot.ping))

		//  Returns random index of elemenet from given array
		container.choice = (arr = []) => {
			return arr[Math.floor(Math.random() * arr.length)]
		}

		/**
		 * Lifesaver promise. Used pretty often when calling an API.
		 * @pause
		 */
		container.pause = (ms) => {
			return new Promise(resolve => setTimeout(resolve, ms))
		}, // End of pause


		// Lowercase first letter and de-plural string.
		container.normalizeString = (string) => {
			string = string.charAt(0).toLowerCase() + string.slice(1)
			if (string.endsWith(`s`)) {
				string = string.slice(0, -1)
			}
			return string
		}

		//  Inside this statement only available to use when required_usermetada is true.
		if(this.components.meta.author) {
			//  Check whether the user is trying to gift/rep/send money to themselves. Returns boolean.
			container.selfTargeting = this.components.meta.author.id === message.author.id ? true : false
			//  Initializing database class
			container.db = (id = this.components.meta.author.id) => new databaseManager(id)
		}
		//  Load asset from default images dir
		container.loadAsset = async (id) => {
			return fsn.readFile(`./core/images/${id}.png`).catch(async ()=>{return fsn.readFile(`./core/images/halloween/${id}.png`)})
		}


		//  Load cached pixiv image on root
		container.loadPixivCaches = async (id) => {
			return fsn.readFile(`./${id}`).catch(async ()=>{return fsn.readFile(`./core/images/halloween/${id}.png`)})
		}


		/**
		 * ------------------------------------------------
		 * Cooling down system -> Pistachio's CD Cluster
		 * 
		 * Future plan: move these sub container into its own Class Module.
		 * ------------------------------------------------
		 */

		container.setCooldown = async (label=String, timeout=5000) => {
			bot.keyv.set(label, `1`, timeout)
			bot.logger.info(`${timeout/1000}s cooldown state has been set for ${label}`)
		}
		container.isCooldown = async (label=String) => {
			const inCooldownState = await bot.keyv.get(label)
			if (inCooldownState) {
				bot.logger.info(`Access denied for ${label} (currently cooling down)`)
				return true
			}
			return false
		}


		/**
		 *	Handles user's avatar fetching process.
		 *	Set `true` on second param to return as compressed buffer. (which is needed by canvas)
		 *	@param {String|ID} id id of user to be fetched from.
		 *	@param {Boolean} compress set true to return as compressed buffer.
		 */
		container.avatar = (id, compress = false, size = `?size=512`) => {

			const fallbackImage = (err) => {
				bot.logger.error(`Failed to parse user's avatar. User will see a placeholder img as an exchange. > ${err}`)
				return container.loadAsset(`error`)
			}
		
			try {
				let url = bot.users.get(id).displayAvatarURL
				if (compress) {
					return get(url.replace(/\?size=2048$/g, size))
						.then(data => data.body)
						.catch(e => { return fallbackImage(e) })
				}

				return url
			}
			catch(e) { return fallbackImage(e) }
		}


		/**
		 *  Request mutation data
		 *  @param {String} id target user's id. Message author is the default id. 
		 */
		container.reqData = async (id = message.author.id) => {
			const mutatedComponents = {args: [id], bot, message: message, commandfile: {help: {multi_user: false}}}
			const metadata = await new container.Data(mutatedComponents).pull()
			return metadata
		}

		/**
		 *  Prettify result of user's owned gifts
		 *  @param {Object} metadata Gifts metadata. Giving information of each reps point.
		 *  @param {Object} userInventory User inventories metadata.
		 */
		container.parsingAvailableGifts = (metadata = {}, userInventory = {}) => {
			let obj = {}
			let itemdata = ``
			let giftItems = Object.keys(metadata)

			//  Store items
			for (let i = 0; i < giftItems.length; i++) {
				if (userInventory[giftItems[i]] > 0) obj[giftItems[i]] = userInventory[giftItems[i]]
			}
			
			//  Parse string
			for (let key in obj) {
				itemdata += `> ${container.emoji(key.toString())}**${obj[key]}x ${key}**\n`
			}

			//  Returns
			if (itemdata.length < 1) return null

			let str = `${itemdata}\n\n Above are all your available gifts. Please type **<amount> <itemname>** to send the gift.`
			return str
		}

		/**
		 * Splits array items into chunks of the specified size
		 * @param {Array|String} items
		 * @param {Number} chunkSize
		 * @returns {Array}
		 */
		container.chunk = (items, chunkSize) => {
			const result = []

			for (let i = 0; i < items.length; i += chunkSize) {
				result.push(items.slice(i, i + chunkSize))
			}

			return result
		}

		container.socketing = (content,socket) => {
			for(let i = 0; i < socket.length; i++) {
				if (content.indexOf(`{${i}}`) != -1) content = content.replace(`{${i}}`, socket[i])
			}
			return content
		}
		/** Annie's custom system message.
		 *  @param content as the message content
		 *  @param {Array} socket is the optional message modifier. Array
		 *  @param {ColorResolvable} color for the embed color. Hex code
		 *  @param {Object} field as the message field target (GuildChannel/DM). Object
		 *  @param {ImageBuffer} image as the attachment url. Buffer
		 *  @param {Boolean} simplified as non embed message toggle. Boolean
		 *  @param {ImageURL} thumbnail as embed icon. StringuRL
		 *  @param {Boolean} notch as huge blank space on top and bottom
		 *  @param {ImageBuffer|ImageURL} thumbnail as message icon on top right
		 *  @param {Integer} deleteIn as countdown before the message get deleted. In seconds.
		 *  @param {Boolean} prebuffer as indicator if parameter supply in "image" already contains image buffer.
		 *  @param {String} header use header in an embed.
		 *  @param {Array} customHeader First index as header text and second index as header icon.
		 */
		container.reply = async (content, options = {
			socket: [],
			color: ``,
			url: null,
			image: null,
			imageGif: null,
			field: message.channel,
			simplified: false,
			notch: false,
			thumbnail: null,
			deleteIn: 0,
			prebuffer: false,
			header: null,
			footer: null,
			customHeader: null
		}) => {
			options.socket = !options.socket ? [] : options.socket
			options.color = !options.color ? container.palette.darkmatte : options.color
			options.url = !options.url ? null : options.url
			options.image = !options.image ? null : options.image
			options.imageGif = !options.imageGif ? null : options.imageGif
			options.field = !options.field ? message.channel : options.field
			options.simplified = !options.simplified ? false : options.simplified
			options.thumbnail = !options.thumbnail ? null : options.thumbnail
			options.notch = !options.notch ? false : options.notch
			options.prebuffer = !options.prebuffer ? false : options.prebuffer
			options.header = !options.header ? null : options.header
			options.footer = !options.footer ? null : options.footer
			options.customHeader = !options.customHeader ? null : options.customHeader

			//  Socketing
			for (let i = 0; i < options.socket.length; i++) {
				if (content.indexOf(`{${i}}`) != -1) content = content.replace(`{${i}}`, options.socket[i])
			}

			//  Returns simple message w/o embed
			if (options.simplified) return options.field.send(content, options.image ? new Attachment(options.prebuffer ? options.image : await container.loadAsset(options.image)) : null)

			//  Add notch/chin
			if (options.notch) content = `\u200C\n${content}\n\u200C`


			const embed = new RichEmbed()
				.setColor(container.palette[options.color] || options.color)
				//	Ad inject
				.setDescription(content + `\n[Join my support server!](https://discord.gg/7nDes9P)`)
				.setThumbnail(options.thumbnail)

			//  Add header
			if(options.header) embed.setAuthor(options.header, container.avatar(message.author.id))

			//  Custom header
			if (options.customHeader) embed.setAuthor(options.customHeader[0], options.customHeader[1])

			//  Add footer
			if (options.footer) embed.setFooter(options.footer)

			// Add url
			if (options.url) embed.setURL(options.url)

			//  Add image preview
			if (options.imageGif) {
				embed.setImage(options.imageGif)
			} else if (embed.file) {
				embed.image.url = null
				embed.file = null
			}

			//  Add image preview
			if (options.image) {
				embed.attachFile(new Attachment(options.prebuffer ? options.image : await container.loadAsset(options.image), `preview.jpg`))
				embed.setImage(`attachment://preview.jpg`)
			} else if (embed.file) {
				embed.image.url = null
				embed.file = null
			}


			//  If deleteIn parameter was not specified
			if (!options.deleteIn) return options.field.send(embed)

			return options.field.send(embed)
				.then(msg => {
					//  Convert deleteIn parameter into milliseconds.
					msg.delete(options.deleteIn * 1000)
				})
		}
		
		return container
	}
}


module.exports = Pistachio
