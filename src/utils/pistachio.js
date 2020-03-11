const { RichEmbed, Attachment, MessageCollector } = require(`discord.js`)
const fsn = require(`fs-nextra`)
const fs = require(`fs`)
const path = require(`path`)
const { get } = require(`snekfetch`)
/**
 *  @class Pistachio
 *  @version 0.2.0
 *  @since 27/02/20
 *  @classdesc Micro framework to support Annie's structure.
 *  Lightweight, portable and opinionated.
 *  This was originally made by Pan to aggregate all the essential
 *  functions as a single package of utils.
 *  But since then, it got bigger and putting much advantage into our 
 *  day to day workflow,
 *  It might be a good idea to give it a unique name
 *  so here is our smol Pistachio !
 */
class Pistachio {
	/**
	 * @param {Object} Components must atleast include <Message> Object and Annie's <Client> instance.
	 */
	constructor(Components) {
		this.components = Components
	}
	
	bag() {

		//  Get main this.components to make pistachio works
		let { bot, message } = this.components
		// Initialize default container
		let container = { ...this.components }
		//  Storing colorset
		container.palette = require(`./colorset`)

		if (message){
			if (message.member && message.guild) {
				/**
				 * ------------------------
				 *  User Permissions-Level
				 * ------------------------
				 */
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
				 *  @description Delete bulk of messages in current channel
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
				 *  @description (Multi-layering)Instant message collector
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
				 * @description To check whether the user has the said role or not
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
			//  Method inside this statement only available to use when msg's property {required_usermetada} is set to true.
			if(this.components.meta.author) {
				/**
				 * @description Check whether the user is trying to gift/rep/send money to themselves.
				 * @returns {Boolean}
				 */
				container.selfTargeting = this.components.meta.author.id === message.author.id ? true : false
			}
			
			/**
			 * @description Uses raw Discord.RichEmbed to build custom avatar message.
			 * @param {String|ID} userId target user's avatar to be pulled from
			 */
			container.avatarWrapper = (userId=``) => {
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
				const [Avatar, Name] = [container.avatar(userId), container.name(userId)]
				const embed = new RichEmbed()
					.setImage(Avatar)
					.setAuthor(Name, Avatar)
					.setColor(container.palette.darkmatte)
					
			
				return message.channel.send(embed)
					.then(() => {
						message.channel.send(randomReactions)
					})
			}
		}
		
		/**
		 * @description Automatically convert any weird number notation into a real value.
		 * @param {String} str target string
		 * @returns {Number/NaN}
		 */
		container.trueInt = (str=``) => {
			return (!Number.isNaN(Number(str)) && !(Math.round(Number(str)) <= 0) && Number.isFinite(Number(str))) 
				? Math.round(Number(str)) : NaN
		}

		/**
		 *  @description Fetch user's username based on given user id. Fallback as 'unknown' if user is not fetchable.
		 *  @param {String} userId target user
		 *  @returns {String}
		 */
		container.name = (userId=``) => {
			return bot.users.get(userId).username || `unknown`
		}

		/**
		 *  @description An Emoji finder. Fetch all the available emoji based on given emoji name
		 *  @param {String} name emoji name
		 *  @returns {Emoji|String}
		 */
		container.emoji = (name=``) => {
			return bot.emojis.find(e => e.name === name) || `(???)`
		}

		/**
		 *  @description Add comma separator on given number. Only applies to number above 3 digits.
		 *  @param {Number|Integer} number target number to be parsed from
		 *  @returns {Number|Integer}
		 */
		container.commanifier = (number=0) => {
			return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`)
		}

		/**
		 *  @description Get closest upper element from an array
		 *  @param {Array} array target array
		 *  @param {Number|Integer} val value to be looked on
		 *  @returns {ElementOfArray}
		 */
		container.closestUpper = (array=[], val=1) => {
			return Math.min.apply(null, array.filter(function (v) {
				return v > val
			}))
		}

		/**
		 *  @description Get closest previous element from an array
		 *  @param {Array} array target array
		 *  @param {Number|Integer} val value to be looked on
		 *  @returns {ElementOfArray}
		 */
		container.closestBelow = (array=[], val=1) => {
			return Math.max.apply(null,array.filter(function(v)
			{ return v <= val }))
		}

		/**
		 * @description Removes first few non-alphabet characters from a string.
		 * @param {String} str target string
		 * @returns {String}
		 */
		container.relabel = (str=``) => {
			let res = str.replace(/[^A-Za-z]+/, ``)
			return res
		}

		/**
		 * @description Output bot's current latency in rounded format
		 * @returns {String}
		 */
		container.ping = container.commanifier(Math.round(bot.ping))

		/**
		 * Randomize and pick one of the element of given array.
		 * @param {Array} arr target array to be choose from
		 * @returns {ElementOfArray}
		 */
		container.choice = (arr=[]) => {
			return arr[Math.floor(Math.random() * arr.length)]
		}

		/**
		 * @description Bite-sized promise. The task will be freezed for given x milliseconds 
		 * until prompted to run the next task.
		 * @param {Integer/Number}
		 */
		container.pause = (ms=0) => {
			return new Promise(resolve => setTimeout(resolve, ms))
		}, 

		/**
		 * @description Normalizing string. First character will be lowercased and 
		 * the "s" at the end of string will be removed as well.
		 * @param {String} string target string
		 * @returns {String}
		 */
		container.normalizeString = (string=``) => {
			string = string.charAt(0).toLowerCase() + string.slice(1)
			if (string.endsWith(`s`)) {
				string = string.slice(0, -1)
			}
			return string
		}

		/**
		 *  @description Load image based on given id from default ./src/images/ directory.
		 *  @param {String} id filename 
		 *  @returns {Buffer}
		 */
		container.loadAsset = async (id=``) => {
			// List all files in a directory in Node.js recursively in a synchronous fashion
			const walkSync = (dir, filelist = []) => {
				fs.readdirSync(dir).forEach(file => {
					filelist = fs.statSync(path.join(dir, file)).isDirectory()
						? walkSync(path.join(dir, file), filelist)
						: filelist.concat(path.join(dir, file))
				})
				return filelist
			}
			let allFiles = walkSync(`./core/images`) // Starts with the main directory and includes all files in the sub directories
			let ultimateFile
			allFiles.forEach((file) => {
				if (file.includes(id)){ 
					let filePath = `./${file.replace(/\\/g, `/`)}`
					return ultimateFile = filePath
				}
			})
			if (!ultimateFile) {
				allFiles.forEach((f) => {
					if (f.includes(`error`)) {
						let filePath = `./${f.replace(/\\/g, `/`)}`
						return ultimateFile = filePath
					}
				})
			}
			return fsn.readFile(ultimateFile)
		}

		/**
		 * @description registering cooldown state for given label. (Example of
		 * label: modulename_userid)
		 * @param {String} label cooldown label
		 * @param {Integer/Number} timeout timeout in milliseconds until removed.
		 */
		container.setCooldown = async (label=``, timeout=5000) => {
			await bot.keyv.set(label, `1`, timeout)
			bot.logger.verbose(`${timeout/1000}s cooldown state has been set for ${label}`)
		}

		/**
		 * @description check cooldown state for given label. (Example of
		 * label: modulename_userid)
		 * @param {String} label cooldown label
		 * @returns {Boolean}
		 */
		container.isCooldown = async (label=``) => {
			const inCooldownState = await bot.keyv.get(label)
			if (inCooldownState) {
				bot.logger.verbose(`Access denied for ${label} (currently cooling down)`)
				return true
			}
			return false
		}

		/**
		 *	@description Handles user's avatar fetching process. Set `true` on
		 *  second param to return as compressed buffer. (which is needed by canvas)
		 *	@param {String|ID} id id of user to be fetched from.
		 *	@param {Boolean} compress set true to return as compressed buffer.
		 */
		container.avatar = (id, compress = false, size = `?size=512`) => {
			try {
				let url = bot.users.get(id).displayAvatarURL
				if (compress) {
					return get(url.replace(/\?size=2048$/g, size))
						.then(data => data.body)
				}

				return url
			}
			catch(e) { return container.loadAsset(`error`) }
		}

		/**
		 * 	@description Get the min/max or the calculated curve on given currentexp.
		 *  @param {Number/Integer} currentExp
		 */
		container.getExpMetadata = (currentExp=0) => {
			const formula = (exp) => {
				if (exp < 100) {
					return {
						level: 0,
						maxexp: 100,
						nextexpcurve: 100,
						minexp: 0
					}
				}
	

				let level = Math.sqrt(4 * exp - 375) / 20 - 0.25
				level = Math.floor(level)
				let maxexp = 100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100
				let minexp = 100 * (Math.pow(level, 2)) + 50 * level + 100
				let nextexpcurve = maxexp - minexp
				level = level + 1
	
				return {
					level: level,
					maxexp: maxexp,
					nextexpcurve: nextexpcurve,
					minexp: minexp
				}
			}
	
			const accumulatedCurrent = Math.floor(currentExp)
			const main = formula(accumulatedCurrent)
			let level = main.level
			let maxexp = main.maxexp
			let nextexpcurve = main.nextexpcurve
			let minexp = main.minexp
			return {level,maxexp,nextexpcurve,minexp}
		}

		/**
		 *  @description Prettify result of user's owned gifts
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
		 * @description Formatting each paragraph. Mainly used to format profile card's description/bio
		 * @param {String} string of user description.
		 * @param {Number|Integer} numlines of paragraph.
		 */
		container.formatString = (string=``, numlines=0) => {
			var paraLength = Math.round((string.length) / numlines)
			var paragraphs = []
			var marker = paraLength
			for (var i = 0; i < numlines; i++) {
				//if the marker is right after a space, move marker back one character
				if (string.charAt(marker - 1) == ` `) {
					marker--
				}

				//if marker is in middle of word, try moving to the back of the word
				//but at most 5 characters
				for (var j=0; j<5;j++) {
					if (string.charAt(marker) != ` ` && string.charAt(marker) != ``) {
						marker = marker+j
					}
				}

				//if can't move to back of word, more to front instead
				while (string.charAt(marker) != ` ` && string.charAt(marker) != ``) {
					marker--
				}
				var nextPara = string.substring(0, marker)

				paragraphs.push(nextPara)
				string = string.substring((nextPara.length + 1), string.length)
			}
			if (string) {
				paragraphs.push(string)
			}
			return {
				first: paragraphs[0],
				second: paragraphs[1]?paragraphs[1]:``,
				third: paragraphs[2]?paragraphs[2]:``,
				fourth: paragraphs[3]?paragraphs[3]:``
			}
		}

		/**
		 * @description Splits array items into chunks of the specified size
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

		/**
		 * @description Mainly used to socket a socketable message like in Annie's System Locales.
		 * @param {String} content target string
		 * @param {Array} socket an array of sockets to be applied from.
		 * @returns {String}
		 */
		container.socketing = (content=``,socket=[]) => {
			for(let i = 0; i < socket.length; i++) {
				if (content.indexOf(`{${i}}`) != -1) content = content.replace(`{${i}}`, socket[i])
			}
			return content
		}

		/** @description Annie's custom message system.
		 *  @param {String} content as the message content
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
			author: null,
			simplified: false,
			notch: false,
			thumbnail: null,
			deleteIn: 0,
			prebuffer: false,
			header: null,
			footer: null,
			customHeader: null,
			timestamp: false
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
			options.author = !options.author ? null : options.author
			options.footer = !options.footer ? null : options.footer
			options.customHeader = !options.customHeader ? null : options.customHeader
			options.timestamp == false ? null : options.timestamp = true

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
				.setDescription(content)
				.setThumbnail(options.thumbnail)

			//  Add header
			if(options.header) embed.setAuthor(options.header, container.avatar(message ? message.author.id : options.author.id))

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
