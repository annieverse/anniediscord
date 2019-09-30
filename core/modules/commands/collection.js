
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
			obj[key] = data[key]
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
	

	/**
	 * 	Execute function
	 *  @execute
	 */
	async execute() {
		const { code:{COLLECTION}, emoji, reply, name, meta:{author,data} } = this.stacks
		return reply(COLLECTION.FETCHING, {socket:[name(author.id)], simplified: true})
			.then(async load => {	
			const cards = this.filterCardFromInventory(data)
			load.delete()
			//	Return if user don't have any card
			if (Object.keys(cards).length < 1) return reply(COLLECTION.EMPTY)
			//	Card Author
			reply(COLLECTION.HEADER, {socket:[emoji(`AnnieWot`), name(author.id)], simplified: true})
			return reply(this.prettifyResult(await this.retrieveCardMetadata(cards)))
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