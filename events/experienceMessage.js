const Discord = require('discord.js');
const sql = require("sqlite");
sql.open(".data/database.sqlite");
const palette = require(`../colorset.json`);
const botconfig = require('../botconfig.json');
const ranksManager = require('../utils/ranksManager');
const formatManager = require('../utils/formatManager');


module.exports = (bot,message) => {

const nonXPChannel = ["485922866689474571", "464259865930629130", "464180867083010048", "459893209875611649", "463536514887057436"];
const artChannels =  ["459892609838481408", "459893040753016872", "460439050445258752", "461926519976230922", "460615254553001994", "538806382779170826"];
const format = new formatManager(message);


    if(message.content.startsWith(botconfig.prefix))return;
    if(message.author.bot)return;
    if(message.channel.type == "dm")return; 
    if(nonXPChannel.includes(message.channel.id))return;


experienceGains();


/*
    *   @experienceGains
    *   users will gain xp through general text channels.
*/
async function experienceGains() {

        function attachmentCheck() {
            try {
                return message.attachments.first().id ? true : null
            }
            catch(e) {
                return false
            }
        }



        async function expMultiplier(min, max) {
            let base = Math.floor(Math.random() * (max - min + 1)) + min;
            let booster = {
                "50%": {
                    "multiplier": 1.5 ,
                    "2h": 0.72e+7,
                    "24h": 8.64e+7
                },
                "100%": {
                    "multiplier": 2, 
                    "2h": 0.72e+7,
                    "24h": 8.64e+7
                }
            };

            const pause = (ms) => {
                return new Promise(resolve => setTimeout(resolve,ms));
            }


            function ticket() {
                sql.get(`SELECT expbooster, expbooster_duration FROM usercheck WHERE userId = ${message.author.id}`)
                    .then(async data => {
                        if(data.expbooster) {
                            let percentage = data.expbooster.replace(/ *\([^)]*\) */g, "");
                            let limitduration = booster[percentage][/\(([^)]+)\)/.exec(data.expbooster)[1]];

                            if ((data.expbooster_duration !== null) && limitduration - (Date.now() - data.expbooster_duration) > 0 ) {
                               return base = base * booster[percentage].multiplier;
                            }
                            else {
                                const embed = new Discord.RichEmbed()
                                            .setColor(palette.darkmatte)
                                            .setDescription(`Hello **${message.author.username}**, your **${data.expbooster}** has expired today.`)
                                            .setFooter(`System`, bot.user.avatarURL)

                                console.log(`${message.author.tag}'s item ${data.expbooster} has expired at ${Date.now()}`);
                                sql.run(`UPDATE usercheck SET expbooster = NULL, expbooster_duration = NULL WHERE userId = ${message.author.id}`);
                                return message.author.send(embed);
                            }
                        }
                    })
            }
            
            await ticket();
            await pause(500)
                return attachmentCheck() && artChannels.includes(message.channel.id) 
                        ? base * 10
                        : attachmentCheck() && (message.channel.id === "459892688016244738") 
                        ? base * 5
                        : base;
            }



        const manager = new ranksManager(bot, message);
        const randomexp = await expMultiplier(10, 15);
        const randomac = Math.ceil(Math.random() * 5);
        const cooldown = 60000;
        const lvlUpBonus = (lv) => lv === 0 ? 35 : 35 * lv;




        /**
          * Wrapped user experience mechanism.
          * @experienceMechanism.
          */
        const experienceMechanism = {

            /**
              * Few data were updated when user level up.
              * @levelup
              */
            get levelup() {
              sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                  sql.run(`UPDATE userdata SET currentexp = ${userdatarow.currentexp + randomexp} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE userdata SET maxexp = ${userdatarow.maxexp + userdatarow.nextexpcurve} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE userdata SET nextexpcurve = ${userdatarow.nextexpcurve + 200} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE userdata SET level = ${userdatarow.level + 1} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE userdata SET artcoins = ${randomac + userdatarow.artcoins + (lvlUpBonus(userdatarow.level + 1))} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE usercheck SET expcooldown = "True" WHERE userId = ${message.author.id}`);

                  format.embedWrapper(palette.halloween, `<:nanamiRinWave:459981823766691840> Congratulations ${message.author}!! You are now level **${userdatarow.level + 1}** !
                  **${lvlUpBonus(userdatarow.level + 1)}** AC has been added to your account.`);

                    message.guild.member(message.author.id).addRole(await manager.ranksCheck(userdatarow.level <= 0 ? 0 : userdatarow.level+1).rank);
                  !(manager.ranksCheck(userdatarow.level).lvlcap).includes(userdatarow.level+1) ? null : message.guild.member(message.author.id).removeRole(await manager.ranksCheck(userdatarow.level+1).prevrank);
                    console.log(`USER:${message.author.tag}, LV:${userdatarow.level+1}, CH:${message.channel.name}`);

                    setTimeout(function(){ 
                        sql.run(`UPDATE usercheck SET expcooldown = "False" WHERE userId = ${message.author.id}`);
                        }, (cooldown))                       
              })
            },  


            /**
              * Few experience points gained while the user still below the maxexp cap.
              * @grind
              */
            get grind() {
              sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                  sql.run(`UPDATE userdata SET currentexp = ${userdatarow.currentexp + randomexp} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE userdata SET artcoins = ${randomac + userdatarow.artcoins} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE usercheck SET expcooldown = "True" WHERE userId = ${message.author.id}`);
                  console.log(`USER:${message.author.tag}, XP_GAINED:${randomexp}, CH:${message.channel.name}`)

                  setTimeout(function(){  
                        sql.run(`UPDATE usercheck SET expcooldown = "False" WHERE userId = ${message.author.id}`);
                        }, (cooldown))
              })
            }
        };



          sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
          if (userdatarow) {
            
            sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`).then(async check => {
              if (check.expcooldown === "False") {
                  return randomexp + userdatarow.currentexp === userdatarow.maxexp 
                      || randomexp + userdatarow.currentexp > userdatarow.maxexp 
                       ? experienceMechanism.levelup : experienceMechanism.grind;
                                
              }
            })
          } else {
                console.log(`created new profile for ${message.author.tag}.`);
                  sql.run("INSERT INTO userdata (userId, currentexp, maxexp, nextexpcurve, level, artcoins, reputations, description, interfacemode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [message.author.id, randomexp, 100, 150, 0, 0, null, null, null]);
                  sql.run("INSERT INTO usercheck (userId, expcooldown) VALUES (?, ?)", [message.author.id, "False"]);
                  sql.run(`INSERT INTO userbadges (userId) VALUES (${message.author.id})`)
                  sql.run(`INSERT INTO userinventories (userId) VALUES (${message.author.id})`)
                  sql.run(`INSERT INTO usereventsdata (userId) VALUES (${message.author.id})`)  
                  message.guild.member(message.author.id).addRole(await manager.ranksCheck(0).rank);
            }
          })     

}; // END OF @EXPERIENCEGAINS
                                             

  
}