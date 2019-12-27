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
		const readyCard = new Card({width: 400, height: 150, marginLeft: 70, theme: data.interfacemode})

		//	Custom base
		.createBase({cornerRadius: 8})

		//	Header Part
		.addTitle({
			main: `Hello,`,
			caption: `here is your remaining balance ...`,
			fontWeight: `Thin`,
			captionMargin: 10,
			marginTop: 50,
			inline: true
		})
		.addTitle({main: `${author.user.username} ...`, marginTop: 50, marginLeft: 55, inline: true, releaseHook: true})

		//	Artcoins amount
		.addContent({main: commanifier(data.artcoins), marginTop: 100, size: 32, fontWeight: `Bold`})

		.ready()

		return reply(`${emoji(`artcoins`)} ** | Artcoins Balance for ${author.user.username}**`, {
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