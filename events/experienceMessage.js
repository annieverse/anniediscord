const Discord = require('discord.js');
const sql = require("sqlite");
const palette = require(`../colorset.json`);
const ranksManager = require('../utils/ranksManager');
const formatManager = require('../utils/formatManager');
let cards = require(`../utils/cards-metadata.json`);


module.exports = (bot,message) => {

const nonXPChannel = [
 "485922866689474571",
 "464259865930629130",
 "464180867083010048",
 "459893209875611649",
 "463536514887057436",
 "459891664182312982",
 "459938699606491147"];
const artChannels =  [
    "459892609838481408",
    "459893040753016872",
    "460439050445258752",
    "461926519976230922",
    "460615254553001994",
    "538806382779170826"];
const format = new formatManager(message);


    if(message.content.startsWith(`>`))return;
    if(message.author.bot)return;
    if(message.channel.type == "dm")return; 
    if(nonXPChannel.includes(message.channel.id))return;
    if(message.author.username !== `naphnaphz`)return;


experienceGains();


/*
    *   @experienceGains
    *   users will gain xp through general text channels.
*/
async function experienceGains() {
        sql.open(".data/database.sqlite");

        // Centralized data object.
        let metadata = {
            user: {
                id: message.author.id,
                name: message.author.username,
                tag: message.author.tag,
            },
            channel: message.channel.id,
            exp: {
                base: Math.round(Math.random() * (15 - 10 + 1)) + 10,
                bonus: 1,
                get gained() {
                    return Math.round(this.base * this.bonus)
                }
            },
            ac: {
                base: Math.ceil(Math.random() * 5),
                bonus: 1,
                get gained() {
                    return Math.round(this.base * this.bonus)
               }
            },
        }

        
        // Returns true if message has an attachment
        const attachment_check = () => {
            try {
                return message.attachments.first().id ? true : null
            }
            catch(e) {
                return false
            }
        }


        // Time promise
        const pause = (ms) => {
            return new Promise(resolve => setTimeout(resolve,ms));
        }


        //  Calculates exp and artcoins multiplier.
        const modifier = async () => {

            //  Randomize integer range between min and max.
            //let base = Math.floor(Math.random() * (max - min + 1)) + min;
            //let base_ac = Math.ceil(Math.random() * ac_max);

            // Apply booster ticket if theres any.
            const ticket = () => {
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
                sql.get(`SELECT expbooster, expbooster_duration FROM usercheck WHERE userId = ${message.author.id}`)
                    .then(async data => {
                        if(data.expbooster) {

                            metadata.has_booster = true;
                            let percentage = data.expbooster.replace(/ *\([^)]*\) */g, "");
                            let limitduration = booster[percentage][/\(([^)]+)\)/.exec(data.expbooster)[1]];

                            if ((data.expbooster_duration !== null) && limitduration - (Date.now() - data.expbooster_duration) > 0 ) {
                                metadata.exp.bonus += booster[percentage].multiplier;
                            }
                            else {
                                const embed = new Discord.RichEmbed()
                                            .setColor(palette.darkmatte)
                                            .setDescription(`Hello **${metadata.user.name}**, your **${data.expbooster}** ticket has expired today.`)
                                            .setFooter(`System`, bot.user.avatarURL)

                                console.log(`${metadata.user.tag}'s item ${data.expbooster} ticket has expired at ${Date.now()}`);
                                sql.run(`UPDATE usercheck SET expbooster = NULL, expbooster_duration = NULL WHERE userId = ${message.author.id}`);
                                return message.author.send(embed);
                            }
                        }
                        else {
                            metadata.has_booster = false;
                        }
                    })
            }


            //  Huge exp boost for art-activity.
            const artistic_buffs = () => {
                if(attachment_check() && artChannels.includes(message.channel.id)) {
                    return metadata.exp.bonus += 10
                }
                else if(attachment_check() && (message.channel.id === "459892688016244738")) {
                    return metadata.exp.bonus += 5
                }
            }


            // Apply council's card perks if theres any.
            const council_perks = async () => {

                
                // Request user's collection data.
                const cards_collection = () => {
                    return sql.get(`SELECT * FROM collections WHERE userId = ${message.author.id}`)
                        .then(async data => data);
                }


                const card_stacks = await cards_collection();


                //  Return new user collections if false.
                const data_availability = () => {
                    try {
                        delete card_stacks.userId;
                        metadata.collections = card_stacks;
                    }
                    catch(e) {
                        sql.run(`INSERT INTO collections(userId) VALUES(${message.author.id})`);
                    }
                }


                // Returns true if user has no cards
                const empty_bag = () => {
                    for(let key in card_stacks) {
                        if(card_stacks[key])return false
                    }
                    return true;
                }


                // Remove unneccesary properties.
                const eliminate_nulls = () => {
                    for(let key in card_stacks) {
                        if (!card_stacks[key]) delete card_stacks[key];
                    }
                }


                // Filtering cards
                const get_metadata = () => {
                    let arr = [];


                    class requirements {

                        constructor(carddata) {
                            this.data = carddata;
                        }

                        //  Returns true if the message should has attachment. 
                        get attachment_required() {
                            return this.data.skills.main.effect.attachment_only ? true : false;
                        }

                   
                        //  Returns true if the card is active-typing exp booster.
                        get exp_multiplier_type() {
                            const booster_type = [`exp_booster`, `exp_ac_booster`];
                            return booster_type.includes(this.data.skills.main.type) 
                                && this.data.skills.main.effect.status === `active`
                                ? true : false;
                        }


                        //  Returns true if channel is the correct card's activation channel.
                        get true_channel() {
                            return this.data.skills.main.channel.includes(metadata.channel) ? true : false;
                        }


                        // Conditional check
                        get met_condition() {

                            //  exp_booster in right channel with an attachment?
                            if(this.attachment_required && this.exp_multiplier_type && this.true_channel) {
                                return attachment_check();
                            }

                            //  exp_booster in right channel?
                            else if (this.exp_multiplier_type && this.true_channel){
                                return true;
                            }

                            //  No conditions have met.
                            else return false;
                        }

                    }

                    for (let key in card_stacks) {
                        const req = new requirements(cards[key])
                        if(req.met_condition) {
                            arr.push(cards[key])
                        }
                    }

                    return arr;

                }


                // Register collection if missing.
                data_availability();
                
                //  Returns if bag has no cards.
                if(empty_bag())return;
                eliminate_nulls();


                // Loop over and active the card's skills.
                const activation = () => {
                    let filtered_card_stack = get_metadata();
                    if(filtered_card_stack.length < 1)return;
                    
                    metadata.active_buffs = true;
                    
                    for (let key in filtered_card_stack) {
                        const data = filtered_card_stack[key];
                        const skill_data = data.skills.main.effect;

                        if(skill_data.exp) metadata.exp.bonus += skill_data.exp;
                        if(skill_data.ac) metadata.ac.bonus += skill_data.ac; 

                        metadata.buffs = data;
                    }
        
                    //metadata.exp.gained = Math.round(base * metadata.exp_bonus);
                    //metadata.ac.gained = Math.round(base_ac * metadata.ac_bonus);

                    //base = metadata.gained_exp;
                    //base_ac = metadata.gained_ac;
                }

                activation();
                
            }
            
            await ticket();
            await artistic_buffs();
            await council_perks();


            return {
                exp: metadata.exp.gained,
                ac: metadata.ac.gained
            }
        }


        // Naph's custom passive-buff.
        const white_cat_paradise = async () => {

            // Retrieve user who had naph_card in their collection.
            const followers = () => {
                return sql.all(`SELECT userId 
                                FROM collections 
                                WHERE naph_card > 0 
                                AND userId != "230034968515051520"`)
                    .then(async data => data);
            }

            let group = await followers();
            let exp_amount = cards.naph_card.skills.main.effect.exp;

            
            //  Get user tag.
            const get_name = (id) => bot.users.get(id).tag; 


            //  Update experience point.
            const share_exp = () => {
                for(let id in group) {
                    console.log(`${get_name(group[id].userId)} receiving shared ${exp_amount} xp from the appearance of white cat.`)
                    sql.run(`UPDATE userdata
                             SET currentexp = currentexp + ${exp_amount}
                             WHERE userId = ${group[id].userId}`)
                }
            }

            share_exp();
            await pause(500)
        }


        const res = await modifier();
        const randomexp = res.exp
        const randomac = res.ac
        const cooldown = 60000;
        const lvlUpBonus = (lv) => lv === 0 ? 35 : 35 * lv;
        const manager = new ranksManager(bot, message);


        /**
          * Wrapped user experience mechanism.
          * @experienceMechanism.
          */
        const experienceMechanism = {
            
            
            //  Few data are updated when user leveling up.
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


            // Few experience points gained while the user still below the maxexp cap.
            get grind() {

             if((metadata.user.name === `naphnaphz` )
             && (metadata.channel === cards.naph_card.skills.main.channel)) white_cat_paradise();

              sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                  sql.run(`UPDATE userdata SET currentexp = ${userdatarow.currentexp + randomexp} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE userdata SET artcoins = ${randomac + userdatarow.artcoins} WHERE userId = ${message.author.id}`);
                  sql.run(`UPDATE usercheck SET expcooldown = "True" WHERE userId = ${message.author.id}`);
                  console.log(`USER:${metadata.user.name}, XP_GAINED:${metadata.exp.gained}, AC_GAINED:${metadata.ac.gained}, CH:${message.channel.name}`)

                  setTimeout(function(){  
                        sql.run(`UPDATE usercheck SET expcooldown = "False" WHERE userId = ${message.author.id}`);
                        }, (cooldown))
              })
            }
        };


        // Initialization.
        const run = async () => {
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
        }   


        run();

}; // END OF @EXPERIENCEGAINS
                                             

  
}