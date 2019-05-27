const Discord = require("discord.js");
const { Attachment } = require("discord.js");
const { get } = require("snekfetch"); 
const { Canvas } = require("canvas-constructor");
const { resolve, join } = require("path");
const palette = require(`../colorset.json`);
const imageUrlRegex = /\?size=2048$/g;
const profileManager = require('../utils/profileManager');
const formatterManager = require('../utils/formatManager');
Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

module.exports = (bot, member) => {
/*
		* @guildMemberAdd listener.
		* it will send canvas-generated message to welcome channel
		* for every joined user.
*/
	const members = member.guild.memberCount;
	const botSize = member.guild.members.filter(a => a.user.bot).size;
	const userSize = members - botSize;
	const configFormat = new formatterManager();
	const configProfile = new profileManager(); 
	const d = Date.now();
	const guild = member.guild;
	const user = bot.users.get(member.id);
	const welcomechnl = guild.channels.find(channel => channel.name === "general")

	bot.channels.get(`518245560239652867`).setName(`${configFormat.threeDigitsComa(userSize)} members!`);		
	
 const sendMsg = async () => {
  welcomechnl.send(`Welcome to Anime Artists United ${user} ! Please get your roles in ${member.guild.channels.get('538843763544555528').toString()} for full access to the server, don't forget to read ${member.guild.channels.get('472605630788665344').toString()} & ${member.guild.channels.get('575363719735803904').toString()}. Last but not least enjoy your stay here! :tada:`,
	new Attachment(await welcomeCard(user),`welcome!-${user.tag}.jpg`))
 }

 sendMsg();

async function welcomeCard(member) {

    const { body: avatar } = await get(member.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
    let name = member.username;

    let canvas_x = 800;
    let canvas_y = 220;
    let start_x = canvas_x-775;
    let start_y = canvas_y-200;
    
            let canv =  new Canvas(800, 250) // x y
                    
                canv.save()
                canv.save()
                canv.setShadowColor("rgba(28, 28, 28, 1)")
                    .setShadowOffsetY(3)
                    .setShadowBlur(6)
                    .addRect(start_x+10, start_y+10, canvas_x-55, canvas_y-50)
                    .createBeveledClip(start_x, start_y, canvas_x-40, canvas_y-40, 15)
                    .addImage(await configProfile.getAsset('marchwelcomer'), 0, -220, 800, 1200, 600)
                    .setShadowOffsetY(0)
                    .setShadowBlur(0)
                canv.context.globalAlpha = 0.5;
                canv.setColor(palette.black)  
                    .addRect(start_x, start_y, canvas_x-40, canvas_y-40)
                    .restore()


                    .setTextAlign("left")
                    .setTextFont(`39pt RobotoBold`)
                    .setColor(palette.lightgray)
                    .addText(`${name.length >= 10 ? name.substring(0, 13)+"." : name}.`, 390, 130) //102
                    
                    .setTextFont(`39pt Whitney`)
                    .setColor(palette.white)
                    .addText('Hello,', 260, 130)

                    .setTextFont("15pt Whitney")
                    .setColor(palette.white)
                    .addText(`You have joined`, 280, 157)

                    .setTextFont("16pt RobotoBold")
                    .setColor(palette.golden)
                    .addText(`AAU!`, 417, 160)

                    .setColor(palette.white)
                    .addRoundImage(avatar, 125, 65, 100, 100, 50)
                    //.addImage(await configProfile.getAsset('padoru1'), 715, 120, 90, 100, 45)
                    
                    return canv.toBuffer()
}


}
