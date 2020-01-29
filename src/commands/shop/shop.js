const Discord = require(`discord.js`)
const formatManager = require(`../../utils/formatManager`)
const databaseManager = require(`../../utils/databaseManager`)
class shop {
	constructor(Stacks) {
		this.stacks = Stacks
		this.message = Stacks.message
	}

	async execute() {
		const format = new formatManager(this.message)
		const {
			message,
			palette,
			emoji
		} = this.stacks
		const collection = new databaseManager(message.author.id)

		const registerItems = (source, target, emoji) => {
			let categories = []

			for (var key in source) {
				if (!categories.includes(source[key].type)) {
					categories.push(source[key].type)
				}
			}


			for (var i = 0; i < categories.length; i++) {
				var tempDesc = ``
				for (var c in source) {
					if (categories[i] === source[c].type) {
						let priceRange = format.threeDigitsComa(source[c].price)
						tempDesc += `${emoji} ${priceRange} - **${source[c].name}**\n\`${source[c].desc}\`\n\n`
					}
				}
				target.addField(categories[i], tempDesc)
			}
		}


		const links = {
			gacha: `https://i.ibb.co/J3WVdWw/discordaau-gachabanner.png`,
			premiumcover: `https://i.ibb.co/pKLyV1b/discordaau-premiumcoverbanner.png`,
			ticket: `https://i.ibb.co/xSj6GSZ/discordaau-ticketbanner.png`,
			expbooster: `https://i.ibb.co/QQTGvF0/discordaau-expboosterbanner.png`,
			skin: `https://i.ibb.co/MCSDk5C/discordaau-skinbanner.png`,
			badge: `https://i.ibb.co/bBB2pPf/discordaau-badgebanner.png`,
			regularcover: `https://i.ibb.co/j6C06LS/discordaau-regularcover.png`,
			roles: `https://i.redd.it/79disx5z5c8x.jpg`,
			sticker: `https://i.redd.it/79disx5z5c8x.jpg`,
		}



		//          WORKING ON NEW SHOP INTERFACE
		let registered_interface = []
		const interface_page = async (desc = `test`, img, footer = `footer`, type = `Tickets`, emojicode = `artcoins`, opt1 = undefined, opt2 = undefined) => {
			const page = new Discord.RichEmbed()
				.setDescription(desc)
				.setColor(palette.darkmatte)
				.setFooter(footer)
				.setImage(img)
			registerItems(await collection.classifyItem(type, opt1, opt2), page, emoji(emojicode))

			registered_interface.push(page)
		}


		async function run() {
			await interface_page(`Lucky Ticket has come!`, links.gacha, `[1 / 9]`, `Unique`, `artcoins`, `price < 130`)
			await interface_page(`May Special Cover!`, links.premiumcover, `[2 / 9]`, `Covers`, `magical_paper`, `price < 6`)
			await interface_page(`These are our general items!`, links.ticket, `[3 / 9]`, `Tickets`, `artcoins`, `unique_type != "Exp_booster"`)
			await interface_page(`Boost your social activities!`, links.expbooster, `[4 / 9]`, `Tickets`, `artcoins`, `_rowid_ > 2 AND unique_type = "Exp_booster"`, `name DESC`)
			await interface_page(`Customize your card theme!`, links.skin, `[5 / 9]`, `Skins`, `artcoins`)
			await interface_page(`Grab your artistic badges!`, links.badge, `[6 / 9]`, `Badges`, `artcoins`)
			await interface_page(`Beautify your profile cover!`, links.regularcover, `[7 / 9]`, `Covers`, `artcoins`, `price > 350`)
			await interface_page(`Choose your favorite roles!`, links.roles, `[8 / 9]`, `Roles`, `artcoins`, `price > 2000`)
			await interface_page(`Choose your favorite sticker!`, links.sticker, `[9 / 9]`, `Sticker`, `artcoins`, `price > 2000`)


			message.channel.send(registered_interface[0])
				.then(msg => {
					msg.react(`⏪`).then(() => {
						msg.react(`⏩`)

						const backwardsFilter = (reaction, user) => (reaction.emoji.name === `⏪`) && (user.id === message.author.id)
						const forwardsFilter = (reaction, user) => (reaction.emoji.name === `⏩`) && (user.id === message.author.id)

						const backwards = msg.createReactionCollector(backwardsFilter, {
							time: 60000
						})
						const forwards = msg.createReactionCollector(forwardsFilter, {
							time: 60000
						})
						let count = 0

						backwards.on(`collect`, r => {
							r.remove(message.author)
							count--

							if (registered_interface[count]) {
								msg.edit(registered_interface[count])
							} else {
								count++
							}

						})
						forwards.on(`collect`, r => {
							r.remove(message.author)
							count++

							if (registered_interface[count]) {
								msg.edit(registered_interface[count])
							} else {
								count--
							}

						})

						setTimeout(() => {
							msg.clearReactions()
						}, 60000)
					})
				})
		}

		return run()

	}
}

module.exports.help = {
	start: shop,
	name: `shop`,
	aliases: [],
	description: `Items you can buy`,
	usage: `shop`,
	group: `shop`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}
