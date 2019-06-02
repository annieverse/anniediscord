const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { Attachment } = require("discord.js"); 
const { get } = require("snekfetch");
const palette = require("../colorset.json");
const Color = require('color');
const imageUrlRegex = /\?size=2048$/g; 
const databaseManager = require('../utils/databaseManager.js');
const ranksManager = require('../utils/ranksManager');
const profileManager = require('../utils/profileManager');
const formatManager = require('../utils/formatManager');


Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

module.exports.run = async (bot, command, message, args, utils) => {

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const configFormat = new formatManager(message);
const configProfile = new profileManager(); 
async function welcomeCard(member) {

    const members = member.guild.memberCount;
    const botSize = member.guild.members.filter(a => a.user.bot).size;
    const userSize = members - botSize;
    const d = Date.now();
    const guild = member.guild;
    const user = bot.users.get(member.id);
    const welcomechnl = guild.channels.find(channel => channel.id === "508385654259056660")
    const { body: avatar } = await get(member.user.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
    let name = member.user.username;

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

try {  
    const user = await utils.userFinding(message, message.content.substring(3));
    const caption = '<:Annie_Smug:523686816545636352> | Welcome card for ';
      if(!args[0]) {
        message.channel.startTyping();
        return message.channel.send(`**${caption + message.author.username}.**`,
                        new Attachment(await welcomeCard(message.member),`welcome-${message.author.username}.jpg`))
                        .then(() => message.channel.stopTyping() )
                        
      }
      else {
        message.channel.startTyping();
        return message.channel.send(`**${caption + user.user.username}.**`,
                        new Attachment(await welcomeCard(user),`welcome-${user.user.username}.jpg`))
                        .then(() => message.channel.stopTyping() )
      }

} catch(e) {
    console.log(e)
    message.channel.stopTyping()
    return configFormat.embedWrapper(palette.darkmatte, `Sorry, I couldn't find that user. :(`);
  }
}
module.exports.help = {
  name: "w",
    aliases: []
}