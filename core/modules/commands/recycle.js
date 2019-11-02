class mainHub {
	constructor(Stacks) {
		this.stacks = Stacks
		this.messageIds = []
	}

	set messageIDs(item){
		this.messageIds.push(item)
	}

	get messageIDs(){
		return this.messageIds
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

	get cleanMsgTransaction(){
		const { message } = this.stacks
		message.channel.bulkDelete(this.messageIds)
	}

	async execute() {
		const { message, reply, code: { RECYCLE } } = this.stacks

		this.messageIds.push(message.id)

		// user still has cards to craft
		let hasCards = await this.userHasNoMoreCardsToCraft()
		if (!hasCards) return reply(RECYCLE.STILL_HAS_CARDS_TO_CRAFT)
		
		// user has no items to craft
		let hasRecycles = await this.userHasItemsToRecycle()
		if (!hasRecycles) return reply(RECYCLE.HAS_NO_ITEMS_TO_RECYCLE)
		
		new cleanInv(this.stacks).execute()
	}
}

class cleanInv extends mainHub {
	constructor(Stacks) {
		super(Stacks)
		this.stacks = Stacks
	}

	async execute(){
		const { reply } = this.stacks

		reply(`hmm`).then(msg => super.messageIds.push(msg.id))

		console.log(super.messageIds())
		//super.cleanMsgTransaction
	}
}

module.exports.help = {
	start: mainHub, 
	name:`recycle`,
	aliases: [], 
	description: `Have items you can't use, convert them to AC. *ratio is 5:1`,
	usage: `TemplateCommand`,
	group: `shop`,
	public: false,
	require_usermetadata: true,
	multi_user: false
}