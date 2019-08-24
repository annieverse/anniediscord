const cardMetadata = require(`../../utils/cards-metadata`)
const { RichEmbed } = require(`discord.js`)

/**
 * Crafting flow wrapper
 * @Craft
 */
class Craft {
	constructor(Stacks) {
		this.stacks = Stacks
		this.data = Stacks.meta.data
	}

	//  Check if materials are sufficient. Returns boolean
	sufficientMaterials(data) {
		for (let item in data) {
			if (this.data[item] < data[item]) return false
		}
		return true
	}

	// custom pages for crafting interface
	async loadInterface() {

		const {
			emoji,
			palette,
			commanifier,
			message
		} = this.stacks

		//  Get required metadata from cardMetadata and returns as an object of array.
		const extractingMetadata = () => {
			let res = {
				name: [],
				img: [],
				materials: [],
				description: [],
				aliases: []
			}
			for (let key in cardMetadata) {
				const data = cardMetadata[key]

				res.name.push(data.fullname)
				res.img.push(data.url)
				res.materials.push(data.req_materials)
				res.description.push(data.description)
				res.aliases.push(data.alias)
			}
			return res
		}


		//  Listing req materials with highlight(if requirement has met)
		const materialList = (obj) => {
			let res = ``
			const items = Object.keys(obj)
			const values = Object.values(obj)
			for (let i = 0; i < items.length; i++) {
				if (this.data[items[i]]===null) {
					this.data[items[i]] = `0`
				}
				let rowtext = `(${commanifier(this.data[items[i]])} / ${commanifier(values[i])})\n`
				res += this.data[items[i]] < values[i] ? `- ${emoji(items[i])} ${rowtext}` :
					`- ${emoji(items[i])} [${rowtext}](https://discord.gg/Tjsck8F)`
			}
			return res
		}


		//  Storing each pages of embeds
		const registeringEmbeds = () => {
			const data = extractingMetadata()

			let res = []
			for (let i = 0; i < data.name.length; i++) {

				const craftable = this.sufficientMaterials(data.materials[i])
				const label = this.data[data.aliases[i]] ? `[Owned]` : craftable ? `[Craftable]` : ``

				let embed = new RichEmbed()
					.setColor(craftable ? palette.lightgreen : palette.darkmatte)
					.setImage(data.img[i])
					.setDescription(`**${label}${data.name[i]} (★★★★★)**\n"${data.description[i]}"\n\nRequired materials :\n${materialList(data.materials[i])}`)

				//  Store card metadata
				embed.card_metadata = cardMetadata[data.aliases[i]]
				res[i] = embed
			}
			return res
		}

		const embedArray = await registeringEmbeds()
		let page = 0

		message.channel.send(`\`Preparing craft interface . .\``)
			.then(async loading => {
				message.channel.send(embedArray[0])
					.then(async msg => {

						loading.delete()

						await msg.react(`⏪`)
						await msg.react(`⏩`)
						await msg.react(`🔨`)

						// Filters - These make sure the varibles are correct before running a part of code
						const backwardsFilter = (reaction, user) => reaction.emoji.name === `⏪` && user.id === message.author.id
						const forwardsFilter = (reaction, user) => reaction.emoji.name === `⏩` && user.id === message.author.id // We need two filters, one for forwards and one for backwards
						const selectItemFilter = (reaction, user) => reaction.emoji.name === `🔨` && user.id === message.author.id


						const backwards = msg.createReactionCollector(backwardsFilter, {
							time: 120000
						})
						const forwards = msg.createReactionCollector(forwardsFilter, {
							time: 120000
						})
						const select = msg.createReactionCollector(selectItemFilter, {
							time: 120000
						})

						//	Left navigation
						backwards.on(`collect`, r => {
							r.remove(message.author.id)
							page--
							if (embedArray[page]) {
								msg.edit(embedArray[page])
							} else {
								page++
							}
						})

						//	Right navigation
						forwards.on(`collect`, r => {
							r.remove(message.author.id)
							page++
							if (embedArray[page]) {
								msg.edit(embedArray[page])
							} else {
								page--
							}
						})

						//  Crafting phase
						select.on(`collect`, () => {

							//  End collectors
							backwards.stop()
							forwards.stop()
							select.stop()
							msg.delete()

							this.user = this.stacks.meta
							this.card = embedArray[page].card_metadata
							return this.confirmation()
						})

						setTimeout(() => {
							msg.clearReactions()
						}, 120000)
					})
			})
	}

	//  Transaction flow
	async confirmation() {
		const { reply,code,palette,emoji,message,db, collector} = this.stacks

		//  Ask for confirmation before proceeding
		reply(code.CRAFT.CONFIRMATION, {
			socket: [emoji(this.card.alias), this.card.fullname],
			color: palette.golden,
			notch: true,
		})
			.then(async prompt => {
				collector.on(`collect`, async msg => {
					let input = msg.content.toLowerCase()
					msg.delete()

					//  Returns if transaction is unconfirmed
					if (!input.startsWith(`y`)) return reply(code.CHECKOUT.CANCEL)

					//  Returns if user level is below the requirement
					if (this.data.level < 5) return reply(code.CRAFT.LVL_TOO_LOW)

					//  Returns if user already owned the card.
					if (this.data[this.card.alias]) return reply(code.CRAFT.DUPLICATES)

					//  Returns if user's materials aren't sufficent
					if (!this.sufficientMaterials(this.card.req_materials)) return reply(code.CRAFT.INSUFFICIENT_MATERIALS, {
						color: palette.red
					})

					//	Withdraw & store items
					await db(message.author.id)
						.consumeMaterials(this.card.req_materials)
						.registerCard(this.card.alias)

					prompt.delete()
					return reply(code.CRAFT.SUCCESSFUL, {
						socket: [message.author.username, emoji(this.card.alias), this.card.fullname],
						color: palette.lightgreen
					})
				})
			})
	}

	//  Initialize
	async execute() {
		return this.loadInterface()
	}

}



module.exports.help = {
	start: Craft,
	name: `craftingCard`,
	aliases: [`craft`, `crafts`],
	description: `Opening crafting interface`,
	usage: `>craft`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}