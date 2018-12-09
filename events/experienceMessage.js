const Discord = require('discord.js');
const sql = require("sqlite");
sql.open(".data/database.sqlite");
const palette = require(`../colorset.json`);
const botconfig = require('../botconfig.json');
const ranksManager = require('../utils/ranksManager');
const formatManager = require('../utils/formatManager');


module.exports = (bot,message) => {

const nonXPChannel = ["bot", "bot-games", "music", "pokemon"];
const format = new formatManager();


    if(message.content.startsWith(botconfig.prefix))return;
    if(message.author.bot)return;
    if(message.channel.type == "dm")return; 
    if(nonXPChannel.includes(message.channel.name))return;


/*
    *   @experienceGains
    *   users will gain xp through general text channels.
*/
async function experienceGains() {

        const manager = new ranksManager(bot, message);
        const randomexp = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
        const randomac = Math.ceil(Math.random() * 5);
        const cooldown = 30000;
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

                  format.embedWrapper(message, palette.halloween, `<:nanamiRinWave:459981823766691840> Congratulations ${message.author}!! You are now level **${userdatarow.level + 1}** !
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
                  sql.run("INSERT INTO usercheck (userId, expcooldown, repcooldown, transjson_perms, lastSecretBox, lastDaily) VALUES (?, ?, ?, ?, ?, ?)", [message.author.id, "False", 0, "False", null, null]);
                  message.guild.member(message.author.id).addRole(await manager.ranksCheck(0).rank);
            }
          })     

}; // END OF @EXPERIENCEGAINS

                                             
                

experienceGains();


/*
    *   Logging message data
    *   that gathered throughout the guild.
*/
sql.get(`SELECT * FROM messagelog`).then(async => {
    sql.run(`INSERT INTO messagelog (timestamp, user_id, channel_id, username, channel, content) VALUES (?, ?, ?, ?, ?, ?)`,
        [Date.now(), message.author.id, message.channel.id, message.author.username, message.channel.name, message.content])
})

  
}