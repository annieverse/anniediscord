const Discord = require("discord.js");
const fs = require('fs');


const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async(bot,command, message,args)=>{

    /// convertartcoin.js
    ///
    ///  Convert Coins Command 
    ///    change logs:
    ///       11/02/18 - bug fix.
    ///       09/17/18 - Major updates. Using Pan's xp curve as reference.
    ///       09/18/18 - Nerfed xp gained from cartcoins. (newXp / 2 = args + curXp)
    ///
    ///     -naphnaphz


let timestamp = new Date();
let bicon = bot.user.displayAvatarURL;

let cartcoinsEmbed = new Discord.RichEmbed();

let addXpEmbed = new Discord.RichEmbed();
let addXpEmbed2 = new Discord.RichEmbed();
let addXpEmbed3 = new Discord.RichEmbed();
let addXpEmbed4 = new Discord.RichEmbed();
let addXpEmbed5 = new Discord.RichEmbed();
let addXpEmbed6 = new Discord.RichEmbed();
let addXpEmbed7 = new Discord.RichEmbed();

sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {


if(!userdatarow) {
    sql.run("INSERT INTO userdata (userId, currentexp, maxexp, nextexpcurve, level, artcoins) VALUES (?, ?, ?, ?, ?, ?)", [message.author.id, 0, 100, 150, 0, 0])
}

cartcoinsEmbed.setColor('#d30000')
cartcoinsEmbed.setDescription(`Please put a number!`)
cartcoinsEmbed.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)
if(!args[0])return message.channel.send(cartcoinsEmbed);




cartcoinsEmbed.setDescription(`${message.author.username}, It seems you don't have enough art coins.`)
if((userdatarow.artcoins < args[0]) || (userdatarow.artcoins === 0))return message.channel.send(cartcoinsEmbed);



if(args[0].includes('all')) {


      const curveMultiplyXP = (x, lvl, b, c) => {
             for(let i = 150; i !== x; i += c) {

                  b += c;
                  c += 200;
                  lvl++;

                if(i > x) { break; }
            }
                  return {
                        x: x,
                        lvl: lvl,
                        b: b,
                        c: c

            }
        }

           let parsedXpData = Math.floor((userdatarow.artcoins / 2)) + userdatarow.currentexp;

             var xpScalingCurves = curveMultiplyXP(parsedXpData, 0, 0, 150);
             var updatedLvl = xpScalingCurves.lvl;
             var updatedMaxExp = xpScalingCurves.b;
             var updatedNextCurExp = xpScalingCurves.c;
             var nextLvlExp = updatedMaxExp;

                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Newblood').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Novice').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Amateur').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Warrior').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Contender').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Duelist').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Tactician').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Commander').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Berserker').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Gladiator').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Champion').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Master').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Hero').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Legend').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Archfiend').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Hellhound').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Demon').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Diablo').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Ascended').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Cherubium').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Seraphim').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Archangel').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Celestial').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Divine').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Heavenly Judge').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Celestial God').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Calamity Host').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Karma Killer').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Ruling Star').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Daybreaker').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Doombearer').id)

                           sql.run(`UPDATE userdata SET currentexp = ${parsedXpData} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET level = ${updatedLvl} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET maxexp = ${nextLvlExp} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET nextexpcurve = ${updatedNextCurExp} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET artcoins = 0 WHERE userId = ${message.author.id}`)


                                            if(updatedLvl <= 1) {
                                                message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Newblood").id)
                                                                    }

                                                                if(updatedLvl>=2 && updatedLvl<=3){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Novice").id)
                                                                     }

                                                                if(updatedLvl>=4 && updatedLvl<=5){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Amateur")).id
                                                                                             }

                                                                if(updatedLvl>=6 && updatedLvl<=7){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Warrior")).id
                                                                                             }

                                                                if(updatedLvl>=8 && updatedLvl<=9){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Contender")).id
                                                                                             }

                                                                if(updatedLvl>=10 && updatedLvl<=11){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Duelist")).id
                                                                                             }

                                                                if(updatedLvl>=12 && updatedLvl<=13){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Tactician")).id
                                                                                             }

                                                                if(updatedLvl>=14 && updatedLvl<=15){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Commander")).id
                                                                                             }

                                                                if(updatedLvl>=16 && updatedLvl<=17){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Berserker")).id
                                                                                             }

                                                                if(updatedLvl>=18 && updatedLvl<=19){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Gladiator")).id
                                                                                             }

                                                                if(updatedLvl>=20 && updatedLvl<=21){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Champion")).id
                                                                                             }

                                                                 if(updatedLvl>=22 && updatedLvl<=23){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Master")).id
                                                                                             }

                                                                 if(updatedLvl>=24 && updatedLvl<=25){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Hero")).id
                                                                                             }

                                                                 if(updatedLvl>=26 && updatedLvl<=27){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Legend")).id
                                                                                             }

                                                                 if(updatedLvl>=28 && updatedLvl<=29){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Archfiend")).id
                                                                                             }

                                                                 if(updatedLvl>=30 && updatedLvl<=32){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Hellhound")).id
                                                                                             }

                                                                 if(updatedLvl>=33 && updatedLvl<=35){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Demon")).id
                                                                                             }

                                                                 if(updatedLvl>=36 && updatedLvl<=38){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Diablo")).id
                                                                                             }

                                                                 if(updatedLvl>=39 && updatedLvl<=41){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Ascended")).id
                                                                                             }

                                                                 if(updatedLvl>=42 && updatedLvl<=44){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Cherubium")).id
                                                                                             }

                                                                 if(updatedLvl>=45 && updatedLvl<=47){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Seraphim")).id
                                                                                             }

                                                                 if(updatedLvl>=48 && updatedLvl<=51){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Archangel")).id
                                                                                             }

                                                                 if(updatedLvl>=52 && updatedLvl<=55){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Celestial")).id
                                                                                             }

                                                                 if(updatedLvl>=56 && updatedLvl<=59){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Divine")).id
                                                                                             }

                                                                 if(updatedLvl>=60 && updatedLvl<=63){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Heavenly Judge")).id
                                                                                             }

                                                                 if(updatedLvl>=64 && updatedLvl<=67){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Celestial God")).id
                                                                                             }

                                                                 if(updatedLvl>=68 && updatedLvl<=71){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Calamity Host")).id
                                                                                             }

                                                                 if(updatedLvl>=72 && updatedLvl<=75){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Karma Killer")).id
                                                                                            }

                                                                 if(updatedLvl>=76 && updatedLvl<=79){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Ruling Star")).id
                                                                        }

                                                                 if(updatedLvl>=80 && updatedLvl<=84){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Daybreaker")).id
                                                                    }

                                                                 if(updatedLvl>=85 && updatedLvl<=99){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Doombearer")).id
                                                                    }

                                                                 if(updatedLvl === 100){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Overlord")).id
                                                                    }


        addXpEmbed.setColor('#595959')
        addXpEmbed.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            0% | *initializing,.*`)
        addXpEmbed.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        addXpEmbed2.setColor('#595959')
        addXpEmbed2.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            25% | *retrieving data ..*\n
            ID: ${message.author.id}`)
        addXpEmbed2.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        addXpEmbed3.setColor('#595959')
        addXpEmbed3.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            50% | *retrieving data ..*\n
            ID: ${message.author.id}
            *estimating current_xp values. .*`)
        addXpEmbed3.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)


        addXpEmbed4.setColor('#595959')
        addXpEmbed4.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            75% | *processing ..*\n
            ID: ${message.author.id}
            *estimating current_xp values. .*
            *estimating max_level values. .*`)
        addXpEmbed4.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        addXpEmbed5.setColor('#595959')
        addXpEmbed5.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            90% | *processing ..*\n
            ID: ${message.author.id}
            *current_xp updated.*
            *estimating max_level values. .*
            `)
        addXpEmbed5.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)


        addXpEmbed6.setColor('#595959')
        addXpEmbed6.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            99% | *finishing ..*\n
            ID: ${message.author.id}
            *current_xp updated.*
            *max_level updated.*
            `)
        addXpEmbed6.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        let xpDigit = parsedXpData.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        addXpEmbed7.setColor('#20e554')
        addXpEmbed7.setThumbnail(message.author.displayAvatarURL)
        addXpEmbed7.setDescription(`✅ | Data updated.`)
        addXpEmbed7.addField('Username', `${message.author.username}\n\`${message.author.id}\``)
        addXpEmbed7.addField('LVL', `${updatedLvl}`,true)
        addXpEmbed7.addField('XP', `${xpDigit}`,true)
        addXpEmbed7.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)
        addXpEmbed7.setTimestamp(timestamp)



    
        return message.channel.send(addXpEmbed).then((msg)=>
            msg.edit(addXpEmbed2)).then((msg)=>
            msg.edit(addXpEmbed3)).then((msg)=>
            msg.edit(addXpEmbed4)).then((msg)=>
            msg.edit(addXpEmbed5)).then((msg)=>
            msg.edit(addXpEmbed6)).then((msg)=>
            msg.edit(addXpEmbed7)).then((msg)=>
            console.log(`${message.author.tag} has converted ${args[0]}/${userdatarow.artcoins} ART_COINS to XP.`))
    }




     else if ((args[0] !== 'all') && (userdatarow.artcoins >= args[0])){  

                    //  THE BELOW CODE WILL BE EXECUTED IF USER SPECIFY THE AMOUNT OF ARTCOINS THAT GOING TO BE CONVERTED.

      const curveMultiplyXP = (x, lvl, b, c) => {
             for(let i = 150; i !== x; i += c) {

                  b += c;
                  c += 200;
                  lvl++;

                if(i > x) { break; }
            }
 
                  return {
                        x: x,
                        lvl: lvl,
                        b: b,
                        c: c

            }
        }


           let parsedXpData = Math.floor((parseInt(args[0]) / 2)) + userdatarow.currentexp;

             var xpScalingCurves = curveMultiplyXP(parsedXpData, 0, 0, 150);
             var updatedLvl = xpScalingCurves.lvl;
             var updatedMaxExp = xpScalingCurves.b;
             var updatedNextCurExp = xpScalingCurves.c;
             var nextLvlExp = updatedMaxExp;

                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Newblood').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Novice').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Amateur').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Warrior').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Contender').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Duelist').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Tactician').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Commander').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Berserker').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Gladiator').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Champion').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Master').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Hero').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Legend').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Archfiend').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Hellhound').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Demon').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Diablo').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Ascended').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Cherubium').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Seraphim').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Archangel').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Celestial').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Divine').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Heavenly Judge').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Celestial God').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Calamity Host').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Karma Killer').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Ruling Star').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Daybreaker').id)
                                                message.guild.member(message.author.id).removeRole(message.guild.roles.find("name", 'Doombearer').id)

                           sql.run(`UPDATE userdata SET currentexp = ${parsedXpData} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET level = ${updatedLvl} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET maxexp = ${nextLvlExp} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET nextexpcurve = ${updatedNextCurExp} WHERE userId = ${message.author.id}`)

                           sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins - parseInt(args[0])} WHERE userId = ${message.author.id}`)


                                            if(updatedLvl <= 1) {
                                                message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Newblood").id)
                                                                    }

                                                                if(updatedLvl>=2 && updatedLvl<=3){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Novice").id)
                                                                     }

                                                                if(updatedLvl>=4 && updatedLvl<=5){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Amateur")).id
                                                                                             }

                                                                if(updatedLvl>=6 && updatedLvl<=7){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Warrior")).id
                                                                                             }

                                                                if(updatedLvl>=8 && updatedLvl<=9){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Contender")).id
                                                                                             }

                                                                if(updatedLvl>=10 && updatedLvl<=11){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Duelist")).id
                                                                                             }

                                                                if(updatedLvl>=12 && updatedLvl<=13){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Tactician")).id
                                                                                             }

                                                                if(updatedLvl>=14 && updatedLvl<=15){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Commander")).id
                                                                                             }

                                                                if(updatedLvl>=16 && updatedLvl<=17){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Berserker")).id
                                                                                             }

                                                                if(updatedLvl>=18 && updatedLvl<=19){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Gladiator")).id
                                                                                             }

                                                                if(updatedLvl>=20 && updatedLvl<=21){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Champion")).id
                                                                                             }

                                                                 if(updatedLvl>=22 && updatedLvl<=23){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Master")).id
                                                                                             }

                                                                 if(updatedLvl>=24 && updatedLvl<=25){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Hero")).id
                                                                                             }

                                                                 if(updatedLvl>=26 && updatedLvl<=27){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Legend")).id
                                                                                             }

                                                                 if(updatedLvl>=28 && updatedLvl<=29){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Archfiend")).id
                                                                                             }

                                                                 if(updatedLvl>=30 && updatedLvl<=32){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Hellhound")).id
                                                                                             }

                                                                 if(updatedLvl>=33 && updatedLvl<=35){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Demon")).id
                                                                                             }

                                                                 if(updatedLvl>=36 && updatedLvl<=38){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Diablo")).id
                                                                                             }

                                                                 if(updatedLvl>=39 && updatedLvl<=41){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Ascended")).id
                                                                                             }

                                                                 if(updatedLvl>=42 && updatedLvl<=44){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Cherubium")).id
                                                                                             }

                                                                 if(updatedLvl>=45 && updatedLvl<=47){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Seraphim")).id
                                                                                             }

                                                                 if(updatedLvl>=48 && updatedLvl<=51){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Archangel")).id
                                                                                             }

                                                                 if(updatedLvl>=52 && updatedLvl<=55){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Celestial")).id
                                                                                             }

                                                                 if(updatedLvl>=56 && updatedLvl<=59){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Divine")).id
                                                                                             }

                                                                 if(updatedLvl>=60 && updatedLvl<=63){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Heavenly Judge")).id
                                                                                             }

                                                                 if(updatedLvl>=64 && updatedLvl<=67){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Celestial God")).id
                                                                                             }

                                                                 if(updatedLvl>=68 && updatedLvl<=71){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Calamity Host")).id
                                                                                             }

                                                                 if(updatedLvl>=72 && updatedLvl<=75){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Karma Killer")).id
                                                                                            }

                                                                 if(updatedLvl>=76 && updatedLvl<=79){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Ruling Star")).id
                                                                        }

                                                                 if(updatedLvl>=80 && updatedLvl<=84){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Daybreaker")).id
                                                                    }

                                                                 if(updatedLvl>=85 && updatedLvl<=99){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Doombearer")).id
                                                                    }

                                                                 if(updatedLvl === 100){
                                                                        message.guild.member(message.author.id).addRole(message.guild.roles.find("name","Overlord")).id
                                                                    }


        addXpEmbed.setColor('#595959')
        addXpEmbed.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            0% | *initializing,.*`)
        addXpEmbed.setFooter(`Anime Artist United | Add Converting Art Coins to XP`, bicon)

        addXpEmbed2.setColor('#595959')
        addXpEmbed2.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            25% | *retrieving data ..*\n
            ID: ${message.author.id}`)
        addXpEmbed2.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        addXpEmbed3.setColor('#595959')
        addXpEmbed3.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            50% | *retrieving data ..*\n
            ID: ${message.author.id}
            *estimating current_xp values. .*`)
        addXpEmbed3.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)


        addXpEmbed4.setColor('#595959')
        addXpEmbed4.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            75% | *processing ..*\n
            ID: ${message.author.id}
            *estimating current_xp values. .*
            *estimating max_level values. .*`)
        addXpEmbed4.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        addXpEmbed5.setColor('#595959')
        addXpEmbed5.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            90% | *processing ..*\n
            ID: ${message.author.id}
            *current_xp updated.*
            *estimating max_level values. .*
            `)
        addXpEmbed5.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)


        addXpEmbed6.setColor('#595959')
        addXpEmbed6.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            99% | *finishing ..*\n
            ID: ${message.author.id}
            *current_xp updated.*
            *max_level updated.*
            `)
        addXpEmbed6.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)

        let xpDigit = parsedXpData.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        addXpEmbed7.setColor('#20e554')
        addXpEmbed7.setThumbnail(message.author.displayAvatarURL)
        addXpEmbed7.setDescription(`✅ | Data updated.`)
        addXpEmbed7.addField('Username', `${message.author.username}\n\`${message.author.id}\``)
        addXpEmbed7.addField('LVL', `${updatedLvl}`,true)
        addXpEmbed7.addField('XP', `${xpDigit}`,true)
        addXpEmbed7.setFooter(`Anime Artist United | Converting Art Coins to XP`, bicon)
        addXpEmbed7.setTimestamp(timestamp)



    
        return message.channel.send(addXpEmbed).then((msg)=>
            msg.edit(addXpEmbed2)).then((msg)=>
            msg.edit(addXpEmbed3)).then((msg)=>
            msg.edit(addXpEmbed4)).then((msg)=>
            msg.edit(addXpEmbed5)).then((msg)=>
            msg.edit(addXpEmbed6)).then((msg)=>
            msg.edit(addXpEmbed7)).then((msg)=>
            console.log(`${message.author.tag} has converted ${args[0]} ART_COINS to XP.`))

        }


    })
}

//////////////////////////////  FRYING PAN's XP SYSTEM REFERENCE ////////////////////////////
/*
let sXp = xp[message.author.id].xp
let sCoins = coins[message.author.id].coins;
let curlvl = xp[message.author.id].level;

    let totalxp = (sXp + parseInt(args[0]));
    let exponent = Math.pow(curlvl, 2)
    let nxtLvl = 100 * exponent + 50 * curlvl + 100;
    let maxlvl = true;
    if (nxtLvl <= sXp + parseInt(args[0])  && curlvl <= 100 ) {
        curlvl++;
        message.channel.send("Calculating your new xp and any posible new levels...");
        maxlvl = !maxlvl;
    }
    while (!maxlvl) {
        exponent = Math.pow(curlvl, 2)
        nxtLvl = 100 * exponent + 50 * curlvl + 100;
        if (nxtLvl <= sXp + parseInt(args[0]) && curlvl <= 100) {
            curlvl++;
            //message.channel.send(`Congratulation <@${message.author.id}>, you are now level ` + (curlvl))
            //maxlvl = !maxlvl;
        } else {
            message.channel.send("Ok I'm done, your new Level is "+curlvl+" and your new xp level is "+totalxp);
            maxlvl = true;
        }
    }
//
//
//
xp[message.author.id]={
    xp: totalxp,
    level: curlvl
}


 message.channel.send(`${message.author} has converted ${args[0]} Art Coins <:ArtCoins:467184620107202560> into xp. `)
fs.writeFile("./coins.json",JSON.stringify(coins),(err)=>{
    if(err)console.log(err)
});
fs.writeFile("./xp.json",JSON.stringify(xp),(err)=>{
    if(err)console.log(err)
});
*/
module.exports.help = {
    name:"cartcoins",
        aliases:[]
}