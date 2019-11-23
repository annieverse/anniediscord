const {Attachment} = require(`discord.js`)
const {get} = require(`snekfetch`)
const {Canvas} = require(`canvas-constructor`)
const {resolve,join} = require(`path`)
const palette = require(`./colorset.json`)
const imageUrlRegex = /\?size=2048$/g
const profileManager = require(`./profileManager`)
const formatterManager = require(`./formatManager`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

class Banner {
	constructor(Components) {
		this.bot = Components.bot
		this.member = Components.member
		this.ch = Components.bot.channels.get(`${Components.channel}`)
		this.counter = Components.bot.channels.get(`518245560239652867`)
	}

	updateCounter() {
		const { threeDigitsComa } = new formatterManager()
		this.counter.setName(`˗ˏˋ ${threeDigitsComa(this.member.guild.memberCount)} Artists!! ˎˊ˗`)
	}


	async render() {
		const user = this.bot.users.get(this.member.id)
		const { body: avatar } = await get(user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
		const configProfile = new profileManager()

		this.ch.send(`Welcome to **AAU** ${user} ! Please get your roles in <#538843763544555528> for full access to the server, don't forget to read <#620695271323729920>. Last but not least enjoy your stay here! :tada:`,
			new Attachment(await welcomeCard(), `welcome!-${user.tag}.jpg`))


		async function welcomeCard() {

			let canvas_x = 800
			let canvas_y = 250
			let start_x = 30
			let start_y = 30

			let canv = new Canvas(800, 250) // x y

			canv.save()
			canv.save()
				.createBeveledClip(start_x, start_y, canvas_x - 50, canvas_y - 50, 500)
				.addImage(await configProfile.getAsset(`aug19_welcomer`), 0, 0, 800, 300, 400)
			canv.context.globalAlpha = 0.6
			canv.setColor(palette.black)
				.addRect(start_x, start_y, canvas_x - 40, canvas_y - 40)
				.restore()


				.setTextAlign(`left`)
				.setTextFont(`41pt RobotoBold`)
				.setColor(palette.lightgray)
				.addText(`${user.username.length >= 10 ? user.username.substring(0, 10)+`.` : user.username}.`, 390, 150) //102
			
				.setTextFont(`42pt Whitney`)
				.setColor(palette.white)
				.addText(`Hello,`, 240, 150)

				.setColor(palette.white)
				.addRoundImage(avatar, 20, 30, 205, 205, 100)

			return canv.toBuffer()
		}
	}

}


module.exports = Banner