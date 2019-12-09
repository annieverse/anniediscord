const GUI = require(`../../utils/canvasPageInterface`)
/**
 * 	Display user card collection
 * 	@collection
 */
class Collection {

	
	constructor(Stacks) {
		this.stacks = Stacks
		this.db = Stacks.bot.db.setUser(Stacks.meta.author.id)
	}


	/**
	 * 	Filtering card from user inventory. Fyi, this doesn't have any to do with external db calling.
	 * 	@param {Object} data user metadata.
	 * 	@getCardFromInventory
	 */
	filterCardFromInventory(data) {
		
		return Object.keys(data)
		.filter(key => key.endsWith(`_card`))
		.reduce((obj, key) => {
			if (data[key]>0) obj[key] = data[key]
			return obj
		}, {})
	}


	/**
	 * 	Pulling card metadata from itemlist
	 * 	@param {Object} data collection of card with quantity value.
	 *  @retrieveCardMetadata
	 */
	retrieveCardMetadata(data) {
		const ref = Object.keys(data)
		return this.db._query(`
			SELECT *
			FROM itemlist
			WHERE alias IN (${ref.map(() => `?`).join(`, `)})`
			, `all`
			, ref
		)
	}


	/**
	 * 	Prettify result to be displayed to user
	 * 	@param {Object} data returned collection from @retrieveCardMetadata
	 * 	@prettifyResult
	 */
	prettifyResult(data) {
		let { emoji } = this.stacks
		let content = ``
		let i = 1
		for (let key in data) {
			content += `[${i}] ${`★`.repeat(data[key].rarity)} - ${emoji(data[key].alias)} [${data[key].name}](https://discord.gg/Tjsck8F)\n\n`
			i++
		}
		return content
	}
	
	async getContainer(data){
		const { pause } = this.stacks

		let metadata = {
			item: [],
			rarity: [],
			type: [],
			alias: [],
			amount: data.length
		}

		for (let i = 0; i < metadata.amount; i++) {
			//	Store metadata
			metadata.item.push(data[i].name)
			metadata.rarity.push(data[i].rarity)
			metadata.type.push(data[i].type)
			metadata.alias.push(data[i].alias)
			await pause(100)

		}

		return metadata
	}

	/**
	 * 	Execute function
	 *  @execute
	 */
	async execute() {
		const { message,command, code:{COLLECTION}, emoji, reply, name, meta:{author,data}, textOption} = this.stacks
		return reply(COLLECTION.FETCHING, {socket:[name(author.id)], simplified: true})
			.then(async load => {	
				const cards = this.filterCardFromInventory(data)
				load.delete()
				//	Return if user don't have any card
				if (Object.keys(cards).length < 1) return reply(COLLECTION.EMPTY)
				//	Card Author
				if (textOption){
					reply(COLLECTION.HEADER, { socket: [emoji(`AnnieWot`), name(author.id)], simplified: true })
					return reply(this.prettifyResult(await this.retrieveCardMetadata(cards)))
				} else {
					let container = await this.getContainer(await this.retrieveCardMetadata(cards))
					let renderResult = await new GUI(this.stacks, container).render
					let count = 0
					const getPage = async (ctr) => {
						if (!renderResult[ctr]) return reply(`Couldn't find that card. It's probably empty.`)

						return reply(COLLECTION.HEADER, { 
							socket: [emoji(`AnnieWot`), 
							name(author.id)], 
							simplified: true, 
							prebuffer: true, 
							image: await renderResult[ctr]
						}).then(msg => {
							if (renderResult.length == 1) return
							msg.react(`⏪`).then(() => {
								msg.react(`⏩`)
								const backwardsFilter = (reaction, user) => (reaction.emoji.name === `⏪`) && (user.id === message.author.id)
								const forwardsFilter = (reaction, user) => (reaction.emoji.name === `⏩`) && (user.id === message.author.id)

								const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 })
								const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 })

								backwards.on(`collect`, async () => {
									count--
									if (count < 0) {
										count = renderResult.length - 1
									}
									await msg.delete()
									getPage(count)

								})
								forwards.on(`collect`, async () => {
									count++
									if (count > renderResult.length - 1) {
										count = 0
									}
									await msg.delete()
									getPage(count)
								})
								setTimeout(() => {
									if (!msg.deleted) msg.clearReactions()
								}, 60000)
							})
						})
					}
					//  Display result
					getPage(count)
				}
		})
	}
}


module.exports.help = {
	start: Collection,
	name: `collection`,
	aliases: [`collection`, `mycard`, `card`],
	description: `View yours or someones collected cards`,
	usage: `collection`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}