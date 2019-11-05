class mainHub {
	constructor(Stacks) {
		this.stacks = Stacks
		this.messageIds = []
		this.recycleEchangeMeta = {}
		this.rarityLevels = {
			1: 5,
			2: 4,
			3: 3,
			4: 2,
			5: 1
		}
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
		let inventoryRaw = inventory
		inventory = db._transformInventory(inventory)
		let values = Object.values(inventory)
		let keys = Object.keys(inventory)
		values.forEach((element,index)=>{
			if (element < 1) delete inventory[keys[index]]
		})
		inventory = Object.keys(inventory)
		
		return {inventory,inventoryRaw}
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
		let recycleAlias = [], recycleData = []
		recycleRaw.forEach(element => {
			recycleAlias.push(element.alias)
			recycleData.push(element)
		})
		return {recycleAlias,recycleData}
	}

	async getRecyclesInInventory(){
		let inventory = await this.userInventory()
		inventory = inventory.inventory
		let recycleableItems = await this.getRecycleItems()
		let itemsInInventory = []
		for (let index = 0; index < recycleableItems.recycleAlias.length; index++) {
			for (let secondIndex = 0; secondIndex < inventory.length; secondIndex++) {
				if (recycleableItems.recycleAlias[index] == inventory[secondIndex]) itemsInInventory.push(inventory[secondIndex])
			}
		}
		return itemsInInventory
	}

	async userHasItemsToRecycle(){
		let inventory = await this.userInventory()
		inventory = inventory.inventory
		let recycleableItems = await this.getRecycleItems()
		let answers = []
		for (let index = 0; index < recycleableItems.recycleAlias.length; index++) {
			answers.push(inventory.includes(recycleableItems.recycleAlias[index]))
		}
		return answers.includes(true) ? true : false
	}

	get cleanMsgTransaction(){
		const { message } = this.stacks
		return message.channel.bulkDelete(this.messageIDs)
	}

	async buildRepMetadata(recyclesInInv){
		
		let recycleRarity = []
		let recycleDataRaw = await this.getRecycleItems()
		let recycleData = recycleDataRaw.recycleData
		for (let index = 0; index < recycleData.length; index++) {
			for (let secondIndex = 0; secondIndex < recyclesInInv.length; secondIndex++) {
				if (recycleData[index].alias == recyclesInInv[secondIndex]) {
					recycleRarity.push(recycleData[index].rarity)
					this.recycleEchangeMeta[recycleData[index].alias] = this.rarityLevels[recycleData[index].rarity]
				}
			}
		}
	}

	async execute() {
		const { message, trueInt,collector, emoji, reply, code: { RECYCLE } ,bot:{db} } = this.stacks

		this.messageIDs = message.id

		// user still has cards to craft
		let hasCards = await this.userHasNoMoreCardsToCraft()
		if (!hasCards) return reply(RECYCLE.STILL_HAS_CARDS_TO_CRAFT).then(msg => this.messageIDs = msg.id).then(this.cleanMsgTransaction)
		
		// user has no items to craft
		let hasRecycles = await this.userHasItemsToRecycle()
		if (!hasRecycles) return reply(RECYCLE.HAS_NO_ITEMS_TO_RECYCLE).then(msg => this.messageIDs = msg.id).then(this.cleanMsgTransaction)
		
		let recyclesInInv = await this.getRecyclesInInventory()
		await this.buildRepMetadata(recyclesInInv)
		
		let inventory = await this.userInventory()
		inventory = inventory.inventoryRaw
		var displayItems=``
		for (let index = 0; index < recyclesInInv.length; index++) {
			for (let secondIndex = 0; secondIndex < inventory.length; secondIndex++) {
				// eslint-disable-next-line no-useless-escape
				if (recyclesInInv[index] == inventory[secondIndex].alias && inventory[secondIndex].quantity > 0) displayItems += `> ${emoji(recyclesInInv[index])}**${recyclesInInv[index].replace(/\_/g, ` `)} x ${inventory[secondIndex].quantity}**\n`
			}
			
		}
		displayItems += `\n\n Above are all your available recyceables. Please type ** <amount> <itemname>** to recycle.`
		let metadata = {}
		reply(displayItems).then(msg => this.messageIDs = msg.id)
		collector.on(`collect`, async (msg) => {
			this.messageIDs = msg.id
			const input = msg.content.toLowerCase()
			const params = input.split(` `)


			//  Get amount of gift to send from first parameter
			metadata.amount_to_send = trueInt(params[0])
			//  Get type of item to send from second parameter. Ignoring spaces.
			// eslint-disable-next-line no-useless-escape
			metadata.item_to_send = input.slice(input.indexOf(params[1])).replace(/\ /g, `_`)
			//  Returns if format is invalid
			if (!metadata.amount_to_send && !metadata.item_to_send) return reply(RECYCLE.INVALID_FORMAT)

			if (this.recycleEchangeMeta[metadata.item_to_send] == (null || undefined)) return reply(RECYCLE.INVALID_FORMAT)

			
			//  Total gained reps from given properties above
			metadata.counted_reps = Math.floor(metadata.amount_to_send / this.recycleEchangeMeta[metadata.item_to_send])

			if (metadata.counted_reps == 0) return reply(RECYCLE.NOT_ENOUGH_ITEMS, { socket: [metadata.item_to_send, this.recycleEchangeMeta[metadata.item_to_send] - metadata.amount_to_send] })
			//  Closing the connections
			collector.stop()

			let itemData = await db.getItemMetadata(metadata.item_to_send)
			//  Send reputation points
			db.setUser(msg.author.id).storeArtcoins(metadata.counted_reps)
			//  Withdraw sender's gifts
			db.setUser(msg.author.id).withdraw(metadata.amount_to_send, itemData[0].itemId)

			this.cleanMsgTransaction
			//  recycling successful
			// eslint-disable-next-line no-useless-escape
			reply(`You have converted ${metadata.amount_to_send}, ${metadata.item_to_send.replace(/\_/g, ` `)}, into ${metadata.counted_reps} ${emoji(`artcoins`)}`)

		})
	}
}

module.exports.help = {
	start: mainHub, 
	name:`recycle`,
	aliases: [], 
	description: `Have items you can't use, convert them to AC.`,
	usage: `recycle`,
	group: `shop`,
	public: true,
	require_usermetadata: true,
	multi_user: false
}