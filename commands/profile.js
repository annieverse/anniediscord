const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { Attachment } = require("discord.js"); 
const { get } = require("snekfetch");
const palette = require("../colorset.json");
const Color = require('color');
const probe = require('probe-image-size');
const imageUrlRegex = /\?size=2048$/g; 
const databaseManager = require('../utils/databaseManager.js');
const ranksManager = require('../utils/ranksManager');
const profileManager = require('../utils/profileManager');
const formatManager = require('../utils/formatManager');
const userFinding = require('../utils/userFinding')
const sql = require('sqlite');
sql.open('.data/database.sqlite');

Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");

module.exports.run = async (bot, command, message, args) => {

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;
  
const configFormat = new formatManager(message);
const configRank = new ranksManager(bot, message);
let errdump = 0;

return ["sandbox", `bot`].includes(message.channel.name) ? card() 
: configFormat.embedWrapper(palette.darkmatte, `Unavailable access.`)


async function card() {
        async function profile(member) {  
            const configProfile = new profileManager();
            const collection = new databaseManager(member.id);

            
            /**
                * id = userid, cur = currentexp, max = maxexp,
                * crv = expcurve, lvl = userlevel, ac = userartcoins,
                * rep = userreputation, des = userdescription, ui = userinterfacemode
                * clr = hex code of user's rank color.
                */

            const request_artcoins = () => {
            	return sql.get(`SELECT artcoins FROM userinventories WHERE userId = "${member.id}"`)
            			.then(async data => data.artcoins)
            }

            const user_ac = await request_artcoins();
            const userdata = await collection.userdata;
            const keys = collection.storingKey(userdata);
            const user = {
                id: userdata[keys[0]], cur: userdata[keys[1]], max: userdata[keys[2]],
                crv: userdata[keys[3]], lvl: userdata[keys[4]],  ac: user_ac,
                rep: userdata[keys[6]], des: userdata[keys[7]],  ui: userdata[keys[8]],
                prt: userdata[keys[9]], rtg: userdata[keys[10]], rvw: userdata[keys[11]],
                cov: userdata[keys[12]], log: userdata[keys[13]],
                get clr() { 
                return this.ui === "light_profileskin" ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
                        : this.ui === "dark_profileskin" ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.1)).hex()
                        : (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
                },
            }

            const badgesdata = await collection.badges;
            const slot = collection.storingKey(badgesdata);
            const reservedSlot = ( collection.storingValue(badgesdata) ).filter(x => (x !== null) ).length-1;
            const badgescontainer = {
                    id: badgesdata[slot[0]],  first: badgesdata[slot[1]], second: badgesdata[slot[2]],
                    third: badgesdata[slot[3]], fourth: badgesdata[slot[4]],  fifth: badgesdata[slot[5]],
                    sixth: badgesdata[slot[6]]
            }


            const switchColor = {

                    "dark_profileskin": {
                        base: palette.nightmode,
                        border: palette.deepnight,
                        text: palette.white,
                        secondaryText: palette.lightgray
                    },

                    "light_profileskin": {
                        base: palette.white,
                        border: palette.lightgray,
                        text: palette.darkmatte,
                        secondaryText: palette.blankgray
                    }
            }

                    let canvas_x = 600;
                    let canvas_y = 780;
                    let startPos_x = 15;
                    let startPos_y = 15;
                    let baseWidth = canvas_x-40;
                    let baseHeight = canvas_y-50;
                    let barlength_xp = baseWidth-135;
                
                    //PAN's attempt
                    let PanCurrent = user.crv === 150 ? user.max - (user.max - user.cur) : ((user.crv - 200) - (user.max - user.cur));
                    const { body: avatar } = await get(member.user.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
                    const usercolor = configProfile.checkInterface(user.ui, member);
                    const calculatedBar = await configProfile.barSize(PanCurrent, user.max, user.crv, barlength_xp);


                    let canv = new Canvas(canvas_x, canvas_y) // x y
                    
                    console.log(`${member.user.tag} | ${user.clr}`)
                    /*
                            x = starting point from x axis (horizontal)
                            y = starting point from y axis (vertical)
                            x2 = second point from (x)
                            y2 = second point from (y)
                    */


                    /**
                     *    CHECKPOINTS
                     * 
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
                    .save()// checkpoint
                    
                    .setColor(user.clr)
                    .save()// checkpoint

                    .setColor(user.clr)
                    .save()// checkpoint

                    .setColor(user.clr)
                    .save()// checkpoint

                    .setColor(user.clr)
                    .save()// stack 1


                    /**
                     *    CARD BASE
                     *    600 x 750
                     * 
                     */
                    .setShadowColor("rgba(28, 28, 28, 1)")
                    .setShadowOffsetY(12)
                    .setShadowBlur(18)
                    .setColor(palette.darkmatte)
                    .addRect(startPos_x+10, startPos_y+10, baseWidth-20, baseHeight-20) // (x, y, x2, y2)
                    .createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
                    .setColor(switchColor[usercolor].base)
                    .addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
                    .setShadowBlur(0)
                    .setShadowOffsetY(0)
                    .setColor(user.clr)
                    //.addRect(startPos_x, startPos_y+215, baseWidth, 55) // badges area
                    .save()// stack 2
                    

                    /**
                     *    PROFILE
                     *    HEADER COVER
                     * 
                     */
                    .createBeveledClip(startPos_x, startPos_y, baseWidth, 270, 1)
                    .setColor(user.clr)

                    if(!user.cov) {
                        canv.addRect(startPos_x, startPos_y-350, baseWidth+40, 922)
                            .addImage(await configProfile.getAsset('defaultcover1'), startPos_x, startPos_y, baseWidth+50, 270, 107) // COVER HEADER
                    } 
                    else {
                        //canv.addImage(avatar, startPos_x, startPos_y-200, baseWidth+50, baseWidth+100, 107) // COVER HEADER   
                        canv.addRect(startPos_x, startPos_y-350, baseWidth+40, 922)
                        canv.addImage(await configProfile.getAsset(user.cov), startPos_x, startPos_y, baseWidth+50, 270, 107) // COVER HEADER   
                    }
                    
                canv.restore() // call stack 2
                    .restore() // call stack 1


                    /**
                     *    USER
                     *    AVATAR
                     * 
                     */
                    .setColor(switchColor[usercolor].base)
                    .addCircle((baseWidth/2)+18, 255, 95) //avatar
                    .addRoundImage(avatar, 208, 165, 180, 180, 90)


                    /**
                    *    EXPERIENCE
                    *    BAR
                    * 
                    */
/*
                    .restore()
                    .setColor(switchColor[usercolor].border)
                    .createBeveledClip(startPos_x+65, 570, baseWidth-135, 20, 20) //holderclip
                    .addRect(startPos_x+65, 570, baseWidth-135, 25) // EXP BAR
                    .addRect(startPos_x+70, 571, baseWidth-141, 18) // EXP BAR layer2
                    .restore()
                    .createBeveledClip(startPos_x+65, 570, calculatedBar, 20, 20) //currentbar_clip
                    .setColor(user.clr)
                    .addRect(startPos_x+65, 570, calculatedBar, 25) // EXP BAR colored(current)
*/
                    

                    /**
                        * 
                        *   rank and exp window WINDOW
                        * 
                        */
                    .restore()
                    if(reservedSlot >= 1) {
                      canv.createBeveledClip(startPos_x+70, 490, 220, 40, 30)   // role window
                          .setColor(Color(user.clr).darken(0.3))
                          .addRect(startPos_x+70, 490, 220, 40)
                          .restore()
                          .createBeveledClip(startPos_x+305, 490, 170, 40, 30)   // exp window
                          .setColor(switchColor[usercolor].border)
                          .addRect(startPos_x+305, 490, 170, 40)
                    }
                    else {
                      canv.createBeveledClip(startPos_x+70, 520, 220, 40, 30)   // role window
                          .setColor(Color(user.clr).darken(0.3))
                          .addRect(startPos_x+70, 520, 220, 40)
                          .restore()
                          .createBeveledClip(startPos_x+305, 520, 170, 40, 30)   // exp window
                          .setColor(switchColor[usercolor].border)
                          .addRect(startPos_x+305, 520, 170, 40)
                    }



                    /**
                        * 
                        *   BADGE WINDOW
                        * 
                        */
/*
                    if(reservedSlot >= 1) {
                      canv.restore()                    
                      .createBeveledClip(startPos_x+300, 0, 50, 50, 30)   // role window
                      .setColor(user.clr)
                      .addRect(startPos_x+180, 0, 380, 50)
                    }
                    console.log(reservedSlot)
*/


                    /**
                        * 
                        *     THREE BOXES
                        *     BORDER
                        */
                    canv.restore()
                    .setColor(switchColor[usercolor].border)
                    .addRect(startPos_x+30, 617, baseWidth-60, 2) // bottom border
                    //.addRect(388, 612, 2, baseHeight-612) // right bottom border
                    //.addRect(204, 612, 2, baseHeight-612) // left bottom border


                    /**
                    *    BADGES COLLECTION
                    *    ABOVE EXP BAR
                    * 
                    */
                    const symetric_xy = 45;
                    const diameter = Math.round(symetric_xy / 2);
                    const y_badge = 556;
                    await setBadge(symetric_xy, diameter, y_badge);

                    async function setBadge(xy, diameter, pos_y) {
                            if(reservedSlot <= 1) {
                                canv.addImage(await configProfile.checkBadges(badgescontainer.first),  startPos_x+258,  pos_y, xy, xy, diameter)
                            }
                            else if(reservedSlot == 2) {
                                canv.addImage(await configProfile.checkBadges(badgescontainer.first),  startPos_x+243,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.second), startPos_x+293,  pos_y, xy, xy, diameter)
                            }
                            else if(reservedSlot == 3) { 
                                canv.addImage(await configProfile.checkBadges(badgescontainer.first),  startPos_x+208,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.second), startPos_x+258,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.third),  startPos_x+308,  pos_y, xy, xy, diameter)
                            }
                            else if(reservedSlot === 4) {
                                canv.addImage(await configProfile.checkBadges(badgescontainer.first),  startPos_x+193,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.second), startPos_x+243,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.third),  startPos_x+293,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.fourth), startPos_x+343,  pos_y, xy, xy, diameter)
                            }
                            else if(reservedSlot === 5) {
                                canv.addImage(await configProfile.checkBadges(badgescontainer.first),  startPos_x+158,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.second), startPos_x+208,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.third),  startPos_x+258,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.fourth), startPos_x+308,  pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.fifth),  startPos_x+358,  pos_y, xy, xy, diameter)
                            }
                            else{
                                canv.addImage(await configProfile.checkBadges(badgescontainer.first),  startPos_x+143,   pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.second), startPos_x+193,   pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.third),  startPos_x+243,   pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.fourth), startPos_x+293,   pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.fifth),  startPos_x+343,   pos_y, xy, xy, diameter)
                                    .addImage(await configProfile.checkBadges(badgescontainer.sixth),  startPos_x+393,   pos_y, xy, xy, diameter)
                            }
                        }



                    /**
                    *    PROFILE
                    *    USERNAME
                    * 
                    */
                canv.restore() // call checkpoint
                    .setColor(switchColor[usercolor].secondaryText)
                    .setTextAlign("center")
                    .setTextFont(`${configProfile.checkUsernameLength(member.user.username).profiler}pt RobotoBold`)  // NICKNAME
                    .addText(member.user.username, 300, 385)


                    .setColor(user.clr)
                    .setTextFont(`10pt RobotoBold`)
                    .addText(member.roles.find(r => r.name === 'Digital') ? 'D I G I T A L   A R T I S T' 
                    : member.roles.find(r => r.name === 'Traditional') ? 'T R A D I T I O N A L  A R T I S T' 
                    : member.roles.find(r => r.name === 'Mixed') ? 'G E N E R A L  A R T I S T'
                    : 'A R T  A P P R E C I A T O R', 300, 410)

                    /**
                    *    RANK
                    *    TITLE
                    * 
                    */
                    if(reservedSlot >= 1) {
                      canv.setColor(palette.white)
                          .setTextFont(`15pt RobotoBold`)      // role window - role name
                          .addText(configRank.ranksCheck(user.lvl).title, 195, 517)
                    }
                    else {
                      canv.setColor(palette.white)
                          .setTextFont(`15pt RobotoBold`)      // role window - role name
                          .addText(configRank.ranksCheck(user.lvl).title, 195, 547)
                    }



                    /**
                    *    PROFILE
                    *    DESCRIPTION
                    * 
                    */
                    canv.setColor(switchColor[usercolor].secondaryText)
                if(configProfile.checkDesc(user.des).length>0 && configProfile.checkDesc(user.des).length<55){
                    canv.setTextFont(`15pt Roboto`)      // profile description.
                        .addText(configProfile.formatString(configProfile.checkDesc(user.des),1).first, 300, 448)
                }
                else if(configProfile.checkDesc(user.des).length>55 && configProfile.checkDesc(user.des).length<110){
                    canv.setTextFont(`14pt Roboto`)      // profile description.
                        .addText(configProfile.formatString(configProfile.checkDesc(user.des),2).first, 300, 448) 
                        .addText(configProfile.formatString(configProfile.checkDesc(user.des),2).second, 300, 468)
                }
                else if(configProfile.checkDesc(user.des).length>110 && configProfile.checkDesc(user.des).length<165){
                    canv.setTextFont(`12pt Roboto`)      // profile description.
                        .addText(configProfile.formatString(configProfile.checkDesc(user.des),3).first, 300, 443)
                        .addText(configProfile.formatString(configProfile.checkDesc(user.des),3).second, 300, 458)
                        .addText(configProfile.formatString(configProfile.checkDesc(user.des),3).third, 300, 473)
                    }




                    /**
                    *    REPUTATION
                    *    POINTS
                    * 
                    */
                canv.setColor(palette.midgray)
                    .setTextFont(`28pt RobotoBold`)      // reputation
                    .addText(`★`, startPos_x+390, startPos_y+320)
                    .setTextAlign("left")
                    .setTextFont(`23pt RobotoBold`) 
                    .addText(configProfile.checkRep(user.rep), startPos_x+410, startPos_y+319)


                    /**
                    *    THREE BOXES
                    *    RANK, LVL, AC
                    * 
                    */
                    .setTextAlign("center") 
                    .setColor(user.clr)
                    .setTextFont("35pt RobotoMedium")      
                    .addText(user.lvl, 295, 682) // middle point // level 
                    .addText(configFormat.formatK(user.ac), 477, 682) // right point // AC
                    .addText(`${configFormat.ordinalSuffix(await collection.ranking+1)}`, 115, 682) // left point // rank

                    .setColor(switchColor[usercolor].secondaryText)
                    .setTextFont("12pt Whitney")
                    .addText('LEVEL', 295, 707) // middle point // level description
                    .addText('ARTCOINS', 477, 707) // right point // artcoins description
                    .addText('RANK', 115, 707) // left point // ranks description





                    /**
                    *    EXP PERCENTAGE, CURRENT & MAX.
                    *    @TEXTS that surrounding the bar.
                    * 
                    */
              if(reservedSlot >= 1) {
                  canv.setTextFont("14pt RobotoBold") // required exp to next lvl
                      .setTextAlign("center")
                      .addText(`${configFormat.threeDigitsComa(user.cur)} XP`, baseWidth-155, 517)
              }
              else {
                  canv.setTextFont("14pt RobotoBold") // required exp to next lvl
                      .setTextAlign("center")
                      .addText(`${configFormat.threeDigitsComa(user.cur)} XP`, baseWidth-155, 547)
              }

                    return canv.toBuffer()


        }
        async function portfolio(member) {
            const configProfile = new profileManager();
            const collection = new databaseManager(member.id);

            
            /**
                * id = userid, cur = currentexp, max = maxexp,
                * crv = expcurve, lvl = userlevel, ac = userartcoins,
                * rep = userreputation, des = userdescription, ui = userinterfacemode
                * clr = hex code of user's rank color.
                */
            const userdata = await collection.userdata;
            const keys = collection.storingKey(userdata);
            const user = {
                id: userdata[keys[0]], cur: userdata[keys[1]], max: userdata[keys[2]],
                crv: userdata[keys[3]], lvl: userdata[keys[4]],  ac: userdata[keys[5]],
                rep: userdata[keys[6]], des: userdata[keys[7]],  ui: userdata[keys[8]],
                prt: userdata[keys[9]], rtg: userdata[keys[10]], rvw: userdata[keys[11]],
                cov: userdata[keys[12]], log: userdata[keys[13]],
                get clr() { 
                return this.ui === "light_profileskin" ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
                        : this.ui === "dark_profileskin" ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.1)).hex()
                        : (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
                },
            }

            const badgesdata = await collection.badges;
            const slot = collection.storingKey(badgesdata);
            const reservedSlot = ( collection.storingValue(badgesdata) ).filter(x => (x !== null) ).length-1;
            const badgescontainer = {
                    id: badgesdata[slot[0]],  first: badgesdata[slot[1]], second: badgesdata[slot[2]],
                    third: badgesdata[slot[3]], fourth: badgesdata[slot[4]],  fifth: badgesdata[slot[5]],
                    sixth: badgesdata[slot[6]]
            }


            const switchColor = {

                    "dark_profileskin": {
                        base: palette.nightmode,
                        border: palette.deepnight,
                        text: palette.white,
                        secondaryText: palette.lightgray
                    },

                    "light_profileskin": {
                        base: palette.white,
                        border: palette.lightgray,
                        text: palette.darkmatte,
                        secondaryText: palette.blankgray
                    }
            }

                    let canvas_x = 790;
                    let canvas_y = 355;
                    let startPos_x = 15;
                    let startPos_y = 15;
                    let baseWidth = canvas_x-40;
                    let baseHeight = canvas_y-50;
                
                    const { body: avatar } = await get(member.user.displayAvatarURL.replace(imageUrlRegex, "?size=512"));
                    const usercolor = configProfile.checkInterface(user.ui, member);


                    let canv = new Canvas(canvas_x, canvas_y) // x y


                    canv = canv.setColor(user.clr)
                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .save()// checkpoint

                    .setColor(user.clr)
                    .save()// stack 1


                    /**
                     *    CARD BASE
                     *    850 x 400
                     * 
                     */
                    .setShadowColor("rgba(28, 28, 28, 1)")
                    .setShadowOffsetY(12)
                    .setShadowBlur(18)
                    .setColor(palette.darkmatte)
                    .addRect(startPos_x+10, startPos_y+10, baseWidth-20, baseHeight-20) // (x, y, x2, y2)
                    .createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
                    .setColor(switchColor[usercolor].base)
                    .addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
                    .setShadowBlur(0)
                    .setShadowOffsetY(0)
                    .save()// stack 2




                    async function gridImage(posx, posy, dx, dy) {
                        return sql.all(`SELECT url FROM userartworks WHERE userId = ${member.id} ORDER BY timestamp DESC`)
                            .then(async res => {


                               async function aspectRatio(src, suffix) {
                                    return probe(src, async (err, data) => {
                                        try {
                                            if(err) console.log(err);
                                            let width = data.width;
                                            let height = data.height;
                                            let smallest = width > height ? height : width;
                                            
                                            function zoomin() {
                                                for(let i = smallest*0.1; smallest < dx; i + (smallest*0.1)) {
                                                    width = Math.floor(width+i);
                                                    height = Math.floor(height+i);
                                                    smallest = Math.floor(smallest+i);
                                                }
                                            };
                                            
                                            function zoomout() {
                                                for(let i = 0.90; smallest > dx+30; i - 0.05) {
                                                    width = Math.floor(width*i);
                                                    height = Math.floor(height*i);
                                                    smallest = Math.floor(smallest*i);
                                                }
                                            };

                                            smallest > dx ? zoomout() : zoomin();

                                            let { body: photo } = await get(src);
                                            let highest = width > height ? width : height;
                                            canv.setColor(switchColor[usercolor].border)
                                                .createBeveledClip(posx+suffix, posy, dx, dy, 0)
                                                .addImage(await photo, posx+suffix, posy, width, height, Math.round(highest))
                                                .restore();
                                        }
                                        catch(e) {
                                            console.log(err);
                                            sql.run(`DELETE FROM userartworks WHERE url = "${src}"`);
                                            errdump = 1;
                                        }
                                    })
                               };

                               async function nullCollection() {
                                   canv.setColor(switchColor[usercolor].secondaryText)
                                    .setTextAlign("center")
                                    .setTextFont(`15pt RobotoBold`) 
                                    .addText(`No post yet.`, (baseWidth/2)+25, 230)
                                    .addImage(await configProfile.getAsset('anniewot'), 350, 125, 80, 80, 40);
                               }
                               
 
                                if(res.length < 1) {
                                    return nullCollection();
                                }

                                else {
                                    canv.setColor(switchColor[usercolor].border)
                                        .addRect(posx, posy, dx, dy)
                                        .addRect(posx+(dx*1)+2, posy, dx, dy)
                                        .addRect(posx+(dx*2)+4, posy, dx, dy)

                                        .save()
                                        .save()
                                        .save()
                                        .save()
                                        .save()
                                        .save()
                                        .save();

                                    if(res.length === 1) {
                                        await aspectRatio(res[0].url, 0);
                                    }

                                    else if(res.length == 2) {
                                        await aspectRatio(res[0].url, 0);
                                        await aspectRatio(res[1].url, (dx*1)+2);

                                    }
                                    else if(res.length >= 3) {
                                        await aspectRatio(res[0].url, 0);
                                        await aspectRatio(res[1].url, (dx*1)+2);
                                        await aspectRatio(res[2].url, (dx*2)+4);
                                    }

                                }
                            })
                    }

                    /**
                     *    USER
                     *    AVATAR
                     * 
                     */
                    //canv.addRoundImage(avatar, 30, 30, 40, 40, 20)

                    /**
                    *    title
                    * 
                    */
                   canv.setColor(user.clr)
                   .setTextAlign("left")
                   .setTextFont(`15pt Whitney`) 
                   .addText(`Portfolio`, (baseWidth/2)+25, 50)


                    /**
                    *    nickname
                    * 
                    */
                   .setColor(switchColor[usercolor].secondaryText)
                   .setTextAlign("right")
                   .setTextFont(`15pt Whitney`)  
                   .addText(`${member.user.username} |`, (baseWidth/2)+20, 50)



                   const pause = (ms) => {
                        return new Promise(resolve => setTimeout(resolve,ms));
                    }

                   canv.restore()
                   await gridImage(startPos_x, 70, 250, 250);
                   await pause(3000)

                   return canv.toBuffer();

        }        
        async function loadCard(userdata, name) {
            const caption = '<:Annie_Smug:523686816545636352> | Profile card for ';
            const collection = new databaseManager(userdata.id);
            const profiledata = await collection.userdata;

            message.channel.startTyping();
            message.channel.stopTyping();
            
            return message.channel.send(`**${caption + name}.**`, new Attachment(await profile(userdata),`profcard-${name}.jpg`))
                    .then( async (msg) => { 
                        if(profiledata.level < 35)return;

                        message.channel.stopTyping()
                        msg.react('⏬').then(() => {

                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === '⏬') && (user.id === message.author.id);            
                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                        forwards.on('collect', async (r) => {
                            msg.clearReactions();
                            message.channel.send(`\`Processing request ..\``).then(async load =>{
                                if(errdump > 0)return message.channel.send(`\`Aww sorry, something is went wrong. Please reload the profile.\``);
                                message.channel.send(new Attachment(await portfolio(userdata), `${userdata.user.tag}-portfolio.jpg`))
                                load.delete();
                            })
                        });

                        setTimeout(() => {
                            msg.clearReactions();
                        }, 30000)
                        })
                    }) 
        }


        async function loadStandalonePortfolio(userdata, name) {
            const caption = '<:anniepeek:543494742839918602> | Portfolio card for ';
            const collection = new databaseManager(userdata.id);
            const profiledata = await collection.userdata;

            message.channel.startTyping();
            message.channel.stopTyping();

            if(profiledata.level < 35 && (userdata.id === message.author.id))return configFormat.embedWrapper(palette.darkmatte, `You need to be atleast **level 35** to unlock portfolio feature.`);
            if(profiledata.level < 35 && (userdata.id !== message.author.id))return configFormat.embedWrapper(palette.darkmatte, `**${name}** hasn't unlocked portfolio feature yet.`)
            if(errdump > 0)return message.channel.send(`\`Aww sorry, something is went wrong. Please reload the profile.\``);
            return message.channel.send(`**${caption + name}.**`, new Attachment(await portfolio(userdata),`${name}-portfolio.jpg`))
        }     


            try {  
        
                if(!args[0]) {
                    command.startsWith(`portfolio`) ? loadStandalonePortfolio(message.member, message.author.username) : loadCard(message.member, message.author.username);
                }
                else {
                    const user = await userFinding.resolve(message, message.content.substring(command.length+2))
                    command.startsWith(`portfolio`) ? loadStandalonePortfolio(user, user.user.username) : loadCard(user, user.user.username);
                }

            } 
            catch(e) {
                console.log(e)
                return configFormat.embedWrapper(palette.darkmatte, `Sorry, I couldn't find that user. :(`)
            }
}

}

module.exports.help = {
  name: "profile",
        aliases:["prfl", "profil", "p", "mycard", "portfolio"]
}