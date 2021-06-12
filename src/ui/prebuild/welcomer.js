const Canvas = require(`../setup`)
const loadAsset = require((`../../utils/loadAsset`))
const palette = require(`../colors/default`)
const { resolveImage } = require(`canvas-constructor`)
const sizeOfBuffer = require(`buffer-image-size`)

class UI {
    /**
     * Welcomer UI Builder.
     * to access the buffer, please call `.toBuffer()` after running `this.build()`
     * @param {guildMember} [member] member object.
     * @param {client} [bot] current client instance.
     * @param {string} [backgroundId=``] The id of the background.
     * @return {Canvas}
     */
    constructor(member, bot, backgroundId = ``) {
        this.bot = bot
        this.member = member
        this.backgroundId = backgroundId
    }

    async build() {
            const avatar = await resolveImage(this.member.user.displayAvatarURL({ format: `png`, dynamic: false }))
            let canvas_x = 800
            let canvas_y = 250
            let start_x = 30
            let start_y = 30
            let welcomerBackgroundId = this.backgroundId || this.member.guild.configs.get(`WELCOMER_IMAGE`).value
            const welcomerImage = this.member.guild.configs.get(`WELCOMER_NOIMAGE`).value
            const userPfpEnabled = this.member.guild.configs.get(`WELCOMER_DEFAULT`).value == `user pfp`
            const isDarkTheme = this.member.guild.configs.get(`WELCOMER_THEME`).value === `dark` ? true : false
            const background = await loadAsset(welcomerBackgroundId, `./src/assets/customWelcomer`)
            if (!welcomerImage) return
            let canv = new Canvas(800, 250)

            const imageCanv = Buffer.from((new Canvas(avatar.width, avatar.height).printImage(avatar, 0, 0).toBuffer()).buffer)
            const {
                width: bgWidth,
                height: bgHeight
            } = sizeOfBuffer(userPfpEnabled ? imageCanv : background)
            const combinedHeight = bgHeight * (800 / bgWidth)
            const dynamic = {
                height: combinedHeight < 0 ? 0 : combinedHeight,
                width: combinedHeight < 0 ? 800 + (0 - combinedHeight) : 800
            }
            canv.save()
            canv.save()
                .createRoundedClip(start_x, start_y, canvas_x - 50, canvas_y - 50, 500)

            .printImage(userPfpEnabled ? avatar : await resolveImage(background), 0, 0, dynamic.width, dynamic.height)
            canv.context.globalAlpha = 0.7
            canv.setColor(isDarkTheme ? palette.nightmode : palette.white)
                .printRectangle(start_x, start_y, canvas_x - 40, canvas_y - 40)
                .restore()

            .setTextAlign(`left`)
                .setTextFont(`41pt roboto-bold`)
                .setColor(isDarkTheme ? palette.white : palette.nightmode)
                .printText(`${this.member.user.username.length >= 10 ? this.member.user.username.substring(0, 10)+`..` : this.member.user.username+`!`}`, 320, 150) //102
		
			.setTextFont(`42pt roboto`)
			.printText(`Hi,`, 240, 150)

			.setColor(palette.white)
			.printCircularImage(avatar, 120, 130, 100)

		return canv.toBuffer()
	}

}


module.exports = UI