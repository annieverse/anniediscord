const Card = require(`../../utils/UILibrary/Cards`)
/**
 * Main module
 * @Balance outputing artcoins data
 */
class Balance {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	async beta() {
		const { reply, emoji, commanifier, meta : { author, data }} = this.stacks
		const totalBalance = commanifier(data.artcoins)
		const readyCard = new Card({width: 350, height: 150, marginLeft: 70, theme: data.interfacemode})

		//	Custom base
		.createBase({cornerRadius: 8})

		//	Artcoins amount
		.addContent({main: totalBalance, marginTop: 83, marginLeft: 145, size: 28, fontWeight: `Light`, align: `center`, inline: true})
		//.addContent({main: `ac`, marginTop: 82, marginLeft: 50, size: 12, fontWeight: `Light`, inline: true, releaseHook: true})

		.ready()

		return reply(`${emoji(`artcoins`)} ** | Here's your remaining balance, ${author.user.username}**`, {
			prebuffer: true,
			image: readyCard.toBuffer(),
			simplified: true
		})
	}


	async execute() {
		const { reply, bot, code, emoji, avatar, commanifier, meta : { author, data }} = this.stacks

		if(bot.env.dev) return this.beta()
		return reply(code.DISPLAY_BALANCE, {
			socket: [emoji(`artcoins`), commanifier(data.artcoins)],
			notch: true,
			thumbnail: avatar(author.id)
		})
	}
}


module.exports.help = {
	start: Balance,
	name: `balance`,
	aliases: [`bal`, `money`, `credit`, `ball`, `ac`, `artcoin`, `artcoins`],
	description: `Checks your AC balance`,
	usage: `bal`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}