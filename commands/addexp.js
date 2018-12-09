const Discord = require("discord.js");
const palette = require(`../colorset.json`);
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message,args)=>{

    /// addexp.js
    ///
    ///  ADDEXP COMMAND
    ///  change logs :
    ///      11/20/18 - Refactored & structure changes.
    ///      09/13/18 - minor bugs fixed.
    ///      09/17/18 - added role check. role remove. role add.
    ///
    ///     -naphnaphz
    ///     -Bait_God
    ///


    let bicon = bot.user.displayAvatarURL;
    let pUser  = message.guild.member(message.mentions.users.first()||message.guild.members.get(args[0]));
    let mentionedUser = message.mentions.users.first();
    let time = new Date();
    
let addXpEmbed = new Discord.RichEmbed();
let addXpEmbed2 = new Discord.RichEmbed();
let addXpEmbed3 = new Discord.RichEmbed();
let addXpEmbed4 = new Discord.RichEmbed();
let addXpEmbed5 = new Discord.RichEmbed();
let addXpEmbed6 = new Discord.RichEmbed();
let addXpEmbed7 = new Discord.RichEmbed();

    addXpEmbed.setColor('#d61313')
    addXpEmbed.setDescription(`You don't have authorization to use this command.`)
    addXpEmbed.setFooter(`Anime Artist United | Add XP`, bicon)

if(!message.member.roles.find(r => r.name === 'Staff'))return message.channel.send(addXpEmbed);


sql.get(`SELECT * FROM userdata WHERE userId ="${pUser.id}"`).then(async userdatarow => {


    if(!args[1]){
        addXpEmbed.setColor('#d30000')
        addXpEmbed.setDescription(`Please put the number.`)
        addXpEmbed.setFooter(`Anime Artist United | Add XP`, bicon)
        return message.channel.send(addXpEmbed);
    }

    else {


function ranksCheck(lv) {

      const cap = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
       33, 36, 39, 42, 45, 48, 52, 56, 60, 64, 68, 72, 76, 80, 85, 100];

      function getRoles(r) {
        const currentGuild = bot.guilds.get(message.guild.id);
        return currentGuild.roles.find(n => n.name === r)
      }


      function closestBelowLv(array, val){
        return Math.max.apply(null,array.filter(function(v)
          {
            return v <= val
          }))
      };

      let ranks = {

            "0": getRoles('Newblood'),
            "1": getRoles('Newblood'),
            "2": getRoles('Novice'),
            "4": getRoles('Amateur'),
            "6": getRoles('Warrior'),
            "8": getRoles('Contender'),
            "10": getRoles('Duelist'),
            "12": getRoles('Tactician'),
            "14": getRoles('Commander'),
            "16": getRoles('Berserker'),
            "18": getRoles('Gladiator'),
            "20": getRoles('Champion'),
            "22": getRoles('Master'),
            "24": getRoles('Hero'),
            "26": getRoles('Legend'),
            "28": getRoles('Archfiend'),
            "30": getRoles('Hellhound'),
            "33": getRoles('Demon'),
            "36": getRoles('Diablo'),
            "39": getRoles('Ascended'),
            "42": getRoles('Cherubium'),
            "45": getRoles('Seraphim'),
            "48": getRoles('Archangel'),
            "52": getRoles('Celestial'),
            "56": getRoles('Divine'),
            "60": getRoles('Heavenly Judge'),
            "64": getRoles('Celestial God'),
            "68": getRoles('Calamity Host'),
            "72": getRoles('Karma Killer'),
            "76": getRoles('Ruling Star'),
            "80": getRoles('Daybreaker'),
            "85": getRoles('Doombearer'),
            "100": getRoles('Overlord')

      };

          return {
            rank: ranks[(closestBelowLv(cap, lv)).toString()]
            } 

    };



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





    sql.get(`SELECT * from userdata WHERE userId ="${pUser.id}"`).then(async userdatarow => {
       let parsedData = parseInt(args[1]) + userdatarow.currentexp;

               var xpScalingCurves = curveMultiplyXP(parsedData, 0, 0, 150);
               var updatedLvl = xpScalingCurves.lvl;
               var updatedMaxExp = xpScalingCurves.b;
               var updatedNextCurExp = xpScalingCurves.c;
               var nextLvlExp = updatedMaxExp;
               // the transfer starts.


        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Newblood').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Novice').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Amateur').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Warrior').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Contender').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Duelist').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Tactician').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Commander').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Berserker').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Gladiator').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Champion').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Master').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Hero').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Legend').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Archfiend').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Hellhound').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Demon').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Diablo').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Ascended').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Cherubium').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Seraphim').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Archangel').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Celestial').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Divine').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Heavenly Judge').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Celestial God').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Calamity Host').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Karma Killer').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Ruling Star').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Daybreaker').id)
        message.guild.member(pUser.id).removeRole(message.guild.roles.find(r => r.name === 'Doombearer').id)


                sql.run(`UPDATE userdata SET currentexp = ${parsedData} WHERE userId = ${pUser.id}`)
                sql.run(`UPDATE userdata SET level = ${updatedLvl} WHERE userId = ${pUser.id}`)
                sql.run(`UPDATE userdata SET maxexp = ${nextLvlExp} WHERE userId = ${pUser.id}`)
                sql.run(`UPDATE userdata SET nextexpcurve = ${updatedNextCurExp} WHERE userId = ${pUser.id}`)

                const parsedLevelData = await ranksCheck(updatedLvl).rank;
                message.guild.member(pUser.id).addRole(parsedLevelData);


        addXpEmbed.setColor(palette.darkmatte)
        addXpEmbed.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            0% | *initializing,.*`)
        addXpEmbed2.setColor(palette.darkmatte)
        addXpEmbed2.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            25% | *retrieving data ..*\n
            ID: ${pUser.id}`)
        addXpEmbed3.setColor(palette.darkmatte)
        addXpEmbed3.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            50% | *retrieving data ..*\n
            ID: ${pUser.id}
            *estimating current_xp values. .*`)
        addXpEmbed4.setColor(palette.darkmatte)
        addXpEmbed4.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            75% | *processing ..*\n
            ID: ${pUser.id}
            *estimating current_xp values. .*
            *estimating max_level values. .*`)
        addXpEmbed5.setColor(palette.darkmatte)
        addXpEmbed5.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            90% | *processing ..*\n
            ID: ${pUser.id}
            *current_xp updated.*
            *estimating max_level values. .*`)
        addXpEmbed6.setColor(palette.darkmatte)
        addXpEmbed6.setDescription(`⚙ | Calculating your new xp and any possible new levels...\n
            99% | *finishing ..*\n
            ID: ${pUser.id}
            *current_xp updated.*
            *max_level updated.*`)

        let xpDigit = parsedData.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        addXpEmbed7.setColor(palette.lightgreen)
        addXpEmbed7.setThumbnail(mentionedUser.displayAvatarURL)
        addXpEmbed7.setDescription(`✅ | Data updated.`)
        addXpEmbed7.addField('Username', `${pUser.displayName}\n\`${pUser.id}\``)
        addXpEmbed7.addField('LVL', `${updatedLvl}`,true)
        addXpEmbed7.addField('XP', `${xpDigit}`,true)
        addXpEmbed7.setFooter(`Anime Artist United | Add XP on ${time}`, bicon)



    
        return message.channel.send(addXpEmbed).then((msg)=>
            msg.edit(addXpEmbed2)).then((msg)=>
            msg.edit(addXpEmbed3)).then((msg)=>
            msg.edit(addXpEmbed4)).then((msg)=>
            msg.edit(addXpEmbed5)).then((msg)=>
            msg.edit(addXpEmbed6)).then((msg)=>
            msg.edit(addXpEmbed7)).then((msg)=>
            console.log(`${message.author.username} has given ${args[1]} XP to ${mentionedUser.username}`))
        })
    }    
})

}



//  Frying pan's old xp system.
// Thankyou for this reference.
// <3
//
//
//

/*
    if (nxtLvl <= pUserXp + parseInt(args[1])  && curlvl <= 100 ) {
        curlvl++;
        addXpEmbed.setColor('#50e0de')
        addXpEmbed.setDescription("Calculating your new xp and any posible new levels...")
        addXpEmbed.setFooter(`Anime Artist United | Add XP`, bicon)

        message.channel.send(addXpEmbed);
        maxlvl = !maxlvl;
    }
    while (!maxlvl) {
        exponent = Math.pow(curlvl, 2)
        nxtLvl = 100 * exponent + 50 * curlvl + 100;
        if (nxtLvl <= pUserXp + parseInt(args[1]) && curlvl <= 100) {
            curlvl++;
            //message.channel.send(`Congratulation <@${message.author.id}>, you are now level ` + (curlvl))
            //maxlvl = !maxlvl;

        } else {
        addXpEmbed.setColor('#50e0de')
        addXpEmbed.setDescription(`Ok I'm done, your new Level is ${curlvl} and your new xp level is ${totalxp}.`)
        addXpEmbed.setFooter(`Anime Artist United | Add XP`, bicon)

            message.channel.send(addXpEmbed);
            maxlvl = true;
        }
    }
    */
    //end of new code  

    module.exports.help = {
        name:"addxp",
      aliases:[]
    }