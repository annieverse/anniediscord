const { RichEmbed, Attachment, MessageCollector } = require(`discord.js`)
const cron = require(`node-cron`)
const logger = require(`./logger`)
const fsn = require(`fs-nextra`)
const fs = require(`fs`)
const path = require(`path`)
const { get } = require(`snekfetch`)
/**
 *  @class Pistachio
 *  @version 0.4.0
 *  @classdesc Micro framework to support Annie's structure.
 *  Lightweight, portable and opinionated.
 *  This was originally made by Pan (our developer) to aggregate all the essential
 *  functions as a single package of utils.
 *  But since then, it got bigger and giving much advantage into our 
 *  development workflow, It might be a good idea to give it a unique name
 *  so here, It's our smol Pistachio !
 */
class Pistachio {
	/**
	 * @param {Object} [Components={}] must atleast include <Message> Object and Annie's <Client> instance.
	 */
	constructor(Components={}) {

		/**
		 * <AnnieClient> instance
		 * @since 1.0.0
		 * @type {AnnieClientObject}
		 */
		this.bot = Components.bot
		/**
		 * <Message> instance
		 * @since 1.0.0
		 * @type {MessageObject}
		 */
		this.message = Components.message

		/**
		 * Base Components
		 * @since 1.0.0
		 * @type {AnyComponents}
		 */
		this.components = Components

		/**
		 * Bind Methods
		 * @since 1.0.0
		 * @type {AnyComponents}
		 */	
		this.palette = require(`../ui/colors/default`)

		/**
		 * Check if <User> property is available in the components
		 * @since 6.0.0
		 * @type {Boolean}
		 */
		this._isUserMetaLayerAvailable = this.components.user || null
	
		/**
		 * Check if <Member> and <Guild> property is available in the message components
		 * @since 6.0.0
		 * @type {Boolean}
		 */
		this._isGuildLayerAvailable = this.message.member && this.message.guild ? true : false
		
		this.deleteMessages = this.deleteMessages.bind(this)
		this.collector = this.collector.bind(this)
		this.multiCollector = this.multiCollector.bind(this)
		this.removeRole = this.removeRole.bind(this)
		this.addRole = this.addRole.bind(this)
		this.findRole = this.findRole.bind(this)
		this.trueInt = this.trueInt.bind(this)
		this.name = this.name.bind(this)
		this.emoji = this.emoji.bind(this)
		this.commanifier = this.commanifier.bind(this)
		this.closestUpper = this.closestUpper.bind(this)
		this.closestBelow = this.closestBelow.bind(this)
		this.choice = this.choice.bind(this)
		this.relabel = this.relabel.bind(this)
		this.pause = this.pause.bind(this)
		this.loadAsset = this.loadAsset.bind(this)
		this.normalizeString = this.normalizeString.bind(this)
		this.avatar = this.avatar.bind(this)
		this.displayAvatar = this.displayAvatar.bind(this)
		this.getExpMetadata = this.getExpMetadata(this)
		this.parsingAvailableGifts = this.parsingAvailableGifts.bind(this)
		this.formatString = this.formatString.bind(this)
		this.chunk = this.chunk.bind(this)
		this.socketing = this.socketing.bind(this)
		this._registerPages = this._registerPages.bind(this)
		this.reply = this.reply.bind(this)
	}


	/**
	 *  ------------------------------------------
	 *  Guild-level Components
	 *  ------------------------------------------
	 */

	/**
	 *  Delete bulk of messages in current channel
	 *  @param {Integer} [amount=1] must be atleast above zero.
	 */
	deleteMessages(amount = 1) {
		if (!this._isGuildLayerAvailable) return
		return this.message.channel.bulkDelete(amount)
	}
	
	/**
	 *  Instant message collector
	 *  @param {MessageInstance} msg
	 *  @param {Default} [max=2] only catch 1 response
	 *  @param {Default} [timeout=60000] 60 seconds timeout
	 */
	collector(msg, max=2, timeout=60000) {
		if (!this._isGuildLayerAvailable) return
		return new MessageCollector(this.message.channel,
		m => m.author.id === this.message.author.id, {
			max: max,
			time: timeout,
		})
	}
	
	/**
	*  (Multi-layering)Instant message collector
	*  @param {Object} msg current message instance
	*  @param {Default} max only catch 1 response
	*  @param {Default} time 60 seconds timeout
	*/
	multiCollector(msg) {
		if (!this._isGuildLayerAvailable) return
		return new MessageCollector(msg.channel,
		m => m.author.id === msg.author.id, {
			max: 2,
			time: 60000,
		})
	}

	/**
	* Adding role to a user
	* @param {String} targetRole searchString keyword for the role
	* @param {String} userId user's discord id
	* @returns {RoleObject}
	*/
	addRole(targetRole, userId) {
		const fn = `[Pistachio.addRole()]`
		if (!this._isGuildLayerAvailable) return

		//  Use default lookup if supplied targetRole is not a <RoleObject>
		if (!targetRole.id) {
			const role = this.findRole(targetRole)
			if (!role.id) return logger.error(`${fn} cannot find role with keyword(${targetRole})`)
			logger.debug(`${fn} assigned ${role.name} to USER_ID ${userId}`)
			return this.message.guild.members.get(userId).addRole(role)
		}

		logger.debug(`${fn} assigned ${targetRole.name} to USER_ID ${userId}`)
		return this.message.guild.members.get(userId).addRole(targetRole)
	}

	/**
	* Removing role from user
	* @param {String} targetRole searchString keyword for the role
	* @param {String} userId user's discord id
	* @returns {RoleObject}
	*/
	removeRole(targetRole, userId) {
		const fn = `[Pistachio.removeRole()]`
		if (!this._isGuildLayerAvailable) return

		//  Use default lookup if supplied targetRole is not a <RoleObject>
		if (!targetRole.id) {
			const role = this.findRole(targetRole)
			if (!role.id) return logger.error(`${fn} cannot find role with keyword(${targetRole})`)
			logger.debug(`${fn} removed ${role.name} from USER_ID ${userId}`)
			return this.message.guild.members.get(userId).removeRole(role)
		}

		logger.debug(`${fn} removed ${targetRole.name} from USER_ID ${userId}`)
		return this.message.guild.members.get(userId).removeRole(targetRole)
	}

    /**
     * Finds a role by id, tag or plain name
     * @param {UserResolvable} target the keyword for the role (id, name, mention)
     * @returns {GuildMemberObject}
     */
	findRole(target) {
        const fn = `[Pistachio.findRole()]`
        if (!target) throw new TypeError(`${fn} parameter "target" must be filled with target role id/name/mention.`)
		try {
			const rolePattern = /^(?:<@&?)?([0-9]+)>?$/
			if (rolePattern.test(target)) target = target.replace(rolePattern, `$1`)
			const roles = this.message.guild.roles
			const filter = role => role.id === target ||
			role.name.toLowerCase() === target.toLowerCase() ||
			role === target

			return roles.filter(filter).first()
		}
		catch(e) {
			return {
				name: null,
				id: null
			}
		}
    }


	/**
	 *  ------------------------------------------
	 *  Flexible Components
	 *  ------------------------------------------
	 */
	/**
	 * Automatically convert any weird number notation into a real value.
	 * @author Fwubbles
	 * @param {String} str target string
	 * @returns {Number/NaN}
	 */
	trueInt(str=``) {
		return (!Number.isNaN(Number(str)) && !(Math.round(Number(str)) <= 0) && Number.isFinite(Number(str))) 
			? Math.round(Number(str)) : NaN
	}

	/**
	 *  Fetch user's username based on given user id. Fallback userId if user is not fetchable.
	 *  @param {String} userId target user
	 *  @returns {String}
	 */
	name(userId=``) {
		const user = this.bot.users.get(userId) 
		return user ? user.username : userId
	}

	/**
	 *  An Emoji finder. Fetch all the available emoji based on given emoji name
	 *  @param {String} name emoji name
	 *  @returns {Emoji|String}
	 */
	emoji(name=``) {
		return this.bot.emojis.find(e => e.name === name) || `(???)`
	}

	/**
	 *  Add comma separator on given number. Only applies to number above 3 digits.
	 *  @param {Number|Integer} number target number to be parsed from
	 *  @returns {Number|Integer}
	 */
	commanifier(number=0) {
		return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`) : 0
	}

	/**
	 *  Get closest upper element from an array
	 *  @param {Array} array target array
	 *  @param {Number|Integer} val value to be looked on
	 *  @returns {ElementOfArray}
	 */
	closestUpper(array=[], val=1) {
		return Math.min.apply(null, array.filter(function (v) {
			return v > val
		}))
	}

	/**
	 *  Get closest previous element from an array
	 *  @param {Array} array target array
	 *  @param {Number|Integer} val value to be looked on
	 *  @returns {ElementOfArray}
	 */
	closestBelow(array=[], val=1) {
		return Math.max.apply(null,array.filter(function(v)
		{ return v <= val }))
	}

	/**
	 * Removes first few non-alphabet characters from a string.
	 * @param {String} str target string
	 * @returns {String}
	 */
	relabel(str=``) {
		let res = str.replace(/[^A-Za-z]+/, ``)
		return res
	}

	/**
	 * Randomize and pick one of the element of given array.
	 * @param {Array} arr target array to be choose from
	 * @returns {ElementOfArray}
	 */
	choice(arr=[]) {
		return arr[Math.floor(Math.random() * arr.length)]
	}

	/**
	 * Bite-sized promise. The task will be freezed for given x milliseconds 
	 * until prompted to run the next task.
	 * @param {Integer/Number}
	 */
	pause(ms=0) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Normalizing string. First character will be lowercased and 
	 * the "s" at the end of string will be removed as well.
	 * @param {String} string target string
	 * @returns {String}
	 */
	normalizeString(string=``) {
		string = string.charAt(0).toLowerCase() + string.slice(1)
		if (string.endsWith(`s`)) {
			string = string.slice(0, -1)
		}
		return string
	}

	/**
	 *  Load image based on given id from default ./src/images/ directory.
	 *  @param {String} id filename 
	 *  @returns {Buffer}
	 */
	async loadAsset(id=``) {
		// List all files in a directory in Node.js recursively in a synchronous fashion
		const walkSync = (dir, filelist = []) => {
			fs.readdirSync(dir).forEach(file => {
				filelist = fs.statSync(path.join(dir, file)).isDirectory()
					? walkSync(path.join(dir, file), filelist)
					: filelist.concat(path.join(dir, file))
			})
			return filelist
		}
		let allFiles = walkSync(`./src/assets`) // Starts with the main directory and includes all files in the sub directories
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
	*	Handles user's avatar fetching process. Set `true` on
	*   second param to return as compressed buffer. (which is needed by canvas)
	*	@param {String|ID} id id of user to be fetched from.
	*	@param {Boolean} compress set true to return as compressed buffer.
	*/
	avatar(id, compress = false, size = `?size=512`) {
		try {
			let url = this.bot.users.get(id).displayAvatarURL
			if (compress) {
				return get(url.replace(/\?size=2048$/g, size))
					.then(data => data.body)
			}

			return url
		}
		catch(e) { return this.loadAsset(`error`) }
	}

	/**
	 * 	Get the min/max or the calculated curve on given currentexp.
	 *  @param {Number/Integer} currentExp
	 */
	getExpMetadata(currentExp=0) {
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
	 *  Prettify result of user's owned gifts
	 *  @param {Object} metadata Gifts metadata. Giving information of each reps point.
	 *  @param {Object} userInventory User inventories metadata.
	 */
	parsingAvailableGifts(metadata = {}, userInventory = {}) {
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
	 * Formatting each paragraph. Mainly used to format profile card's description/bio
	 * @param {String} string of user description.
	 * @param {Number|Integer} numlines of paragraph.
	 */
	formatString(string=``, numlines=0) {
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
	 * Splits array items into chunks of the specified size
	 * @param {Array|String} items
	 * @param {Number} chunkSize
	 * @returns {Array}
	 */
	chunk(items, chunkSize) {
		const result = []

		for (let i = 0; i < items.length; i += chunkSize) {
			result.push(items.slice(i, i + chunkSize))
		}

		return result
	}

	/**
	 * Mainly used to socket a socketable message like in Annie's System Locales.
	 * @param {String} content target string
	 * @param {Array} socket an array of sockets to be applied from.
	 * @returns {String}
	 */
	socketing(content=``,socket=[]) {
		for(let i = 0; i < socket.length; i++) {
			if (content.indexOf(`{${i+1}}`) != -1) content = content.replace(`{${i}}`, socket[i])
		}
		return content
	}

	/**
	 * Message wrapper to display avatar request.
	 * @param {String} userId target user
	 * @returns {AvatarMessage}
	 */
	displayAvatar(userId=``) {
		this.message.react(`📸`)
		const [avatar, name] = [this.avatar(userId), this.name(userId)]
		const embed = new RichEmbed()
		.setImage(avatar)
		.setAuthor(name, avatar)
		.setColor(this.palette.darkmatte)
		this.message.channel.send(embed)
	}

    /**
     *  Registering each element of array into its own embed.
     *  @param {array} [pages=[]] source array to be registered. Element must be `string`.
     *  @returns {array}
     */
    _registerPages(pages=[]) {
        let res = []
        for (let i = 0; i < pages.length; i++) {
            res[i] = new RichEmbed().setFooter(`(${i+1}/${pages.length})`).setDescription(pages[i]).setColor(this.palette.golden)
        }
        return res
    }


	/** Annie's custom message system.
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
	async reply (content, options = {
		socket: [],
		color: ``,
		url: null,
		image: null,
		imageGif: null,
		field: null,
		author: null,
		simplified: false,
		notch: false,
		thumbnail: null,
		deleteIn: 0,
		prebuffer: false,
		header: null,
		footer: null,
		customHeader: null,
		timestamp: false,
		paging: false
	}) {
		options.socket = !options.socket ? [] : options.socket
		options.color = !options.color ? this.palette.darkmatte : options.color
		options.url = !options.url ? null : options.url
		options.image = !options.image ? null : options.image
		options.imageGif = !options.imageGif ? null : options.imageGif
		options.field = !options.field ? this.message.channel : options.field
		options.simplified = !options.simplified ? false : options.simplified
		options.thumbnail = !options.thumbnail ? null : options.thumbnail
		options.notch = !options.notch ? false : options.notch
		options.prebuffer = !options.prebuffer ? false : options.prebuffer
		options.header = !options.header ? null : options.header
		options.author = !options.author ? null : options.author
		options.footer = !options.footer ? null : options.footer
		options.customHeader = !options.customHeader ? null : options.customHeader
		options.timestamp == false ? null : options.timestamp = true
		options.paging === false ? null : options.paging
		const fn = `[Pistachio.reply()]`

		//  Handle message with paging property enabled
		if (options.paging) {
			let page = 0
			const embeddedPages = this._registerPages(content)
			return options.field.send(embeddedPages[0])
            .then(async msg => {
                //  Buttons
                await msg.react(`⏪`)
                await msg.react(`⏩`)
                // Filters - These make sure the varibles are correct before running a part of code
                const backwardsFilter = (reaction, user) => reaction.emoji.name === `⏪` && user.id === this.message.author.id
                const forwardsFilter = (reaction, user) => reaction.emoji.name === `⏩` && user.id === this.message.author.id
                //  Timeout limit for page buttons
                const backwards = msg.createReactionCollector(backwardsFilter, { time: 300000 })
                const forwards = msg.createReactionCollector(forwardsFilter, { time: 300000 })
                //	Left navigation
                backwards.on(`collect`, r => {
                    r.remove(this.message.author.id)
                    page--
                    if (embeddedPages[page]) {
                        msg.edit(embeddedPages[page])
                    } else {
                        page++
                    }
                })
                //	Right navigation
                forwards.on(`collect`, r => {
                    r.remove(this.message.author.id)
                    page++
                    if (embeddedPages[page]) {
                        msg.edit(embeddedPages[page])
                    } else {
                        page--
                    }
                })
            })
		}

		//  Replace content with error message if content is a faulty value
		if (!content && (typeof content != `string`)) {
			logger.error(`${fn} parameter 'content' should only be string. Because of this, now user will only see my localization msg handler.`)
			content = this.bot.locale.en.LOCALIZATION_ERROR

		}

		//  Find all the available {{}} socket in the string.
		let sockets = content.match(/\{{(.*?)\}}/g)
		if (sockets === null) sockets = []
		for (let i = 0; i < sockets.length; i++) {
			const key = sockets[i].match(/\{{([^)]+)\}}/)
			if (!key) continue
			//  Index `0` has key with the double curly braces, index `1` only has the inside value.
			const pieceToAttach = options.socket[key[1]]
			if (pieceToAttach) content = content.replace(new RegExp(`\\` + key[0], `g`), pieceToAttach)
		}
	
		//  Returns simple message w/o embed
		if (options.simplified) return options.field.send(content, options.image ? new Attachment(options.prebuffer ? options.image : await this.loadAsset(options.image)) : null)
		//  Add notch/chin
		if (options.notch) content = `\u200C\n${content}\n\u200C`
		const embed = new RichEmbed()
			.setColor(this.palette[options.color] || options.color)
			.setDescription(content)
			.setThumbnail(options.thumbnail)
		//  Add header
		if(options.header) embed.setTitle(options.header)
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
			embed.attachFile(new Attachment(options.prebuffer ? options.image : await this.loadAsset(options.image), `preview.jpg`))
			embed.setImage(`attachment://preview.jpg`)
		} else if (embed.file) {
			embed.image.url = null
			embed.file = null
		}

		let sent = options.field.send(embed)
		if (!options.deleteIn) return sent
		return sent
		.then(msg => {
			//  Convert deleteIn parameter into milliseconds.
			msg.delete(options.deleteIn * 1000)
		})
	}
}


module.exports = Pistachio