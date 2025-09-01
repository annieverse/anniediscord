"use strict"
const palette = require(`../ui/colors/default`)
const {
	EmbedBuilder,
	AttachmentBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	MessageFlags,
	User,
	GuildMember
} = require(`discord.js`)
const loadAsset = require(`../utils/loadAsset`)
const GUI = require(`../ui/prebuild/cardCollection`)
const { PermissionFlagsBits } = require(`discord.js`)
const errorRelay = require(`../utils/errorHandler.js`)
const { isSlash, isInteractionCallbackResponse } = require(`../utils/appCmdHelp.js`)
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
	constructor (message = {}, channelAsInstance = false, localeMetadata = null) {
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
		 * The metadata of locale to be used
		 * @type {object|null}
		 */
		this.localeMetadata = localeMetadata

		/**
		 * Extract client property
		 * @type {object}
		 */
		this.client = message.client
	}

	/**
	 * Sending response
	 * @param {String} [content=``] Main content of the message to be displayed.
	 * @param {Object} plugins List of plugins to be applied into the message.
	 * @param {Array} plugins.socket optional message modifiers.
	 * @param {String} plugins.color for the embed color. [Hex code]
	 * @param {String} plugins.url as the url for an embed.
	 * @param {Buffer} plugins.image as the attachment url.
	 * @param {String} plugins.imageGif as the attachment url.
	 * @param {String} plugins.thumbnail as embed icon.
	 * @param {String} plugins.header use header in an embed.
	 * @param {String} plugins.footer use footer in an embed.
	 * @param {String} plugins.customHeader First index as header text and second index as header icon.
	 * @param {String} plugins.timestamp Toggle true to include the timestamp on the message.
	 * @param {String} plugins.status Set to `sucesss`, `warn`, or `fail` to indicate the status of the message.
	 * @param {String} plugins.topNotch Adds topnotch with custom message. Leave blank/null to ommit it.
	 * @param {Boolean} plugins.simplified as non embed message toggle.
	 * @param {Boolean} plugins.notch as huge blank space on top and bottom
	 * @param {Boolean} plugins.prebuffer as indicator if parameter supply in "image" already contains image buffer.
	 * @param {Boolean} plugins.paging Toggle true to use paging mode in the message.
	 * @param {Boolean} plugins.cardPreviews Toggle true to allow the embed to display the card.
	 * @param {Boolean} plugins.raw Toggle `true` to return the message's composition without sending it to the target field.
	 * @param {Boolean} plugins.timestampAsFooter Toggle `true` to include the message timestamp in the footer of embed.
	 * @param {Boolean} plugins.directMessage Indicate if the message is a DM
	 * @param {Boolean} plugins.withResponse Application command option to grab reference
	 * @param {Boolean} plugins.ephemeral Application command option to hide message from public
	 * @param {Boolean} plugins.replyAnyway Reply to a message reguardless of other options
	 * @param {Boolean} plugins.messageToReplyTo required for [plugins.replyAnyway] to work
	 * @param {Boolean} plugins.sendAnyway Send to channel reguardless of other options
	 * @param {Boolean} plugins.editReply Toggle if it should be edit instead of followup
	 * @param {Object | String} plugins.field message field target (GuildChannel/DM).
	 * @param {String | Number} plugins.deleteIn as countdown before the message get deleted. In seconds.
	 * @param {Array | String | Object} plugins.components Array of components like buttons
	 * @param {Object} plugins.file	object for local file attachments
	 * @param {String} plugins.file.filePath local file file path
	 * @param {String} plugins.file.fileName local file name
	 * @param {String} plugins.file.fileDescription local file description
	 * @return {void}
	 */
	async send(content = ``, plugins = {}) {
		const socket = plugins.socket || []
		let color = plugins.color || palette.crimson
		const url = plugins.url || null
		const image = plugins.image || null
		const imageGif = plugins.imageGif || null
		const field = plugins.field || this.targetField
		const simplified = plugins.simplified || false
		const thumbnail = plugins.thumbnail || null
		const notch = plugins.notch || false
		const prebuffer = plugins.prebuffer || false
		const header = plugins.header || null
		const footer = plugins.footer || null
		const customHeader = plugins.customHeader || null
		const deleteIn = plugins.deleteIn || null
		const timestamp = plugins.timestamp || null
		const paging = plugins.paging || null
		const status = plugins.status || null
		const cardPreviews = plugins.cardPreviews || null
		const topNotch = plugins.topNotch || null
		const raw = plugins.raw || false
		const timestampAsFooter = plugins.timestampAsFooter || false
		const directMessage = plugins.dm || false
		let components = plugins.components || null
		let file = plugins.file || null
		const withResponse = plugins.withResponse || true
		const ephemeral = plugins.ephemeral || false
		const messageToReplyTo = plugins.messageToReplyTo || null
		const replyAnyway = messageToReplyTo ? plugins.replyAnyway || false : false
		const sendAnyway = plugins.sendAnyway || false
		const editReply = plugins.editReply || false
		//		this.message.type = https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-type
		//		this.message.commandType = https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types

		const _isSlash = isSlash(this.message)
		const _CB = isInteractionCallbackResponse(this.message)
		const userObject = this.message instanceof User || this.message instanceof GuildMember

		// If object to send is coming from a regular message object, check if bot has correct perms to send otherwise return and dont send anything.
		if (!_isSlash && !_CB) {
			let checkPerm
			try {
				checkPerm = this.checkPermissions(field, userObject)
			}
			catch (error) {
				const internalError = `[Internal Error]`
				if (error.message.includes(internalError)) return
				const errorMsg = error.message || `Unknown Error`
				const errorStack = error.stack || `Unknown Error Stack`
				errorRelay(this.client, { fileName: `response.js`, errorType: `normal`, error_stack: errorStack, error_message: errorMsg }).catch(err => this.client.logger.error(`Unable to send message to channel > ${err}`))
			}
			if (!checkPerm) return
		}
		// Check for file permission
		const hasFileUploadPerm = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.AttachFiles)


		const followUp = _isSlash ? this.message.deferred || this.message.replied ? true : false : false
		const RESPONSE_REF = messageToReplyTo ? messageToReplyTo : directMessage ? `send` : _isSlash ? sendAnyway ? field : this.message : field
		const RESPONSE_TYPE = sendAnyway ? `send` : replyAnyway ? `reply` : directMessage ? `send` : _isSlash ? followUp ? editReply ? `editReply` : `followUp` : `reply` : `send`
		const embed = new EmbedBuilder()
		/**
		 * Format Components to correct data type
		 */
		formatComponents()

		/**
		 * Create file object if supplied data
		 */
		constructFileProp()

		//  Handle message with paging property enabled
		if (paging) return await this.pageModule(content, plugins, RESPONSE_REF, RESPONSE_TYPE, components, withResponse, ephemeral, _isSlash, cardPreviews)

		//  Replace content with error message if content is a faulty value
		if (typeof content != `string`) content = this.localeMetadata(`LOCALIZATION_ERROR`)

		//  Find all the available {{}} socket in the string.
		content = this.socketing(content, socket)

		//  Mutate message if status property is defined
		if ([`success`, `warn`, `fail`].includes(status)) color = status === `success` ? `#ffc9e2` : `crimson`

		//  Returns simple message w/o embed
		if (simplified) return await sendMessage.call(this)

		//  Add notch/chin
		if (notch) content = `\u200C\n${content}\n\u200C`

		if (content === ``) content = null

		await createEmbed()

		if (raw) return embed

		let sent = await sendMessage.call(this)

		if (file) sent = await sendMessage.call(this)

		if (!deleteIn) return sent
		sent

		return setTimeout(() => {
			if (!sent) return
			if (!sent.deletable) return
			sent.delete().catch(() => { return })
		}, deleteIn * 1000)


		async function sendMessage() {
			const noEmbed = Object.keys(embed.data).length === 0
			try {
				if (!RESPONSE_REF) throw new Error(`[Internal Error] Variable not populated`)
				if (!RESPONSE_TYPE) throw new Error(`[Internal Error] Variable not populated`)
				if (!RESPONSE_REF[RESPONSE_TYPE]) throw new Error(`[Internal Error] Variable not populated`)
				if (!hasFileUploadPerm && file) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions > Missing "AttachFiles" permission`)
				if (!hasFileUploadPerm && image) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions > Missing "AttachFiles" permission`)

				if (hasFileUploadPerm && file) return RESPONSE_REF[RESPONSE_TYPE]({
					files: [file]
				})
				return RESPONSE_REF[RESPONSE_TYPE]({
					content: noEmbed ? content : topNotch ? topNotch : null,
					embeds: noEmbed ? null : [embed],
					files: embed.file ? [embed.file] : image ? [new AttachmentBuilder(prebuffer ? image : await loadAsset(image))] : null,
					components: components ? components : null,
					withResponse: withResponse,
					flags: ephemeral ? MessageFlags.Ephemeral : null
				})
			} catch (e) {
				if (e.message.startsWith(`[Internal Error]`)) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions or Variable is null`)
				this.client.logger.error(`[response.js] An error has occured > ${e} >\n${e.stack}`)
				const errorMsg = e.message || `Unknown Error`
				const errorStack = e.stack || `Unknown Error Stack`
				errorRelay(this.client, { fileName: `response.js`, errorType: `normal`, error_stack: errorStack, error_message: errorMsg }).catch(err => this.client.logger.error(`Unable to send message to channel > ${err}`))
			}
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

		function constructFileProp() {
			if (file === null || file === undefined || !plugins.file.filePath || !plugins.file.fileName || !plugins.file.fileDescription) {
				file = null
			} else {
				file.attachment = plugins.file.filePath
				file.name = plugins.file.fileName
				file.description = plugins.file.fileDescription
			}
		}
	}

	/**
	 * Return true if no errors are present
	 * @param {import("discord.js").Channel} field 
	 * @returns {Error | Boolean}
	 */
	checkPermissions(field, userObject) {
		if (userObject) return true
		if (!this.message.guild.members) throw new Error(`[Internal Error] Can't read members property`)
		if (field?.type != ChannelType.PublicThread && field?.type != ChannelType.PrivateThread) {
			const SendMessages = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.SendMessages)
			if (!SendMessages) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions > Missing "SendMessages" permission`)
		} else {
			const SendMessagesInThread = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.SendMessagesInThreads)
			if (!SendMessagesInThread) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions > Missing "SendMessagesInThreads" permission`)
		}

		const ViewChannel = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.ViewChannel)
		if (!ViewChannel) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions > Missing "ViewChannel" permission`)

		const embedLinks = this.message.guild.members.me.permissionsIn(field).has(PermissionFlagsBits.EmbedLinks)
		if (!embedLinks) throw new Error(`[Internal Error] DiscordAPIError: Missing Permissions > Missing "EmbedLinks" permission`)

		return true
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

	async pageModule(content, plugins, RESPONSE_REF, RESPONSE_TYPE, components, withResponse, ephemeral, _isSlash, cardPreviews) {
		let page = 0
		if (ephemeral) ephemeral = false
		const embeddedPages = await this._registerPages(content, plugins)
		return RESPONSE_REF[RESPONSE_TYPE](embeddedPages[0].file ? components ? {
			embeds: [embeddedPages[0]],
			files: [embeddedPages[0].file],
			components: components,
			withResponse: withResponse,
			flags: ephemeral ? MessageFlags.Ephemeral : null
		} : {
			embeds: [embeddedPages[0]],
			files: [embeddedPages[0].file],
			withResponse: withResponse,
			flags: ephemeral ? MessageFlags.Ephemeral : null
		} : components ? {
			embeds: [embeddedPages[0]],
			files: [],
			components: components,
			withResponse: withResponse,
			flags: ephemeral ? MessageFlags.Ephemeral : null
		} : {
			embeds: [embeddedPages[0]],
			files: [],
			withResponse: withResponse,
			flags: ephemeral ? MessageFlags.Ephemeral : null
		}).then(async (msg) => {
			this.ref = this.message.user
			msg = isInteractionCallbackResponse(msg) ? msg.resource.message : msg
			//  Buttons
			if (embeddedPages.length > 1) {
				await msg.react(`⏪`)
				await msg.react(`⏩`)
			}
			// Filters - These make sure the varibles are correct before running a part of code
			let filter = (reaction, user) => _isSlash ? reaction.emoji.name === `⏪` && user.id === this.ref.id : reaction.emoji.name === `⏪` && user.id === this.message.author.id
			//  Timeout limit for page buttons
			const backwards = msg.createReactionCollector({
				filter,
				time: 300000
			})
			filter = (reaction, user) => _isSlash ? reaction.emoji.name === `⏩` && user.id === this.ref.id : reaction.emoji.name === `⏩` && user.id === this.message.author.id
			const forwards = msg.createReactionCollector({
				filter,
				time: 300000
			})
			//  Add preview button if cardPreviews is enabled
			if (cardPreviews) {
				await msg.react(`👀`)
				let filter = (reaction, user) => _isSlash ? reaction.emoji.name === `👀` && user.id === this.ref.id : reaction.emoji.name === `👀` && user.id === this.message.author.id
				let preview = msg.createReactionCollector(filter, {
					time: 300000
				})
				let previewedPages = []
				preview.on(`collect`, async (r) => {
					r.users.remove(_isSlash ? this.ref.id : this.message.author.id)
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
				r.users.remove(_isSlash ? this.ref.id : this.message.author.id)
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
				r.users.remove(_isSlash ? this.ref.id : this.message.author.id)
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