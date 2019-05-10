const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');
const sql = require('sqlite');
sql.open('.data/database.sqlite');

module.exports.run = async(bot,_command,message)=>{

/**
 * 
 *      prototype simple opening box.
 *      more things will be added.
 * 
 *      -naphnaphz
 */
const format = new formatManager(message)
return ["bot", "bot-games"].includes(message.channel.name) ? openingBox() 
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


    async function openingBox() {
        const dbmanager = new databaseManager(message.author.id);
        const data = await dbmanager.pullRowData('usereventsdata', message.author.id)
        const ccmoji = '<:candycane:522793336042422277>';
        const user = message.author.username;


            if(data.collectedboxes === null || data.collectedboxes === 0) {
                return format.embedWrapper(palette.darkmatte,
                `**${message.author.username}**, you don't have any boxes.`)
            }
            
            else {
                message.delete(2000)
                const pause = (ms) => {
                    return new Promise(resolve => setTimeout(resolve,ms));
                }
                
                const rate = () => {
                    let res = Math.floor(Math.random() * (99 - 1 + 1)) + 1;
                    console.log(`${user} opened box with ${res}% rate`)
                        return res < 3 ? 50 : res < 7 ? 25 : res < 19 ? 10 : res < 31 ? 7 : Math.round(Math.random() * 5);
                }

                let randomizedcc = await rate();
                sql.get(`SELECT * FROM usereventsdata WHERE userId ="${message.author.id}"`)
                .then(async currentdata => {
                    sql.run(`UPDATE usereventsdata SET candycanes = ${currentdata.candycanes + randomizedcc} WHERE userId = ${message.author.id}`)
                    sql.run(`UPDATE usereventsdata SET collectedboxes = ${currentdata.collectedboxes - 1} WHERE userId = ${message.author.id}`)
                    sql.run(`UPDATE usereventsdata SET box_drawcount = ${currentdata.box_drawcount + 1} WHERE userId = ${message.author.id}`)
                })
                
                return format.embedWrapper(palette.darkmatte,
                    '*Opening* 🎁 ..')
                        .then(async msg => {
                            await pause(2000);
                            msg.edit(format.baseEmbedWrapper(
                                randomizedcc === 50 ? palette.purple 
                                : randomizedcc === 25 ? palette.golden
                                : randomizedcc === 10 || randomizedcc === 7 ? palette.darkblue
                                : palette.darkmatte,
                                randomizedcc === 50 
                                ? `**${user}** got a specially super rare item! [<:candycane:522793336042422277> **${randomizedcc}x**]` 
                                : randomizedcc === 25 
                                ? `**${user}** got a super rare item! [<:candycane:522793336042422277> **${randomizedcc}x**]`
                                : randomizedcc === 10 || randomizedcc === 7
                                ? `**${user}** got a rare item! [<:candycane:522793336042422277> **${randomizedcc}x**]`
                                : randomizedcc === 0 
                                ? `**${user}** got pile of dust ..`
                                : `**${user}** got a common item. [<:candycane:522793336042422277> **${randomizedcc}x**]`))

                            randomizedcc === 50 ? message.guild.channels.get('459891664182312982')
                                .send(`Congratulation ${message.author}! they just pulling up ${ccmoji} **${randomizedcc}x** from the christmas box! :tada:`) : null;
                        })
            }
    }
}

module.exports.help = {
    name:"openbox",
    aliases:[]
}