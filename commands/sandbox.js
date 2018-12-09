const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { Attachment } = require("discord.js"); 
const { get } = require("snekfetch");
const fsn = require("fs-nextra");
const palette = require("../colorset.json");
const Color = require('color');
const imageUrlRegex = /\?size=2048$/g; 
const databaseManager = require('../utils/databaseManager.js');
const ranksManager = require('../utils/ranksManager');
const profileManager = require('../utils/profileManager');
const formatManager = require('../utils/formatManager');
const userFinding = require('../utils/userFinding')

Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

const sql = require('sqlite');
sql.open('.data/database.sqlite');

module.exports.run = async (bot,command, message, args) => {
  
       
async function profile(member) {  

  const collection = new databaseManager(member.id);
  const data = await collection.userdata;
  const keys = collection.storingKey(data);
  const dataRank = new ranksManager(bot, message, );

  const configProfile = new profileManager();
  const configFormat = new formatManager();
  /**
    * id = userid, cur = currentexp, max = maxexp,
    * crv = expcurve, lvl = userlevel, ac = userartcoins,
    * rep = userreputation, des = userdescription, ui = userinterfacemode
    * clr() = hex code of user's rank color.
    */

  const user = {
     id: data[keys[0]], cur: data[keys[1]], max: data[keys[2]],
    crv: data[keys[3]], lvl: data[keys[4]],  ac: data[keys[5]],
    rep: data[keys[6]], des: data[keys[7]],  ui: data[keys[8]],
    get clr() { return (Color(dataRank.ranksCheck(this.lvl).color).desaturate(0.6)).hex() }
  }

  const switchColor = {

        "Dark": {
            base: palette.nightmode,
            border: palette.deepnight,
            text: palette.white,
            secondaryText: palette.lightgray
        },

        "Light": {
            base: palette.white,
            border: palette.lightgray,
            text: palette.darkmatte,
            secondaryText: palette.blankgray
        }
  }

        let canvas_x = 650;
        let canvas_y = 750;
        let startPos_x = 15;
        let startPos_y = 20;
        let baseWidth = 610;
        let baseHeight = 710;
        let barlength_xp = baseWidth-135;
       
        //PAN's attempt
        let PanCurrent = user.crv === 150 ? user.max - (user.max - user.cur) : user.crv - (user.max - user.cur);
        const { body: avatar } = await get(member.user.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
        const usercolor = configProfile.checkInterface(user.ui, member);
        const calculatedBar = await configProfile.barSize(user.cur, user.max, user.crv, barlength_xp);



        let canv = new Canvas(canvas_x, canvas_y) // x y
          
          /*
                x = starting point from x axis (horizontal)
                y = starting point from y axis (vertical)
                x2 = second point from (x)
                y2 = second point from (y)
          */

    canv = canv.setColor(user.clr)
           .save()// checkpoint

           .setColor(user.clr)
           .save()// checkpoint
           
           .setColor(user.clr)
           .save()// checkpoint
           
           .setColor(user.clr)
           .save()// checkpoint

           .setColor(user.clr)
           .save()// stack 1

           .setShadowColor("rgba(27, 27, 27, 1)")
           .setShadowOffsetY(5)
           .setShadowBlur(14)
           .setColor(palette.darkmatte)
           .addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
           .createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 15)
           .setColor(switchColor[usercolor].base)
           .addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
           .setShadowBlur(0)
           .setShadowOffsetY(0)
           .setColor(user.clr)
           //.addRect(startPos_x, startPos_y+215, baseWidth, 55) // badges area
           .save()// stack 2
          
           .createBeveledClip(startPos_x, startPos_y, baseWidth, 270, 1)
           .setColor(user.clr)
           .addRect(startPos_x, startPos_y-350, baseWidth+40, 922)
           .addImage(await configProfile.getAsset('defaultcover1'), startPos_x, startPos_y, baseWidth, 270, 107) // COVER HEADER
           .restore() // call stack 2
           .restore() // call stack 1

           .setColor(switchColor[usercolor].base)
           .addCircle((baseWidth/2)+10, 255, 95) //avatar
           .addRoundImage(avatar, 225, 165, 180, 180, 90)

           .restore()
           .setColor(switchColor[usercolor].border)
           .createBeveledClip(startPos_x+60, 550, baseWidth-135, 15, 20) //holderclip
           .addRect(startPos_x+60, 550, baseWidth-135, 20) // EXP BAR
           .addRect(startPos_x+65, 551, baseWidth-141, 13) // EXP BAR layer2
           .restore()
           .createBeveledClip(startPos_x+60, 550, calculatedBar, 15, 20) //currentbar_clip
           .setColor(user.clr)
           .addRect(startPos_x+60, 550, calculatedBar, 20) // EXP BAR colored(current)

           .restore()
           .createBeveledClip(startPos_x+210, 410, 175, 30, 30)   // role window
           .setColor(user.clr)
           .addRect(startPos_x+210, 410, 175, 30)

           .restore()
           .setColor(switchColor[usercolor].border)
           .addRect(startPos_x, 600, baseWidth, 2) // bottom border
           .addRect(407, 600, 2, 130) // right bottom border
           .addRect(223, 600, 2, 130) // left bottom border


           //BADGES

               // first row
               .addImage(await configProfile.getBadge('mdb'), startPos_x+150, startPos_y+222, 40, 40, 20)
               .addImage(await configProfile.getBadge('sai'), startPos_x+90, startPos_y+222, 40, 40, 20)           
               .addImage(await configProfile.getBadge('ps'), startPos_x+30, startPos_y+222, 40, 40, 20)

               //second row
               //.addImage(await configProfile.getBadge('csp'), startPos_x+407, startPos_y+222, 40, 40, 20)
               //.addImage(await configProfile.getBadge('csp'), startPos_x+467, startPos_y+222, 40, 40, 20)
               //.addImage(await configProfile.getBadge('ps'), startPos_x+527, startPos_y+222, 40, 40, 20)

            
           // BADGES END

               .restore() // call checkpoint

           .setColor(switchColor[usercolor].text)
           .setTextAlign("center")
           .setTextFont(`${configProfile.checkUsernameLength(member.user.username).profiler}pt ${configProfile.checkAlphanumeric(member.user.username)}`)  // NICKNAME
           .addText(member.user.username, 315, 390)

           .setColor(palette.white)
           .setTextFont(`15pt Roboto`)      // role window - role name
           .addText(dataRank.ranksCheck(user.lvl).title, 315, 433)

           .setColor(switchColor[usercolor].secondaryText)
           .setTextFont(`12pt Roboto`)      // profile description.
           .addText(configProfile.paragraphFormat(configProfile.checkDesc(user.des)).first, 315, 463)  
           .addText(configProfile.paragraphFormat(configProfile.checkDesc(user.des)).second, 315, 478)
           .addText(configProfile.paragraphFormat(configProfile.checkDesc(user.des)).third, 315, 493)

           .setColor(palette.midgray)
           .setTextFont(`28pt RobotoMedium`)      // reputation
           .addText(`★`, startPos_x+390, startPos_y+320)
           .setTextAlign("left")
           .setTextFont(`23pt RobotoMedium`) 
           .addText(configProfile.checkRep(user.rep), startPos_x+410, startPos_y+319)

           .setTextAlign("center") 
           .setColor(user.clr)
           .setTextFont("35pt RobotoMedium")      
           .addText(user.lvl, 315, 665) // middle point // level 
           .addText(configFormat.formatK(user.ac), 500, 665) // right point // AC
           .addText(configFormat.ordinalSuffix(await collection.ranking+1), 130, 665) // left point // rank

           .setTextFont("12pt Whitney")
           .addText('LEVEL', 315, 690) // middle point // level description
           .addText('ARTCOINS', 500, 690) // right point // artcoins description
           .addText('RANK', 130, 690) // left point // ranks description

           .setTextFont("12pt Roboto")
           .setTextAlign("left")  // current xp, max xp & percentage
           .addText(`${configFormat.threeDigitsComa(user.cur)} / ${configFormat.threeDigitsComa(user.max)} (${configFormat.getPercentage(PanCurrent, user.crv)}%)`, startPos_x+60, 540) // xp informations
            
           .setTextFont("14pt Roboto") // required exp to next lvl
           .setTextAlign("left")
           .addText(`${configFormat.threeDigitsComa(user.max - user.cur)}xp`, baseWidth-150, 585)

           .setTextFont("10pt Roboto") // next lvl up desc
           .setTextAlign("right")
           .addText(`NEXT LEVEL UP`, baseWidth-160, 584);


          return canv.toBuffer()


    }            
      


try {  
    const getUser = new userFinding.userFinding(message, message.content.substring(3))
    const user = await getUser.resolve();
    const caption = '<:AnniePumpkinHug:501857806836695040> | Profile card for ';
    return !args[0] ? message.channel.send(`**${caption + message.author.username}.**`,
                      new Attachment(await profile(message.member),`profcard-${message.author.username}.jpg`))
                    : message.channel.send(`**${caption + user.user.username}.**`,
                      new Attachment(await profile(user),`profcard-${user.user.username}.jpg`))

} catch(e) {
    return message.channel.send(`Sorry, I couldn't find that user.`);
  }


}

module.exports.help = {
  name: "p",
        aliases:[]
}