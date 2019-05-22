const Discord = require("discord.js");
const palette = require('../colorset.json');
const ranksManager = require(`../utils/ranksManager`);
const databaseManager = require('../utils/databaseManager');
const formatManager = require('../utils/formatManager');

const sql = require("sqlite");
sql.open('.data/database.sqlite');

module.exports.run = async(bot,command, message,args)=> {

    /// convertartcoin.js
    ///
    ///  Convert Coins Command 
    ///    change logs:
    ///       01/03/19 - Major fix
    ///       11/02/18 - bug fix.
    ///       09/17/18 - Major updates. Using Pan's xp curve as reference.
    ///       09/18/18 - Nerfed xp gained from cartcoins. (newXp / 2 = args + curXp)
    ///
    ///     -naphnaphz

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? converting()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


    async function converting() {
            

        /**
         *  @curveMultiplyXP
         * 
         *  @param x: current exp
         *  @param lvl: level
         *  @param b: max exp of current cap
         *  @param c: curve between current lvl and above
         * 
         */
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


        

        const user = message.author.username;
        const ranks = new ranksManager(bot, message);
        const format = new formatManager(message)
        const collection = new databaseManager(message.author.id);
        const data = await collection.userdata;



        const evaluateRanks = async (curlv, newlv) => {


            /**
             *  @evaluateRanks
             * 
             *  @param curlv: current level before converting.
             *  @param newlv: new level after converting.
             * 
             */
            let cap = await ranks.ranksCheck(curlv).lvlcap;
            let newRanks = await ranks.ranksCheck(newlv).rank;
            let oldRanks = await (cap.includes(curlv) ? ranks.ranksCheck(curlv).currentrank : ranks.ranksCheck(curlv).prevrank);

                if(curlv < newlv && newRanks !== oldRanks) {
                    message.guild.member(message.author.id).addRole(newRanks);
                    message.guild.member(message.author.id).removeRole(oldRanks);
                        console.log(`New rank : ${updatedLvl} ${newRanks.name}`)
                        console.log(`Rank to be removed : ${curlv} ${oldRanks.name}`)
                }
                else {
                    return;
                }
        }   

            //  Pulling user artcoins from their inventory.
            const pull_ac = () => {
                return sql.get(`SELECT artcoins FROM userinventories WHERE userId = "${message.author.id}"`);
            }

            const user_ac = await pull_ac();

            if(!args[0])return format.embedWrapper(palette.darkmatte, `Here's the correct usage to use the coins converter : \n\`>cartcoins\` \`<value>/all\``);
            
            // this line.
            if((user_ac < parseInt(args[0])) || (user_ac === 0))return format.embedWrapper(palette.red, `${user}, It seems you don't have enough art coins. :(`);
            
            
            if(args[0] <= 1)return format.embedWrapper(palette.darkmatte, `Please put higher value! >.<`)

            if(args[0].includes('all')) {

                let parsedXpData = Math.floor((parseInt(user_ac) / 2)) + data.currentexp;
                var xpScalingCurves = curveMultiplyXP(parsedXpData, 0, 0, 150);
                var updatedLvl = xpScalingCurves.lvl;
                var updatedMaxExp = xpScalingCurves.b;
                var updatedNextCurExp = xpScalingCurves.c;
                var nextLvlExp = updatedMaxExp;
                
                sql.run(`UPDATE userdata SET currentexp = ${parsedXpData} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userdata SET level = ${updatedLvl} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userdata SET maxexp = ${nextLvlExp} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userdata SET nextexpcurve = ${updatedNextCurExp} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userinventories SET artcoins = 0 WHERE userId = ${message.author.id}`)
                
                await evaluateRanks(data.level, updatedLvl);

                    const dataembed = new Discord.RichEmbed()
                    .setColor(palette.darkmatte)
                    .setThumbnail(message.author.displayAvatarURL)
                    .addField('LV', `**${updatedLvl}**`,true)
                    .addField('EXP', `**${format.threeDigitsComa(parsedXpData)} / ${format.threeDigitsComa(nextLvlExp)}**`,true)
        
                    console.log(`${message.author.tag} has converted ${args[0]} ART_COINS to XP.`)
                    return message.channel.send(format.embedBase(palette.darkmatte, '*Processing ..*'))
                       .then(async msg => {
                           msg.edit(dataembed)
                           format.embedWrapper(palette.halloween, `✅ | **${user}**, you've gained **${format.threeDigitsComa(Math.floor(parseInt(user_ac) / 2))}** exp!`)
                       })
            }



            else if ((args[0] !== 'all') && (user_ac >= args[0])) {
                if(isNaN(args[0]))return format.embedWrapper(palette.darkmatte, `Write the proper value please.. :(`)

                let inputValue = parseInt(args[0]) / 2;  
                let parsedXpData = Math.floor(inputValue) + data.currentexp;
                var xpScalingCurves = curveMultiplyXP(parsedXpData, 0, 0, 150);
                var updatedLvl = xpScalingCurves.lvl;
                var updatedMaxExp = xpScalingCurves.b;
                var updatedNextCurExp = xpScalingCurves.c;
                var nextLvlExp = updatedMaxExp;

                sql.run(`UPDATE userdata SET currentexp = ${parsedXpData} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userdata SET level = ${updatedLvl} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userdata SET maxexp = ${nextLvlExp} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userdata SET nextexpcurve = ${updatedNextCurExp} WHERE userId = ${message.author.id}`)
                sql.run(`UPDATE userinventories SET artcoins = artcoins - ${parseInt(args[0])} WHERE userId = ${message.author.id}`)

                await evaluateRanks(data.level, updatedLvl);
                    
                            const dataembed = new Discord.RichEmbed()
                            .setColor(palette.darkmatte)
                            .setThumbnail(message.author.displayAvatarURL)
                            .addField('LV', `**${updatedLvl}**`,true)
                            .addField('EXP', `**${format.threeDigitsComa(parsedXpData)} / ${format.threeDigitsComa(nextLvlExp)}**`,true)
                    
                                console.log(`${message.author.tag} has converted ${args[0]} ART_COINS to XP.`)
                                return message.channel.send(format.embedBase(palette.darkmatte, '*Processing ..*'))
                                   .then(async msg => {
                                       msg.edit(dataembed)
                                       format.embedWrapper(palette.halloween, `✅ | **${user}**, you've gained **${format.threeDigitsComa(Math.floor(inputValue))}** exp!`)
                                   })
                              
        }
    }
}
module.exports.help = {
    name:"cartcoins",
        aliases:["convertac", "acconvert", "cartcoin"]
}