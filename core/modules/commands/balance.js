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
		const growthDataFromLastWeek = `+7,532 (25%)`
		const readyCard = new Card({width: 250, height: 150, marginLeft: 70, theme: data.interfacemode})

		//	Custom base
		.createBase({cornerRadius: 8})

		//	Artcoins amount
		.addContent({main: totalBalance, marginTop: 82, justify: `center`, size: 26, fontWeight: `Bold`, align: `center`})
		.addContent({main: growthDataFromLastWeek, size: 7, justify: `center`, align: `center`, fontWeight: `Bold`, mainColor: `okay`})
		.addContent({main: `last week`, justify: `center`, size: 7, fontWeight: `Light`, align: `center`})
		.ready()


		return reply(`${emoji(`artcoins`)} ** | Your remaining balance, ${author.user.username}**`, {
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