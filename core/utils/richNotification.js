const {
    get
} = require(`snekfetch`)
const {
    Canvas
} = require(`canvas-constructor`)
const {
    resolve,
    join
} = require(`path`)
const palette = require(`./colorset.json`)
const imageUrlRegex = /\?size=2048$/g
Canvas.registerFont(resolve(join(__dirname, `../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

class RichNotification {
    constructor(Components) {
        this.components = Components
    }


    nameSpacing(name = ``) {
        return name.length <= 9 ? 75 : 83
    }


    async render() {
        let canvas_x = 500
        let canvas_y = 60
        const { body: avatar } = await get(this.components.user.displayAvatarURL.replace(imageUrlRegex, `?size=512`))
        const { body: post } = await get(this.components.postPreview)

        let canv = new Canvas(canvas_x, canvas_y) // x y

        canv.save()
        canv.save()
            .setColor(palette.white)
            .addRect(0, 0, canvas_x, canvas_y)
            .setGlobalAlpha(0.2)
            .addImage(post, 0, 0, canvas_x, 1000)
            .restore()


            if (this.components.featured) {
                canv.addImage(post, canvas_x-150, -75, 150, 150)
                .setTextAlign(`left`)
                .setTextFont(`11pt RobotoBold`)
                .setColor(palette.darkmatte)
                .addText(`Congratulations! your post has been featured!`, 20, 35) 

                return canv.toBuffer()
            }


            canv.setTextAlign(`left`)
            .setTextFont(`11pt RobotoBold`)
            .setColor(palette.darkmatte)
            .addText(this.components.likerName, 67, 35) //102

            .setTextAlign(`left`)
            .setTextFont(`11pt Whitney`)
            .setColor(palette.darkmatte)
            .addText(`has liked your post in`, canv.measureText(this.components.likerName).width + this.nameSpacing(this.components.likerName), 35) //102


            const channelTextRange = canv.measureText(this.components.likerName + `has liked your post in`).width + this.nameSpacing(this.components.likerName) + 4

            canv.setTextAlign(`left`)
            .setTextFont(`11pt RobotoBold`)
            .setColor(palette.blue)
            .addText(this.components.channel, channelTextRange, 35) //102


            .setColor(palette.white)
            .addRoundImage(avatar, 15, 10, 40, 40, 20)

        return canv.toBuffer()
    }
}


module.exports = RichNotification