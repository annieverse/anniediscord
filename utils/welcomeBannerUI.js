const {Attachment} = require("discord.js");
const {get} = require("snekfetch");
const {Canvas} = require("canvas-constructor");
const {resolve,join} = require("path");
const palette = require(`./colorset.json`);
const imageUrlRegex = /\?size=2048$/g;
const profileManager = require('./profileManager');
const formatterManager = require('./formatManager');
Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

class Banner {
    constructor(Components) {
        this.bot = Components.bot
        this.member = Components.member
        this.ch = Components.bot.channels.get(`${Components.channel}`)
        this.counter = Components.bot.channels.get(`518245560239652867`)
    }

    updateCounter() {
        const { threeDigitsComa } = new formatterManager();
        this.counter.setName(`${threeDigitsComa(this.member.guild.memberCount)} members!`);
    }


    async render() {
        const user = this.bot.users.get(this.member.id)
        const { body: avatar } = await get(user.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
        const configProfile = new profileManager();

        this.ch.send(`Welcome to **Anime Artists United** ${user} ! Please get your roles in <#538843763544555528> for full access to the server, don't forget to read <#608608699572944896> & <#575363719735803904>. Last but not least enjoy your stay here! :tada:`,
            new Attachment(await welcomeCard(), `welcome!-${user.tag}.jpg`))


        async function welcomeCard() {

            let canvas_x = 800;
            let canvas_y = 220;
            let start_x = canvas_x - 775;
            let start_y = canvas_y - 200;

            let canv = new Canvas(800, 250) // x y

            canv.save()
            canv.save()
            canv.setShadowColor("rgba(31, 31, 31, 1)")
                .setShadowOffsetY(3)
                .setShadowBlur(4)
                .addRect(start_x + 10, start_y + 10, canvas_x - 55, canvas_y - 50)
                .createBeveledClip(start_x, start_y, canvas_x - 40, canvas_y - 40, 15)
                .addImage(await configProfile.getAsset('aug19_welcomer'), 0, 0, 800, 250, 400)
                .setShadowOffsetY(0)
                .setShadowBlur(0)
            canv.context.globalAlpha = 0.4;
            canv.setColor(palette.black)
                .addRect(start_x, start_y, canvas_x - 40, canvas_y - 40)
                .restore()


                .setTextAlign("left")
                .setTextFont(`41pt RobotoBold`)
                .setColor(palette.lightgray)
                .addText(`${user.username.length >= 10 ? user.username.substring(0, 10)+"." : user.username}.`, 400, 130) //102

                .setTextFont(`42pt Whitney`)
                .setColor(palette.white)
                .addText('Hello,', 260, 130)

                .setTextFont("15pt Whitney")
                .setColor(palette.white)
                .addText(`You have joined`, 280, 157)

                .setTextFont("16pt RobotoBold")
                .setColor(palette.halloween)
                .addText(`AAU!`, 417, 160)

                .setColor(palette.white)
                .addRoundImage(avatar, 113, 47, 130, 130, 65)

            return canv.toBuffer()
        }
    }

}


module.exports = Banner