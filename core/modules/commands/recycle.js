class recycle {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async userInventory(){
		const { bot: { db }, meta: { author } } = this.stacks
		let inventory = await db.pullInventory(author.id)
		inventory = db._transformInventory(inventory)
		inventory = Object.keys(inventory)
		return inventory
	}

	async userInventoryCards(){
		const { bot: { db },meta: { author } } = this.stacks
		let inventory = await db.pullInventoryCards(author.id)
		inventory = db._transformInventory(inventory)
		inventory = Object.keys(inventory)
		return inventory
	}

	async getCardIds(){
		const { bot: { db } } = this.stacks
		let cardIdsRaw = await db.cardItemIds
		let cardIds = []
		cardIdsRaw.forEach(element => {
			cardIds.push(element.alias)
		})
		return cardIds
	}

	async userHasNoMoreCardsToCraft(){
		let cardIds = await this.getCardIds()
		let userInventory = await this.userInventoryCards()
		let answers = []
		for (let index = 0; index < cardIds.length; index++) {
			answers.push(userInventory.includes(cardIds[index]))
		}
		return answers.includes(false) ? false : true
	}

	async getRecycleItems(){
		const { bot: { db } } = this.stacks
		let recycleRaw = await db.recycleableItems
		let recycleData = []
		recycleRaw.forEach(element => {
			recycleData.push(element.alias)
		})
		return recycleData
	}

	async userHasItemsToRecycle(){
		let inventory = await this.userInventory()
		let recycleableItems = await this.getRecycleItems()
		let answers = []
		for (let index = 0; index < recycleableItems.length; index++) {
			answers.push(inventory.includes(recycleableItems[index]))
		}
		return answers.includes(true) ? true : false
	}

	async execute() {
		const {reply, code: { RECYCLE }} = this.stacks
		let hasCards = await this.userHasNoMoreCardsToCraft()
		if (!hasCards) return reply(RECYCLE.STILL_HAS_CARDS_TO_CRAFT)
		let hasRecycles = await this.userHasItemsToRecycle()
		if (!hasRecycles) return reply(RECYCLE.HAS_NO_ITEMS_TO_RECYCLE)
		
	}
}

module.exports.help = {
	start: recycle, 
	name:`recycle`, // This MUST equal the filename
	aliases: [], // More or less this is what the user will input on discord to call the command
	description: `Have items you can't use, convert them to AC. *ratio is 5:1`,
	usage: `TemplateCommand`,
	group: `shop`,
	public: false,
	require_usermetadata: true,
	multi_user: false
}