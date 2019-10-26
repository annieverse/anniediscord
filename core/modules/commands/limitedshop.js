const Discord = require(`discord.js`)
const databaseManager = require(`../../utils/databaseManager`)
const formatManager = require(`../../utils/formatManager`)
const env = require(`../../../.data/environment`)
const moment = require(`moment`)
const events = require(`../../utils/event-metadata`)

/**
 * Main module
 * @Limitedshop opening and closing limited time shop
 */
class Limitedshop {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	async execute() {
		const {bot, reply, message, command, isAdmin, isDev, palette, emoji, code: {UNAUTHORIZED_ACCESS}} = this.stacks
		if (!isDev && !isAdmin) return reply(UNAUTHORIZED_ACCESS)

		const args = message.content.substring(command.length + env.prefix.length + 1).split(` `)
		const format = new formatManager(message)
		/*
        * TODOs before opening shops
        * Upload and link shop banner for shop type with instructions >buy <category> <id>
        * Upload and define emotes and currencies in const events
        * Fill itemlist with shop items; use status for labels (e.g. halloween-sale); labels need to end with "sale"
        * Upload items to /core/images folder
        * */
		let shopchannel = bot.channels.get(`614819522310045718`)

		let shoptype
		let shopdata
		let shopname
		let shopcurrency
		let cleartimeout
		let db

		//in dev mode, the shop only gets opened to creators council
		let creatorscouncilrole = shopchannel.guild.roles.find((e) => e.id==`465587578327007233`)
		let everyonerole = shopchannel.guild.defaultRole

		//set timeouts for dev mode lower for easier testing
		let onedaytimeout = env.dev ? 10000 : 8.64e+7 //24 h = 8.64e+7 ms
		let oneweektimeout = env.dev ? 0 : 6.048e+8 //1 week = 6.048e+8 ms

		//special character to make channel names appear without -
		let channelspace = `  `

		const initShopData = (type) => {
			db = new databaseManager(message.member.id)

			shoptype = type ? type : getShopType(shopchannel.name)
			shopdata = events[shoptype]
			shopname = shopdata ? shopdata.emoteUnicode + `┋` + shopdata.shopname.replace(/ /g, channelspace) : shoptype + channelspace + `shop`
			shopcurrency = shopdata ? shopdata.currency : `artcoins`
		}

		/**
		 * Gets the on-sale items from itemlist
		 * Renames the shop channel name properly
		 * Formats the shop with shop name, banner, etc, and all the sale items
		 */
		const stock = async () => {
			reply(`Stocking the shop...`)

			const page = new Discord.RichEmbed()
				.setDescription(`The ` + shopname + ` is here! `)
				.setColor(palette.darkmatte)
				.attachFile(`core/images/shop-` + shoptype + `-cov.png`)
				.setImage(`https://i.ibb.co/2tXV3T8/aau-halloweenshop-tutorialbanner.png`)//TODO placeholder
			let numitems = getItems(await db.classifyLtdItem(shoptype, undefined, undefined), page, emoji(shopcurrency))
			page.setFooter(`We have ` + numitems + ` limited items in store!`)
			await shopchannel.send(page)
			reply(`Finished stocking`)
			await shopchannel.setName(shopname)
		}

		/**
		 * Sets the limited shop channel to public
		 */
		const open = async () => {
			reply(`Opening shop to the public...`)

			var opened = env.dev ? creatorscouncilrole.VIEW_CHANNEL : everyonerole.VIEW_CHANNEL
			if (opened) {//channel open to public
				reply(`Channel is already open`)
				return
			}

			//make channel 614819522310045718 public to @everyone
			if(!env.dev) {
				await shopchannel.overwritePermissions(everyonerole, { VIEW_CHANNEL: true })
			} else {
				await shopchannel.overwritePermissions(creatorscouncilrole, { VIEW_CHANNEL: true })
			}

			reply(`Scheduling clearing messages once per day...`)
			cleartimeout = setInterval(() => {
				clear()
				var opened = env.dev ? creatorscouncilrole.VIEW_CHANNEL : everyonerole.VIEW_CHANNEL
				if (!opened) {//channel open to public
					reply(`Stopping scheduled message deletion`)
					clearInterval(cleartimeout)
				}
			}, onedaytimeout)
		}

		/**
		 * Closes the shop to the public
		 * Renames the shop channel name to closed shop
		 */
		const close = () => {
			reply(`Scheduling shop for deletion in 1 week...`)
			//schedule shop for deletion in one week
			setTimeout(async ()=>{
				//make channel 614819522310045718 private
				reply(`Setting shop to private...`)
				await shopchannel.overwritePermissions(everyonerole, { VIEW_CHANNEL: false })
				await shopchannel.overwritePermissions(creatorscouncilrole, { VIEW_CHANNEL: false })
				reply(`Setting shop name to closed...`)
				await shopchannel.setName(`closed`+channelspace+`shop`)
				//await destroyCurr()
			}, oneweektimeout)

			//DM all users who still have currency
			reply(`Ping everyone with remaining currency...`)
			db.getUsersWithCurrency(shopcurrency)
				.then(async (data) => {
					for (var i=0;i<data.length;i++) {
						if(!env.dev) {
							var user = await bot.fetchUser(data[i].user_id)
							user.send(`ATTENTION!\n`+
								`\n You haven't spent all of your `+shopcurrency+`.`+
								`\n The store will close in exactly one week!`+//, and your `+shopcurrency+` will be destroyed!`+
								`\n So what are you waiting for? BUY BUY BUY!`)
						}
					}
					reply(`Done`)
				})
		}

		/**
		 * Deletes all messages but the first one (first being shop message)
		 * Message counter resets on bot restart
		 * Also limit is at 100 messages according to docs
		 */
		const clear = () => {
			shopchannel.fetchMessages({limit:100}).then(async (msgs) => {
				if (msgs.size>1) {
					await shopchannel.bulkDelete(msgs.size - 1)
				}
				if (msgs.size==100) {
					clear()
				}
			})
		}

		/**
		 * Helper method for stock()
         * If the stocker is too fukken lazy to specify the shop type
         * we will stock the shop for the upcoming event from the list below (approximately)
            * Halloween: 31.10
            * Christmas: 24.12
            * New Years: 31.12/01.01
            * Valentines: 14.02
            * Spring: 20.03 - 20.06
            * Easter: 22.03 - 25.04 (first sunday following first full moon on or after March 21st)
            * Annieversary: 22.06 (or 23.06 idk)
            * Summer: 21.06 - 23.09
         * */
		const getShopType = (shopname) => {
			if (shopname) {
				for (var key in events) {
					if (events.hasOwnProperty(key)) {
						if (shopname.toLowerCase().includes(key)) return key
					}
				}
			}

			let month = moment().month()
			let day = moment().date()
			switch (month) {
			case 0:
				return `valentines`
			case 1:
				if (day <= 14) return `valentines`
				return `spring`
			case 2:
			case 3:
				return `spring`
			case 4:
				return `annieversary`
			case 5:
				if (day <= 22) return `annieversary`
				return `summer`
			case 6:
				return `summer`
			case 7:
			case 8:
			case 9:
			case 10:
				return `halloween`
			case 11:
				if (day <= 25) return `christmas`
				return `new-year`
			}
		}

		/**
		 * Helper method for stock()
		 * Formats stocked items
		 */
		const getItems = (source, page, emoji) => {
			let categories = []

			for (var item of source) {
				if (!categories.find((i) => i.type==item.type)) {
					categories.push({type:item.type, text:``})
				}
				var c = categories[categories.length-1]
				//format copy pasted from shop.js
				let priceRange = format.threeDigitsComa(item.price)
				c.text += `${emoji} ${priceRange} - **${item.name}**\n\`${item.desc}\`\n\n`
			}
			for (var cat of categories) {
				page.addField(cat.type, cat.text)
			}
			return source.length
		}


		/**
		 * Start method
		 */
		const run = () => {
			const helpmsg = `To stock, open, close, or clear the shop, type >ltdshop stock/open/close/clear respectively`
			if (!args) return reply(helpmsg)
			initShopData(args[1])
			if (args[0] == `stock`) {
				clear()
				shopchannel.bulkDelete(1)
				stock()
			} else if (args[0] == `open`) {
				open()
			} else if (args[0] == `close`) {
				close()
			} else if (args[0] == `clear`) {
				clear()
			} else {
				return reply(helpmsg)
			}
		}
		run()
	}
}

module.exports.help = {
	start: Limitedshop,
	name: `limitedshop`,
	aliases: [`ltdshop`, `lshop`, `ltd`, `limitedshop`, `limited`],
	description: `Opens or closes limited time shop`,
	usage: `${env.prefix}ltdshop <open>/<close>`,
	group: `shop`,
	public: false,
	required_usermetadata: true,
	multi_user: false
}