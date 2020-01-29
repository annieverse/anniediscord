const { MessageCollector } = require(`discord.js`)
const logger = require(`../../utils/logger`)
const profile = require(`../gui/profilecardInterface`)

//  Await for user confirmation before proceeding the transaction.
class Checkout {
	constructor({itemdata, transaction, msg, user, stacks, preview = false}) {
		this.itemdata = itemdata
		this.transaction = transaction
		this.preview = preview
		this.message = msg
		this.stacks = stacks
		this.author = user
	}

	get collector() {
		return new MessageCollector(this.message.channel,
			m => m.author.id === this.author.id, {
				max: 1,
				time: 60000,
			})
	}

	//  Withdraw balance from user's account
	async paymentCheckout() {
		this.transaction.withdraw(this.itemdata)
	}

	//  Send item to user inventory
	async shipItem() {
		this.transaction[this.itemdata.type](this.itemdata)
	}

	async confirmation() {
		const { reply, emoji, palette, commanifier, normalizeString, code: { CHECKOUT } } = this.stacks
		//  Show user the item they are going to buy
		reply(CHECKOUT.METADATA, {
			socket: [
				this.itemdata.name,
				normalizeString(this.itemdata.type),
				emoji(this.itemdata.price_type),
				commanifier(this.itemdata.price)
			],
			color: palette.golden,
			image: this.itemdata.type == `Covers` || this.itemdata.type == `Sticker` ? await profile(this.stacks, this.author, 
				this.itemdata.type == `Covers` ? this.preview : null,
				this.itemdata.type == `Sticker` ? this.itemdata.alias : null
			) : this.preview,
			prebuffer: this.itemdata.type == `Covers` || this.itemdata.type == `Sticker` ? true : false,
			notch: true
		})
			.then(async cmeta => {
				this.collector.on(`collect`, async (msg) => {
					this.collector.stop()

					let input = msg.content.toLowerCase()
					msg.delete()
					cmeta.delete()
    
					//  If input not a 'y', cancel current transaction
					if (!input.startsWith(`y`)) return reply(CHECKOUT.CANCEL)
                
					try {
						//  Wait for item storing proccess
						await this.paymentCheckout()
						await this.shipItem()
        
						//  Transaction done
						return reply(CHECKOUT.SUCCESSFUL, {color: palette.lightgreen})
					}
					catch(e) {
						//  Handle unexpected error process
						reply(CHECKOUT.ERROR, {color: palette.red})
						logger.error(`${this.author.user.tag} has failed to do transaction. > ${e.stack}`)
					}
				})
			})
	}
}

module.exports = Checkout