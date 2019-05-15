const Discord = require('discord.js');
const palette = require('../colorset.json');
const config = require('../botconfig.json');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');


module.exports.run = async(bot,_command, message, args)=> {

/// leaderboard.js
///
///    LEADERBOARD COMMAND
///    changes log:
///    12/21/18 - Structure reworks & added event leaderboard.
///    11/12/18 - Interface reworks.
///    10/24/18 - Added AC ranking, structure & embed changes.
///    10/18/18(2) - Mention bug fix.
///    10/18/18 - New command.
///
///  -naphnaphz

const format = new formatManager(message);

return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? leaderboard()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)

    async function leaderboard() {
        let boardEmbed = new Discord.RichEmbed();
        let boardEmbed2 = new Discord.RichEmbed();

        const dbmanager = new databaseManager(message.author.id);
        const format = new formatManager(message);
        const authordata = await dbmanager.userdata;

        const ranking = {
            xpgroup: [],
            acgroup: [],
            repgroup: [],
            eventgroup: [],
            async pullingData() {
                for(let i = 0; i<10; i++) {
                    this.xpgroup.push({
                        id: await dbmanager.indexRanking('userdata', 'currentexp', i, 'userId'),
                        xp: await dbmanager.indexRanking('userdata', 'currentexp', i, 'currentexp'),
                        lv: await dbmanager.indexRanking('userdata', 'currentexp', i, 'level')
                    })
                    this.acgroup.push({
                        id: await dbmanager.indexRanking('userdata', 'artcoins',   i, 'userId'),
                        ac: await dbmanager.indexRanking('userdata', 'artcoins',   i, 'artcoins')
                    }),
                    this.repgroup.push({
                        id: await dbmanager.indexRanking('userdata', 'reputations',   i, 'userId'),
                        rep: await dbmanager.indexRanking('userdata', 'reputations',   i, 'reputations')
                    }),
                    this.eventgroup.push({
                        id: await dbmanager.indexRanking('usereventsdata', 'totalboxes', i, 'userId'),
                        box:await dbmanager.indexRanking('usereventsdata', 'totalboxes', i, 'totalboxes'),
                        cc: await dbmanager.indexRanking('usereventsdata', 'totalboxes', i, 'candycanes')
                    })
                }
            },
            async user() {
                await this.pullingData();
                return {
                    xpgroup: this.xpgroup,
                    acgroup: this.acgroup,
                    eventgroup: this.eventgroup,
                    repgroup: this.repgroup,
                    authorevent_data: await dbmanager.pullRowData('usereventsdata', message.author.id),
                    authorindex_ev: await dbmanager.authorIndexRanking('usereventsdata', 'totalboxes'),
                    authorindex_xp: await dbmanager.authorIndexRanking('userdata', 'currentexp'),
                    authorindex_ac: await dbmanager.authorIndexRanking('userdata', 'artcoins'),
                    authorindex_rep: await dbmanager.authorIndexRanking('userdata', 'reputations')
                }
            }
        }
        const user = await ranking.user();
            if(!args[0]) {
                        boardEmbed.setColor(palette.halloween)
                                .setDescription(`**${message.author.username}**, checkout our leaderboard! type \`${config.prefix}lb xp/ac/fame/event\`.`)
                                .setFooter(`AAU Leaderboard`, message.author.displayAvatarURL)
                        return message.channel.send(boardEmbed)
            }


            /**
             * 
             *      FAME LEADERBOARD
             *      
             */
            else if(args[0].includes('rep') || args[0].includes('fame')) {
                    const listingRank = () => {
                        const zerospace = '\u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b';
                        let temp = '';
                        let pos = 1;
                        for(let i = 0; i < 10; i++) {
                            temp += `[ **${pos}** ]- ${pos < 2 ? `👑` : ``}[${format.nickname(user.repgroup[i].id)}](https://discord.gg/Tjsck8F)
                            ${zerospace} ∟...... ☆ **${format.threeDigitsComa(user.repgroup[i].rep)}**\n\n` 
                            pos++
                        }
                        return temp;
                    }
                    boardEmbed.setColor(palette.darkmatte)
                            .setDescription(await listingRank())
                    boardEmbed2.setColor(palette.halloween)
                            .setDescription(`You are **${format.ordinalSuffix(user.authorindex_rep + 1)}** from a total of **${await dbmanager.userSize}** users. Your current reputation is : ☆ **${format.threeDigitsComa(authordata.reputations === null ? 0 : authordata.reputations)}**.`)
                            .setFooter(`${message.author.username} | Fame Leaderboard`, message.author.displayAvatarURL)

                        return message.channel.send(boardEmbed)
                                .then(() => message.channel.send(boardEmbed2))
            }


            /**
             * 
             *      ARTCOINS LEADERBOARD
             *      
             */
            else if(args[0].includes('ac')) {
                    let artcoinsemoji = bot.emojis.find((x) => x.name === "ArtCoins");
                    const listingRank = () => {
                        const zerospace = '\u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b';
                        let temp = '';
                        let pos = 1;
                        for(let i = 0; i < 10; i++) {
                            temp += `[ **${pos}** ]- ${pos < 2 ? `👑` : ``}[${format.nickname(user.acgroup[i].id)}](https://discord.gg/Tjsck8F)
                            ${zerospace} ∟...... ${artcoinsemoji} **${format.threeDigitsComa(user.acgroup[i].ac)}**\n\n` 
                            pos++
                        }
                        return temp;
                    }
                    boardEmbed.setColor(palette.darkmatte)
                            .setDescription(await listingRank())
                    boardEmbed2.setColor(palette.halloween)
                            .setDescription(`You are **${format.ordinalSuffix(user.authorindex_ac + 1)}** from a total of **${await dbmanager.userSize}** users. Your current AC is : ${artcoinsemoji} **${format.threeDigitsComa(authordata.artcoins)}**.`)
                            .setFooter(`${message.author.username} | Artcoins Leaderboard`, message.author.displayAvatarURL)

                        return message.channel.send(boardEmbed)
                                .then(() => message.channel.send(boardEmbed2))
            }


            /**
             * 
             *      XP LEADERBOARD
             *      
             */
            else if(args[0].includes('xp')) {
                    const listingRank = () => {
                        const zerospace = '\u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b';
                        let temp = '';
                        let pos = 1;
                        for(let i = 0; i < 10; i++) {
                            temp += `[ **${pos}** ]- ${pos < 2 ? `👑` : ``}[${format.nickname(user.xpgroup[i].id)}](https://discord.gg/Tjsck8F)
                            ${zerospace} ∟......  **LV ${user.xpgroup[i].lv}** | **${format.threeDigitsComa(user.xpgroup[i].xp)}**\n\n`
                            pos++
                        }
                        return temp;
                    }
                    boardEmbed.setColor(palette.darkmatte)
                            .setDescription(await listingRank())
                    boardEmbed2.setColor(palette.halloween)
                            .setDescription(`You are **${format.ordinalSuffix(user.authorindex_xp + 1)}** from a total of **${await dbmanager.userSize}** users. Your current xp is : **${format.threeDigitsComa(authordata.currentexp)}**.`)
                            .setFooter(`${message.author.username} | XP Leaderboard`, message.author.displayAvatarURL)
                        
                        return message.channel.send(boardEmbed)
                                .then(() => message.channel.send(boardEmbed2))
            }


            /**
             * 
             *      EVENT LEADERBOARD
             *      
             */
            else if(args[0].includes('event')) {
                const listingRank = () => {
                    let ccemoji = bot.emojis.find((x) => x.name === "candycane");
                    const zerospace = '\u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b \u200b';
                    let temp = '';
                    let pos = 1;
                    for(let i = 0; i < 10; i++) {
                        temp += `[ **${pos}** ]- [${format.nickname(user.eventgroup[i].id)}](https://discord.gg/Tjsck8F)
                        ${zerospace} ∟......  🎁 **Collected Boxes: ${user.eventgroup[i].box}** | ${ccemoji} **${format.threeDigitsComa(user.eventgroup[i].cc === null ? 0 : user.eventgroup[i].cc)}x**\n\n`
                        pos++
                    }
                    return temp;
                }
                boardEmbed.setColor(palette.darkmatte)
                        .setDescription(await listingRank())
                boardEmbed2.setColor(palette.halloween)
                        .setDescription(`You are **${format.ordinalSuffix(user.authorindex_ev + 1)}** from a total of **${await dbmanager.userSize}** users with total : 🎁 **${format.threeDigitsComa(user.authorevent_data.totalboxes === null ? 0 : user.authorevent_data.totalboxes)}** boxes.`)
                        .setFooter(`${message.author.username} | Christmas Event Leaderboard`, message.author.displayAvatarURL)
                    
                    return message.channel.send(boardEmbed)
                            .then(() => message.channel.send(boardEmbed2))
        }
    }
}
module.exports.help = {
    name:"lb",
        aliases:['leaderboard', 'rank', 'ranking']
}