const palette = require(`../ui/colors/default`)
const {
	EmbedBuilder,
	AttachmentBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require(`discord.js`)
const loadAsset = require(`../utils/loadAsset`)
const GUI = require(`../ui/prebuild/cardCollection`)
/**
 * @typedef {object} Plugins
 * @property {string} content as the message content
 * @property {array} socket is the optional message modifier. Array
 * @property {string} color for the embed color. Hex code
 * @property {object} field as the message field target (GuildChannel/DM). Object
 * @property {buffer} image as the attachment url. Buffer
 * @property {boolean} simplified as non embed message toggle. Boolean
 * @property {string} thumbnail as embed icon. StringuRL
 * @property {boolean} notch as huge blank space on top and bottom
 * @property {buffer|string} thumbnail as message icon on top right
 * @property {number} deleteIn as countdown before the message get deleted. In seconds.
 * @property {boolean} prebuffer as indicator if parameter supply in "image" already contains image buffer.
 * @property {string} header use header in an embed.
 * @property {array} customHeader First index as header text and second index as header icon.
 * @property {boolean} [timestamp=false] Toggle true to include the timestamp on the message.
 * @property {boolean} [paging=false] Toggle true to use paging mode in the message.
 * @property {string|null} [status=null] Set to `sucesss`, `warn`, or `fail` to indicate the status of the message.
 * @property {boolean} [cardPreviews=false] Toggle true to allow the embed to display the card.
 * @property {string|null} [topNotch=null] Adds topnotch with custom message. Leave blank/null to ommit it.
 * @property {boolean} [raw=false] Toggle `true` to return the message's composition without sending it to the target field.
 * @property {boolean} [timestampAsFooter=false] Toggle `true` to include the message timestamp in the footer of embed.
 */

/** 
 * Annie's response message system.
 * @abstract
 * @class
 */
class Response {
	/**
	 * @param {object} [message={}] Target message's instance.
	 * @param {boolean} [channelAsInstance=false] Toggle `true` when supplied
	 * @param {object} [localeMetadata=null] For testing purposes. Optional
	 * 'message' parameter is replaced with 'channel' object.
	 */
	constructor(message = {}, channelAsInstance = false, localeMetadata = null) {
		/**
		 * Target's message instance.
		 * @type {object}
		 */
		this.message = message

		/**
		 * Default target channel
		 * @type {object|null}
		 */
		this.targetField = channelAsInstance ?
			message :
			message.channel ?
				message.channel : null

		/**
		 * Determine if the message is a Slash command.
		 */
		this.isSlash = message.applicationId === null ? true : false

		/**
		 * The metadata of locale to be used
		 * @type {object|null}
		 */
		this.localeMetadata = localeMetadata
	}

	/**
	 * Plug variables into available socket in the target string.
	 * @param {string} [content=``] Target string.
	 * @param {object} [socket={}] List of sockets to attach in the string.
	 * return {string}
	 */
	socketing(content = ``, socket = {}) {
		//  Find all the available {{}} socket in the string.
		let sockets = content.match(/\{{(.*?)\}}/g)
		if (sockets === null) sockets = []
		for (let i = 0; i < sockets.length; i++) {
			const key = sockets[i].match(/\{{([^)]+)\}}/)
			if (!key) continue
			//  Index `0` has key with the double curly braces, index `1` only has the inside value.
			const pieceToAttach = socket[key[1]]
			if (pieceToAttach || pieceToAttach === 0) content = content.replace(new RegExp(`\\` + key[0], `g`), pieceToAttach)
		}
		return content
	}

	/**
	 *
	 * Sending response
	 * @param {String} [content=``] Main content of the message to be displayed.
	 * @param {Object} [plugins={}] List of plugins to be applied into the message.
	 * @return {void}
	 */
	async sendOld(content = ``, plugins = {}) {

		let socket = plugins.socket || []
		let color = plugins.color || palette.crimson
		plugins.color = color
		let url = plugins.url || null
		let image = plugins.image || null
		let imageGif = plugins.imageGif || null
		let field = plugins.field || this.targetField
		let simplified = plugins.simplified || false
		let thumbnail = plugins.thumbnail || null
		let notch = plugins.notch || false
		let prebuffer = plugins.prebuffer || false
		let header = plugins.header || null
		let footer = plugins.footer || null
		let customHeader = plugins.customHeader || null
		let deleteIn = plugins.deleteIn || null
		let timestamp = plugins.timestamp || null
		let paging = plugins.paging || null
		let status = plugins.status || null
		let cardPreviews = plugins.cardPreviews || null
		let topNotch = plugins.topNotch || null
		let raw = plugins.raw || false
		let timestampAsFooter = plugins.timestampAsFooter || false
		let directMessage = plugins.dm || false
		let feedback = plugins.feedback || false
		let components = plugins.components || null
		let file = {
			attachment: plugins.file,
			name: plugins.fileName,
			description: plugins.fileDescription
		}
		if (!file.attachment || !file.name || !file.description) file = null
		/**
		 * Add feedback button to message if enabled
		 */
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(`betaFeedback`)
					.setLabel(`Beta Feature Feedback`)
					.setStyle(ButtonStyle.Secondary)
			)
		if (feedback) {
			if (!components) {
				components = [row]
			} else {
				components.push(row)
			}
		}

		let fetchReply = plugins.fetchReply || true
		let followUp = plugins.followUp || false
		let ephemeral = plugins.ephemeral || false
		followUp = this.isSlash ? this.message.deferred || this.message.replied ? true : false : false
		const RESPONSE_REF = !directMessage ? this.isSlash ? this.message : field : field
		const RESPONSE_TYPE = !directMessage ? this.isSlash ? followUp ? `followUp` : `reply` : `send` : `send`
		const isComponentArray = Array.isArray(components)
		isComponentArray ? null : components ? components = [components] : null
		//  Handle message with paging property enabled
		if (paging) {
			let page = 0
			const embeddedPages = await this._registerPages(content, plugins)
			return RESPONSE_REF[RESPONSE_TYPE](embeddedPages[0].file ? components ? {
				embeds: [embeddedPages[0]],
				files: [embeddedPages[0].file],
				components: components,
				fetchReply: fetchReply,
				ephemeral: ephemeral

			} : {
				embeds: [embeddedPages[0]],
				files: [embeddedPages[0].file],
				fetchReply: fetchReply,
				ephemeral: ephemeral

			} : components ? {
				embeds: [embeddedPages[0]],
				files: [],
				components: components,
				fetchReply: fetchReply,
				ephemeral: ephemeral

			} : {
				embeds: [embeddedPages[0]],
				files: [],
				fetchReply: fetchReply,
				ephemeral: ephemeral

			}).then(async msg => {
				try {
					this.ref = await msg.fetchReference()
					this.ref = this.ref.interaction.user
				} catch (error) {
					this.ref = this.message.user
				}
				//  Buttons
				if (embeddedPages.length > 1) {
					await msg.react(`⏪`)
					await msg.react(`⏩`)
				}
				// Filters - These make sure the varibles are correct before running a part of code
				let filter = (reaction, user) => this.isSlash ? reaction.emoji.name === `⏪` && user.id === this.ref.id : reaction.emoji.name === `⏪` && user.id === this.message.author.id
				//  Timeout limit for page buttons
				const backwards = msg.createReactionCollector({
					filter,
					time: 300000
				})
				filter = (reaction, user) => this.isSlash ? reaction.emoji.name === `⏩` && user.id === this.ref.id : reaction.emoji.name === `⏩` && user.id === this.message.author.id
				const forwards = msg.createReactionCollector({
					filter,
					time: 300000
				})
				//  Add preview button if cardPreviews is enabled
				if (cardPreviews) {
					await msg.react(`👀`)
					let filter = (reaction, user) => this.isSlash ? reaction.emoji.name === `👀` && user.id === this.ref.id : reaction.emoji.name === `👀` && user.id === this.message.author.id
					let preview = msg.createReactionCollector(filter, {
						time: 300000
					})
					let previewedPages = []
					preview.on(`collect`, async r => {
						r.users.remove(this.isSlash ? this.ref.id : this.message.author.id)
						if (previewedPages.includes(page)) return
						previewedPages.push(page)
						let loading = await RESPONSE_REF[RESPONSE_TYPE]({
							content: `\`Rendering preview for cards page ${page + 1}/${embeddedPages.length} ...\``
						})
						let img = await new GUI(plugins.cardPreviews[page]).create()
						RESPONSE_REF[RESPONSE_TYPE]({
							files: [new AttachmentBuilder(img)]
						})
						loading.delete()
					})
				}
				//	Left navigation
				backwards.on(`collect`, r => {
					r.users.remove(this.isSlash ? this.ref.id : this.message.author.id)
					page--
					if (embeddedPages[page]) {
						msg.edit(embeddedPages[page].file ? {
							embeds: [embeddedPages[page]],
							files: [embeddedPages[page].file]
						} : {
							embeds: [embeddedPages[page]],
							files: []
						})
					} else {
						page = embeddedPages.length - 1
						msg.edit(embeddedPages[page].file ? {
							embeds: [embeddedPages[page]],
							files: [embeddedPages[page].file]
						} : {
							embeds: [embeddedPages[page]],
							files: []
						})
					}
				})
				//	Right navigation
				forwards.on(`collect`, r => {
					r.users.remove(this.isSlash ? this.ref.id : this.message.author.id)
					page++
					if (embeddedPages[page]) {
						msg.edit(embeddedPages[page].file ? {
							embeds: [embeddedPages[page]],
							files: [embeddedPages[page].file]
						} : {
							embeds: [embeddedPages[page]],
							files: []
						})
					} else {
						page = 0
						msg.edit(embeddedPages[page].file ? {
							embeds: [embeddedPages[page]],
							files: [embeddedPages[page].file]
						} : {
							embeds: [embeddedPages[page]],
							files: []
						})
					}
				})
			})
		}
		//  Replace content with error message if content is a faulty value
		if (typeof content != `string`) content = this.localeMetadata.LOCALIZATION_ERROR

		//  Find all the available {{}} socket in the string.
		let sockets = content.match(/\{{(.*?)\}}/g)
		if (sockets === null) sockets = []
		for (let i = 0; i < sockets.length; i++) {
			const key = sockets[i].match(/\{{([^)]+)\}}/)
			if (!key) continue
			//  Index `0` has key with the double curly braces, index `1` only has the inside value.
			const pieceToAttach = socket[key[1]]
			if (pieceToAttach || pieceToAttach === 0) content = content.replace(new RegExp(`\\` + key[0], `g`), pieceToAttach)
		}
		//  Mutate message if status property is defined
		if ([`success`, `warn`, `fail`].includes(status)) color = status === `success` ? `#ffc9e2` : `crimson`
		//  Returns simple message w/o embed
		if (simplified) {
			return image ?
				components ? RESPONSE_REF[RESPONSE_TYPE]({
					content: content,
					files: [new AttachmentBuilder(prebuffer ? image : await loadAsset(image))],
					components: components,
					fetchReply: fetchReply,
					ephemeral: ephemeral

				}) : RESPONSE_REF[RESPONSE_TYPE]({
					content: content,
					files: [new AttachmentBuilder(prebuffer ? image : await loadAsset(image))],
					fetchReply: fetchReply,
					ephemeral: ephemeral

				}) : components ? RESPONSE_REF[RESPONSE_TYPE]({
					content: content,
					components: components,
					fetchReply: fetchReply,
					ephemeral: ephemeral

				}) : RESPONSE_REF[RESPONSE_TYPE]({
					content: content,
					fetchReply: fetchReply,
					ephemeral: ephemeral
				})
		}
		//  Add notch/chin
		if (notch) content = `\u200C\n${content}\n\u200C`

		if (content === ``) content = null
		const embed = new EmbedBuilder()
			.setColor(palette[color] || color)
			.setDescription(content)
			.setThumbnail(thumbnail)
		embed.file = null
		//  Add header
		if (header) embed.setTitle(header)
		//  Custom header
		if (customHeader) embed.setAuthor({
			name: customHeader[0],
			iconURL: customHeader[1]
		})
		//  Add footer
		if (footer) embed.setFooter({
			text: footer
		})
		//  Timestamp footer
		if (timestampAsFooter) embed.setTimestamp()
		//  Add timestamp on footer part
		if (timestamp) embed.setTimestamp()
		// Add url
		if (url) embed.setURL(url)
		//  Add image preview
		if (imageGif) {
			embed.setImage(imageGif)
		} else if (embed.file) {
			embed.image.url = null
			embed.file = null
		}
		//  Add image preview
		if (image) {
			const img = new AttachmentBuilder(prebuffer ? image : await loadAsset(image), { name: `preview.jpg` })
			embed.file = img
			embed.setImage(`attachment://preview.jpg`)
		} else if (embed.file) {
			embed.image.url = null
			embed.file = null
		}
		if (raw) return embed
		const noEmbedDescription = embed.data.description === undefined
		let sent

		if (topNotch) {
			if (embed.file) {
				components ? sent = await RESPONSE_REF[RESPONSE_TYPE]({
					content: topNotch,
					embeds: [embed],
					files: [embed.file],
					components: components,
					fetchReply: fetchReply,
					ephemeral: ephemeral
				}) : sent = await RESPONSE_REF[RESPONSE_TYPE]({
					content: topNotch,
					embeds: [embed],
					files: [embed.file],
					fetchReply: fetchReply,
					ephemeral: ephemeral
				})
			} else {
				components ? sent = await RESPONSE_REF[RESPONSE_TYPE]({
					content: topNotch,
					embeds: [embed],
					components: components,
					fetchReply: fetchReply,
					ephemeral: ephemeral
				}) : sent = await RESPONSE_REF[RESPONSE_TYPE]({
					content: topNotch,
					embeds: [embed],
					fetchReply: fetchReply,
					ephemeral: ephemeral
				})
			}
		} else {

			if (embed.file) {
				components ? sent = await RESPONSE_REF[RESPONSE_TYPE]({
					content: topNotch,
					embeds: [embed],
					files: [embed.file],
					components: components,
					fetchReply: fetchReply,
					ephemeral: ephemeral
				}) :
					sent = await RESPONSE_REF[RESPONSE_TYPE]({
						content: topNotch,
						embeds: [embed],
						files: [embed.file],
						fetchReply: fetchReply,
						ephemeral: ephemeral
					})
			} else {

				components ? noEmbedDescription ?
					sent = await RESPONSE_REF[RESPONSE_TYPE]({
						components: components,
						fetchReply: fetchReply,
						ephemeral: ephemeral
					}) :
					sent = await RESPONSE_REF[RESPONSE_TYPE]({
						embeds: [embed],
						components: components,
						fetchReply: fetchReply,
						ephemeral: ephemeral
					}) : sent = await RESPONSE_REF[RESPONSE_TYPE]({
						embeds: [embed],
						fetchReply: fetchReply,
						ephemeral: ephemeral
					})
			}
		}

		if (file) sent = await RESPONSE_REF[RESPONSE_TYPE]({
			files: [file]
		})
		if (!deleteIn) return sent
		sent
		return setTimeout(() => {
			sent.delete()
		}, deleteIn * 1000)
	}

	/**
	 * Sending response
	 * @param {String} [content=``] Main content of the message to be displayed.
	 * @param {Object} plugins List of plugins to be applied into the message.
	 * @param {Array} plugins.socket 
	 * @param {String} plugins.color 
	 * @param {String} plugins.url 
	 * @param {String} plugins.image 
	 * @param {String} plugins.imageGif 
	 * @param {String} plugins.thumbnail 
	 * @param {String} plugins.header 
	 * @param {String} plugins.footer 
	 * @param {String} plugins.customHeader 
	 * @param {String} plugins.timestamp 
	 * @param {String} plugins.status 
	 * @param {String} plugins.topNotch 
	 * @param {Boolean} plugins.simplified 
	 * @param {Boolean} plugins.notch 
	 * @param {Boolean} plugins.prebuffer 
	 * @param {Boolean} plugins.paging 
	 * @param {Boolean} plugins.cardPreviews 
	 * @param {Boolean} plugins.raw 
	 * @param {Boolean} plugins.timestampAsFooter 
	 * @param {Boolean} plugins.directMessage 
	 * @param {Boolean} plugins.feedback  
	 * @param {Boolean} plugins.fetchReply 
	 * @param {Boolean} plugins.ephemeral 
	 * @param {Object | String} plugins.field 
	 * @param {String | Number} plugins.deleteIn 
	 * @param {Array | String | Object} plugins.components
	 * @param {Object} plugins.file
	 * @param {String} plugins.file.filePath 
	 * @param {String} plugins.file.fileName 
	 * @param {String} plugins.file.fileDescription 
	 * @return {void}
	 */
	async send(content = ``, plugins = {}) {
		let socket = plugins.socket || []
		let color = plugins.color || palette.crimson
		let url = plugins.url || null
		let image = plugins.image || null
		let imageGif = plugins.imageGif || null
		let field = plugins.field || this.targetField
		let simplified = plugins.simplified || false
		let thumbnail = plugins.thumbnail || null
		let notch = plugins.notch || false
		let prebuffer = plugins.prebuffer || false
		let header = plugins.header || null
		let footer = plugins.footer || null
		let customHeader = plugins.customHeader || null
		let deleteIn = plugins.deleteIn || null
		let timestamp = plugins.timestamp || null
		let paging = plugins.paging || null
		let status = plugins.status || null
		let cardPreviews = plugins.cardPreviews || null
		let topNotch = plugins.topNotch || null
		let raw = plugins.raw || false
		let timestampAsFooter = plugins.timestampAsFooter || false
		let directMessage = plugins.dm || false
		let feedback = plugins.feedback || false
		let components = plugins.components || null
		let file = plugins.file || null
		let fetchReply = plugins.fetchReply || true
		let ephemeral = plugins.ephemeral || false

		const isSlash = this.message.applicationId === null ? false : true // Not a application command <Message> : Is a application command <ChatInputCommandInteraction>
		const followUp = isSlash ? this.message.deferred || this.message.replied ? true : false : false
		const RESPONSE_REF = directMessage ? `send` : isSlash ? this.message : field
		const RESPONSE_TYPE = directMessage ? `send` : isSlash ? followUp ? `followUp` : `reply` : `send`
		const embed = new EmbedBuilder()

		/**
		 * Format Components to correct data type
		 */
		formatComponents()

		/**
		 * Create file object if supplied data
		 */
		constructFileProp()

		/**
		 * Add feedback button to message if enabled
		 */
		betaFeedback()

		//  Handle message with paging property enabled
		if (paging) return await this.pageModule(content, plugins, RESPONSE_REF, RESPONSE_TYPE, components, fetchReply, ephemeral, isSlash, cardPreviews)

		//  Replace content with error message if content is a faulty value
		if (typeof content != `string`) content = this.localeMetadata.LOCALIZATION_ERROR
		//  Find all the available {{}} socket in the string.
		replaceSockets()

		//  Mutate message if status property is defined
		if ([`success`, `warn`, `fail`].includes(status)) color = status === `success` ? `#ffc9e2` : `crimson`

		//  Returns simple message w/o embed
		if (simplified) return await sendMessage()

		//  Add notch/chin
		if (notch) content = `\u200C\n${content}\n\u200C`

		if (content === ``) content = null


		await createEmbed()

		if (raw) return embed

		let sent = await sendMessage()

		if (file) sent = await sendMessage()

		if (!deleteIn) return sent
		sent

		return setTimeout(() => {
			sent.delete()
		}, deleteIn * 1000)


		async function sendMessage() {
			const noEmbed = Object.keys(embed.data).length === 0
			const noEmbedDescription = embed.data.description === undefined
			
			if (file) return RESPONSE_REF[RESPONSE_TYPE]({
				files: [file]
			})

			return RESPONSE_REF[RESPONSE_TYPE]({
				content: noEmbed ? content : topNotch ? topNotch : null,
				embeds: noEmbed ? null : noEmbedDescription ? null : [embed],
				files: embed.file ? [embed.file] : image ? [new AttachmentBuilder(prebuffer ? image : await loadAsset(image))] : null,
				components: components ? components : null,
				fetchReply: fetchReply,
				ephemeral: ephemeral
			})
		}

		async function createEmbed() {
			embed.setColor(palette[color] || color).setDescription(content).setThumbnail(thumbnail)
			embed.file = null
			//  Add header
			if (header) embed.setTitle(header)
			//  Custom header
			if (customHeader) embed.setAuthor({
				name: customHeader[0],
				iconURL: customHeader[1]
			})
			//  Add footer
			if (footer) embed.setFooter({
				text: footer
			})
			//  Timestamp footer
			if (timestampAsFooter) embed.setTimestamp()
			//  Add timestamp on footer part
			if (timestamp) embed.setTimestamp()
			// Add url
			if (url) embed.setURL(url)
			//  Add image preview
			if (imageGif) {
				embed.setImage(imageGif)
			} else if (embed.file) {
				embed.image.url = null
				embed.file = null
			}
			//  Add image preview
			if (image) {
				const img = new AttachmentBuilder(prebuffer ? image : await loadAsset(image), { name: `preview.jpg` })
				embed.file = img
				embed.setImage(`attachment://preview.jpg`)
			} else if (embed.file) {
				embed.image.url = null
				embed.file = null
			}
		}

		function formatComponents() {
			const isComponentArray = Array.isArray(components)
			if (components && !isComponentArray) components = [components]
		}

		function betaFeedback() {
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`betaFeedback`)
						.setLabel(`Beta Feature Feedback`)
						.setStyle(ButtonStyle.Secondary)
				)

			if (feedback) return !components ? components = [row] : components.push(row)
		}

		function constructFileProp() {
			if (file === null || file === undefined || !plugins.file.filePath || !plugins.file.fileName || !plugins.file.fileDescription) {
				file = null
			} else {
				file.attachment = plugins.file.filePath
				file.name = plugins.file.fileName
				file.description = plugins.file.fileDescription
			}
		}

		function replaceSockets() {
			let sockets = content.match(/\{{(.*?)\}}/g)
			if (sockets === null) sockets = []
			for (let i = 0; i < sockets.length; i++) {
				const key = sockets[i].match(/\{{([^)]+)\}}/)
				if (!key) continue
				//  Index `0` has key with the double curly braces, index `1` only has the inside value.
				const pieceToAttach = socket[key[1]]
				if (pieceToAttach || pieceToAttach === 0) content = content.replace(new RegExp(`\\` + key[0], `g`), pieceToAttach)
			}
		}
	}

	async pageModule(content, plugins, RESPONSE_REF, RESPONSE_TYPE, components, fetchReply, ephemeral, isSlash, cardPreviews) {
		let page = 0
		const embeddedPages = await this._registerPages(content, plugins)
		return RESPONSE_REF[RESPONSE_TYPE](embeddedPages[0].file ? components ? {
			embeds: [embeddedPages[0]],
			files: [embeddedPages[0].file],
			components: components,
			fetchReply: fetchReply,
			ephemeral: ephemeral
		} : {
			embeds: [embeddedPages[0]],
			files: [embeddedPages[0].file],
			fetchReply: fetchReply,
			ephemeral: ephemeral
		} : components ? {
			embeds: [embeddedPages[0]],
			files: [],
			components: components,
			fetchReply: fetchReply,
			ephemeral: ephemeral
		} : {
			embeds: [embeddedPages[0]],
			files: [],
			fetchReply: fetchReply,
			ephemeral: ephemeral
		}).then(async (msg) => {
			this.ref = this.message.user
			//  Buttons
			if (embeddedPages.length > 1) {
				await msg.react(`⏪`)
				await msg.react(`⏩`)
			}
			// Filters - These make sure the varibles are correct before running a part of code
			let filter = (reaction, user) => isSlash ? reaction.emoji.name === `⏪` && user.id === this.ref.id : reaction.emoji.name === `⏪` && user.id === this.message.author.id
			//  Timeout limit for page buttons
			const backwards = msg.createReactionCollector({
				filter,
				time: 300000
			})
			filter = (reaction, user) => isSlash ? reaction.emoji.name === `⏩` && user.id === this.ref.id : reaction.emoji.name === `⏩` && user.id === this.message.author.id
			const forwards = msg.createReactionCollector({
				filter,
				time: 300000
			})
			//  Add preview button if cardPreviews is enabled
			if (cardPreviews) {
				await msg.react(`👀`)
				let filter = (reaction, user) => isSlash ? reaction.emoji.name === `👀` && user.id === this.ref.id : reaction.emoji.name === `👀` && user.id === this.message.author.id
				let preview = msg.createReactionCollector(filter, {
					time: 300000
				})
				let previewedPages = []
				preview.on(`collect`, async (r) => {
					r.users.remove(isSlash ? this.ref.id : this.message.author.id)
					if (previewedPages.includes(page)) return
					previewedPages.push(page)
					let loading = await RESPONSE_REF[RESPONSE_TYPE]({
						content: `\`Rendering preview for cards page ${page + 1}/${embeddedPages.length} ...\``
					})
					let img = await new GUI(plugins.cardPreviews[page]).create()
					RESPONSE_REF[RESPONSE_TYPE]({
						files: [new AttachmentBuilder(img)]
					})
					loading.delete()
				})
			}
			//	Left navigation
			backwards.on(`collect`, r => {
				r.users.remove(isSlash ? this.ref.id : this.message.author.id)
				page--
				if (embeddedPages[page]) {
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				} else {
					page = embeddedPages.length - 1
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				}
			})
			//	Right navigation
			forwards.on(`collect`, r => {
				r.users.remove(isSlash ? this.ref.id : this.message.author.id)
				page++
				if (embeddedPages[page]) {
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				} else {
					page = 0
					msg.edit(embeddedPages[page].file ? {
						embeds: [embeddedPages[page]],
						files: [embeddedPages[page].file]
					} : {
						embeds: [embeddedPages[page]],
						files: []
					})
				}
			})
		})
	}

	/**
	 *  Registering each element of array into its own embed.
	 *  @param {array} [pages=[]] source array to be registered. Element must be `string`.
	 *  @param {object} [src=null] reply's options parameters for customized embed.
	 *  @returns {array}
	 */
	async _registerPages(pages = [], src = null) {
		let res = []
		for (let i = 0; i < pages.length; i++) {
			res[i] = new EmbedBuilder().setFooter({
				text: `(${i + 1}/${pages.length})`
			}).setDescription(`${src.topNotch || ``}\n${this.socketing(pages[i], src.socket)}`)
			if (src.image) {
				let attachment = new AttachmentBuilder(src.prebuffer ? src.image : await loadAsset(src.image), `preview.jpg`)
				res[i].setImage(`attachment://${attachment.name}`)
				res[i].file = attachment
			}
			if (src.color) res[i].setColor(palette[src.color] || src.color || palette[`crimson`])
			if (src.header) res[i].setTitle(src.header)
			if (src.customHeader) res[i].setAuthor({
				name: src.customHeader[0],
				iconURL: src.customHeader[1]
			})
			if (src.thumbnail) res[i].setThumbnail(src.thumbnail)
			if (src.cardPreviews) res[i].setFooter({
				text: `Press the eyes emoji to preview. (${i + 1}/${pages.length})`
			})
		}
		return res
	}
}

module.exports = Response