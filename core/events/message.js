const ranksManager = require(`../utils/ranksManager.js`)
const palette = require(`../utils/colorset.json`)
const Discord = require(`discord.js`)
const sql = require(`sqlite`)
const ch = require(`../modules/config.json`)
sql.open(`.data/database.sqlite`) 
const env = require(`../.data/environment.json`)
const { art_domain } = require(`../modules/config`)
const dmOptions = require(`../utils/dmConfig/options`)
const Notification = require(`../utils/dmConfig/index`)
const KeyvClient = require(`keyv`)
const keyv = new KeyvClient()


// Handle DB connection errors
keyv.on(`error`, err => console.log(`Connection Error`, err))



module.exports = (bot, message) => {
	//  Returns if message is coming from bot
	if (message.author.bot) return

	//  Runs specific channel functions when in prod server
	if(!env.dev) {
		eventChannelFilter()
		portfolioRequest() 
		artChannelsFilter() 
	}

	//  Returns true if message has an attachment.
	function attachmentCheck() {
		try {
			return message.attachments.first().id ? true : null
		} catch (e) {
			return false
		}
	}


	//  Registering custom  portfolio.
	function portfolioRequest() {
		if (message.content.includes(`#myportfolio`) && attachmentCheck()) {
			let user = {
				img: message.attachments.first().url,
				id: message.author.id,
				tag: message.author.tag,
				loc: message.channel.name,
				date: Date.now()
			}
			message.react(`✅`)
			sql.run(`INSERT INTO userartworks (userId, url, timestamp, location) VALUES (?, ?, ?, ?)`, [user.id, user.img, user.date, user.loc])
			return console.log(`${user.tag} has submitted "${user.img}" through #myportfolio in ${user.loc}.`)
		}
	}


	//  Register submitted image in art channels
	//  As portfolio.
	function artChannelsFilter() {
		if (art_domain.includes(message.channel.id) && attachmentCheck() && !message.content.includes(`#myportfolio`)) {
			let img = message.attachments.first()
			message.react(`❤`)
			sql.run(`INSERT INTO userartworks (userId, url, timestamp, location) VALUES (?, ?, ?, ?)`, [message.author.id, img.url, Date.now(), message.channel.name])
			return console.log(`${message.author.tag} has submitted "${img.filename}" in ${message.channel.name}.`)
		}
	}


	//  Check if message is event-submission.
	async function eventChannelFilter() {
		const manager = new ranksManager(bot, message)
		let submissionchannel = bot.channels.get(`460615254553001994`)
		let eventchannel = bot.channels.get(`460615157056405505`)
		if (message.channel.id === submissionchannel.id && attachmentCheck()) {
			let role = manager.getRoles(`Event Participant`)
			let user = message.guild.member(message.author.id)
			let embed = new Discord.RichEmbed()
			//  Get user's card metadata
			let carddata = await sql.get(`SELECT * FROM collections WHERE userId = "${message.author.id}"`)

			//  Remove ticket
			user.removeRole(role)

			if (carddata.foxie_card) {
				//  Give 10 Chocolate Box if user has foxie card
				sql.run(`UPDATE userinventories SET chocolate_box = chocolate_box + 10 WHERE userId = "${message.author.id}"`)
				embed.setColor(palette.pink)
				embed.setTimestamp(Date.now())
				embed.setDescription(`**${message.author.username}** has submitted some work! ${bot.emojis.find(e => e.name === `bongofoxy`)}`)
				return eventchannel.send(embed)
			}

			embed.setColor(palette.golden)
			embed.setTimestamp(Date.now())
			embed.setDescription(`**${message.author.username}** has submitted some work! <:AnnieHype:523196958882529280>`)
			return eventchannel.send(embed)
		}
	}

	async function dmInterface() {

		//  Initialize mutated pistachio
		const Stacks = require(`../utils/Pistachio`)({bot, message, meta:{author:null}})
		const { reply, code:{DM} } = Stacks
		const actionId = `dmconfig:${message.author.id}`

		//  Get user options parameter
		const params = (message.content.toLowerCase()).split(` `)

		//  Returns if parameter is too short
		if (params.length < 1) return

		//  Returns if parent option is not available
		if (!dmOptions[params[0]]) return reply(DM.UNAVAILABLE_OPTION, {field: message.author})

		//  Returns if sub option is not available
		if (!dmOptions[params[0]].includes(params[1])) return reply(DM.UNAVAILABLE_OPTION, {field: message.author})
    
		//  Returns if user has recently make changes
		if (await keyv.get(actionId)) return reply(DM.COOLING_DOWN, {field: message.author})

		//  Store recent changes to avoid database lock. Restored in 5 seconds.
		keyv.set(actionId, `1`, 5000)

		//  Run config
		return new Notification(Stacks)[params[0]]()

	}


	//  Handle direct message type
	if(message.channel.type ===`dm`) return dmInterface()

	let prefix = env.prefix
	let messageArray = message.content.split(` `)
	let cmd = messageArray[0].toLowerCase()
	let args = messageArray.slice(1)
	let command = cmd.slice(prefix.length)
	let commandfile = bot.commands.get(cmd.slice(prefix.length)) || bot.commands.get(bot.aliases.get(cmd.slice(prefix.length)))

	if (env.dev && !env.administrator_id.includes(message.author.id)) return
	if (!ch.bot_domain.includes(message.channel.id)) return
	if (!message.content.startsWith(prefix)) return
	if (!commandfile) return


	const Components = {bot, message, command, args, commandfile, meta: {author: null, data: null}}
	const cmdHandler = require(`../modules/mainComponents.js`)
	return new cmdHandler(Components).init()

}