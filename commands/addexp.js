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
const env = require('../.data/environment.json');
if(env.dev && !env.administrator_id.includes(message.author.id))return;

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

  if(!message.member.roles.find(r => (r.name === 'Grand Master') 
                                  || (r.name === 'Tomato Fox'))) return message.channel.send(addXpEmbed);

sql.get(`SELECT * FROM userdata WHERE userId ="${pUser.id}"`).then(async userdatarow => {


    if(!args[1]){
        addXpEmbed.setColor('#d30000')
        addXpEmbed.setDescription(`Please put the number.`)
        addXpEmbed.setFooter(`Anime Artist United | Add XP`, bicon)
        return message.channel.send(addXpEmbed);
    }

    else {

 function getRoles(r) {
      return bot.guilds.get(message.guild.id).roles.find(n => n.name === r)
  }


 function ranksCheck(lv) {

  /**
    * Level gap between ranks
    * @cap
    */ 
      const cap = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 85, 100];

  /**
    * Filtering nearest below given value of an array.
    * @array, @val
    */ 
      const closestBelowLv = (array, val) => {
        return Math.max.apply(null,array.filter(function(v)
          { return v <= val }))
      };
    
  /**
    * Filtering below given value of an array.
    * @array, @val
    */ 
      const previousLvl = (array, val) => {
        return Math.max.apply(null,array.filter(function(v)
          { return v < val }))
      };


  /**
    * Collection of available ranks.
    * @ranks
    */
      let ranks = {

            "0": getRoles('Pencilician'),
            "5": getRoles('Crayola Knight'),
            "10": getRoles('Crayomancer'),
            "15": getRoles('Brush Wizard'),
            "20": getRoles('Sketch Summoner'),
            "25": getRoles('Legendary Doodler'),
            "30": getRoles('Artifice Master'),
            "35": getRoles('Hellbound Painter'),
            "40": getRoles('Pastel Paladin'),
            "45": getRoles('Color Elementalist'),
            "50": getRoles('Copic Crusader'),
            "60": getRoles('Earthwork Alchemist'),
            "70": getRoles('Canvas Conqueror'),
            "85": getRoles('Fame Dweller'),
            "100": getRoles('The Creator')

      };

        return {
            title: ranks[(closestBelowLv(cap, lv)).toString()].name,
            rank: ranks[(closestBelowLv(cap, lv)).toString()],
            prevrank: ranks[(previousLvl(cap, lv)).toString()],
            closestBelowLevel: closestBelowLv(cap, lv),
            currentrank: ranks[lv.toString()],
            nexttorank: (lv-previousLvl(cap, lv)),
            lvlcap: cap,
            color: (ranks[(closestBelowLv(cap, lv)).toString()].hexColor).toString()
            
            } 

    }



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



                sql.run(`UPDATE userdata SET currentexp = ${parsedData} WHERE userId = ${pUser.id}`)
                sql.run(`UPDATE userdata SET level = ${updatedLvl} WHERE userId = ${pUser.id}`)
                sql.run(`UPDATE userdata SET maxexp = ${nextLvlExp} WHERE userId = ${pUser.id}`)
                sql.run(`UPDATE userdata SET nextexpcurve = ${updatedNextCurExp} WHERE userId = ${pUser.id}`)

                const parsedLevelData = await ranksCheck(updatedLvl).rank;
                const caplevels = ranksCheck(updatedLvl).lvlcap;
                const rolesCollection = pUser.roles.map(r => r.name);
                const previousDuplicateRanks = (ranksCheck(updatedLvl).lvlcap).filter(val => val < updatedLvl);
                

                 async function eliminateRoles() {
                    let idpool = [];
                    for(let i in previousDuplicateRanks) {
                        idpool.push( ((ranksCheck(previousDuplicateRanks[i]).rank).id).toString() )
                    }
                    console.log(idpool);
                        message.guild.member(pUser.id).removeRoles(idpool)
                 }

                (updatedLvl - userdatarow.level) >= 5 || (ranksCheck(updatedLvl).closestBelowLevel !== ranksCheck(userdatarow.level).closestBelowLevel) || userdatarow.level >= 5 ? await eliminateRoles() : null;
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