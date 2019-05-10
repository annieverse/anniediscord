const Discord = require('discord.js');
const config = require('../botconfig.json');
const palette = require('../colorset.json');
const databaseManager = require('../utils/databaseManager');
const formatManager = require('../utils/formatManager');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message, args)=>{
/// buy.js
///
///     BUY COMMAND
///    changes log:
///     02/26/19 - Added ticket category.
///     12/31/18 - genItems.json merged into sql database.
///     12/02/18 - few arguments required to buy specific items, simplified structure.
///     10/19/18 - uppercased user's args, rolename key added in genItems.json.
///     09/17/18 - huge reworks in buy system. The changes will be followed by shop.js.
///     09/29/18 - added purchase option for role_items(items.json)
///

const format = new formatManager(message);
return ["bot", "bot-games", "cmds", "event-discussion", "roles-shop"].includes(message.channel.name) ? initBuy()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)

async function initBuy() {
    let embed1 = new Discord.RichEmbed();
    const collection = new databaseManager(message.author.id);
    const badgesdata = await collection.badges;
    const slotkey = collection.storingKey(badgesdata);
    const slotvalue = collection.storingValue(badgesdata);


    const pause = (ms) => {
        return new Promise(resolve => setTimeout(resolve,ms));
    }


    const shopEmbedWrapper = (desc, color=palette.darkmatte) => {
        embed1.setColor(color)
        embed1.setDescription(desc)
        return embed1;
    };

    const purchase = {
        getRoles(rolename, user) {
                return message.guild.members.get(user.id).addRole(message.guild.roles.find(n => n.name === rolename));
            },

        getInterface(skin, user) {
                sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`).then(async () => {
                    sql.run(`UPDATE userdata SET interfacemode ="${skin.toString()}" WHERE userId = ${user.id}`);
                })
            },

        getBadge(badgeid, user) {
                sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`).then(async () => {
                    sql.run(`UPDATE userbadges SET ${slotkey[slotvalue.indexOf(null)]} ="${badgeid}" WHERE userId = ${user.id}`);
                })
            },

        getBadgeContinous(src, user) {
                    let idx = parseInt(slotvalue.indexOf(null));
                    for(let i in src) {
                        sql.run(`UPDATE userbadges SET ${slotkey[idx + parseInt(i)]} ="${src[parseInt(i)]}" WHERE userId = ${user.id}`);
                    }
            },

        getCover(coverid, user) {
                sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`).then(async () => {
                    sql.run(`UPDATE userdata SET cover = "${coverid}" WHERE userId = ${user.id}`);
                })
            },

        getExpBooster(boostertype, user) {
                sql.run(`UPDATE usercheck SET expbooster = "${boostertype}" WHERE userId = ${user.id}`);
                sql.run(`UPDATE usercheck SET expbooster_duration = ${Date.now()} WHERE userId = ${user.id}`);
            },

        withdraw(price, user) {
                sql.get(`SELECT * FROM userdata WHERE userId =${user.id}`).then(async userdatarow => {
                    sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins - parseInt(price)} WHERE userId = ${user.id}`);
                })
            },

        withdrawEvent(price, user) {
                    sql.get(`SELECT * FROM usereventsdata WHERE userId =${user.id}`).then(async userdatarow => {
                        sql.run(`UPDATE usereventsdata SET candycanes = ${userdatarow.candycanes - parseInt(price)} WHERE userId = ${user.id}`);
                })
            }
        };    


    if(args[0]) {

        if(args[0].toUpperCase() === 'ROLE') {
            if(message.channel.id !== "464180867083010048")return message.channel.send(shopEmbedWrapper(`This command is only available in ${message.guild.channels.get('464180867083010048').toString()}. <:AnnieCry:542038556668067840>`))
            if(!args[1]) {
                return message.channel.send(shopEmbedWrapper(`**${message.author.username}**, please specify the role name.`));
            }

                try {
                    const targetItem = (message.content.substring(10)).toUpperCase();
                    const item = await collection.getItem(targetItem);

                        if(item.type === "Roles") {

                            sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                                if(userdatarow.artcoins < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Sorry! it seems you don't have enough artcoins. :(`, palette.red));
                                if(userdatarow.artcoins >= parseInt(item.price)) {
                                        purchase.getRoles(item.name, message.author);
                                        purchase.withdraw(item.price, message.author);

                                        return message.channel.send(shopEmbedWrapper(`Yay! **${message.author.username}** has bought the role **${item.name}!**`, palette.lightgreen));

                                }
                            })
                        }
                        /*
                        else {
                            return message.channel.send(shopEmbedWrapper(
                                `Try use **ticket**.`
                            ))
                            async function seasonalRoles() {
                                sql.get(`SELECT * FROM usereventsdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                                    if(userdatarow.candycanes < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Sorry! it seems you don't have enough candycanes. :(`, palette.red));
                                    if(userdatarow.candycanes >= parseInt(item.price)) {
                                        purchase.getRoles(item.name, message.author);
                                        purchase.withdrawEvent(item.price, message.author);

                                            return message.channel.send(shopEmbedWrapper(`Yay! **${message.author.username}** has bought the role **${item.name}!**`, palette.lightgreen));
                                    }
                                })
                            }
                        }
                        */
                }
                catch(e) {
                    console.log(e)
                    return message.channel.send(shopEmbedWrapper(`Sorry **${message.author.username}**, I couldn't find that item.`));
                }   
        }//end of role option


        if(args[0].toUpperCase() === 'TICKET') {

            if(!args[1]) {
                return message.channel.send(shopEmbedWrapper(`**${message.author.username}**, please specify the ticket name.`));
            }

                try {
                    const targetItem = (message.content.substring(12)).toUpperCase();
                    const item = await collection.getItem(targetItem);

                    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                        if(userdatarow.artcoins < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Sorry! it seems you don't have enough artcoins. :(`, palette.red));
                        if(userdatarow.artcoins >= parseInt(item.price)) {
                            if(item.name.startsWith(`EXP`)) {
                                purchase.getExpBooster(item.alias, message.author);
                                purchase.withdraw(item.price, message.author);
                                return message.channel.send(shopEmbedWrapper(`**${message.author.username}** has bought **${item.name}** Ticket! The effect will be automatically applied.`, palette.lightgreen));
                            }
                            else {
                                purchase.getRoles(item.name, message.author);
                                purchase.withdraw(item.price, message.author);
                                return message.channel.send(shopEmbedWrapper(`Yay! **${message.author.username}** has bought **${item.name}** Ticket!`, palette.lightgreen));
                            }
                        }
                    })
                }
                catch(e) {
                    console.log(e)
                    return message.channel.send(shopEmbedWrapper(`Sorry **${message.author.username}**, I couldn't find that item.`));
                }   
        }//end of ticket option


        else if(args[0].toUpperCase() === 'SKIN') {

            if(!args[1]) {
                return message.channel.send(shopEmbedWrapper(`**${message.author.username}**, please specify the skin name.`));
            }

            try {
                const targetItem = (message.content.substring(10)).toUpperCase();
                const item = await collection.getItem(targetItem)

                    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                        if(userdatarow.artcoins < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Sorry! it seems you don't have enough artcoins. :(`, palette.red));
                        if(userdatarow.artcoins >= parseInt(item.price)) {
                            purchase.getInterface(item.name, message.author);
                            purchase.withdraw(item.price, message.author);
                            return message.channel.send(shopEmbedWrapper(`Awesome! **${message.author.username}** has bought **${item.name} skin!**`, palette.lightgreen));
                        }
                    })
            }
            catch(e) {
                console.log(e)
                return message.channel.send(shopEmbedWrapper(`Sorry **${message.author.username}**, I couldn't find that item.`));
            }       
        }//end of skin option



        else if(args[0].toUpperCase() === 'BADGE') {

            if(!args[1]) {
                return message.channel.send(shopEmbedWrapper(`**${message.author.username}**, please specify the badge name.`));
            }
            try {
                const targetItem = (message.content.substring(11)).toUpperCase();
                const item = await collection.getItem(targetItem)

                    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                        if(slotvalue.indexOf(null) === -1)return message.channel.send(shopEmbedWrapper(`Sorry, you have reached the maximum badges limit. :(`, palette.red))
                        if(slotvalue.includes(item.alias))return message.channel.send(shopEmbedWrapper(`${message.author.username}, you already have ${item.name} badge.`, palette.red))
                        if(userdatarow.artcoins < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Aw! it seems you don't have enough artcoins. :(`, palette.red));
                        if(userdatarow.artcoins >= parseInt(item.price)) {
                            purchase.getBadge(item.alias, message.author);
                            purchase.withdraw(item.price, message.author);
                            return message.channel.send(shopEmbedWrapper(`Great! **${message.author.username}** has bought **${item.name}** badge!`, palette.lightgreen));
                        }
                    })
            }
            catch(e) {
                return message.channel.send(shopEmbedWrapper(`Sorry **${message.author.username}**, I couldn't find that item.`));
            }       
        }//end of badge option



        else if(args[0].toUpperCase() === 'COVER') {

            if(!args[1]) {
                return message.channel.send(shopEmbedWrapper(`**${message.author.username}**, please specify the cover id.`));
            }
            try {
                const targetItem = (message.content.substring(11)).toUpperCase();
                const item = await collection.getItem(targetItem);


                    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                        if(userdatarow.cover === item.alias)return message.channel.send(shopEmbedWrapper(`${message.author.username}, you are currently using that cover.`, palette.red))
                        if(userdatarow.artcoins < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Aw! it seems you don't have enough artcoins. :(`, palette.red));
                        if(userdatarow.artcoins >= parseInt(item.price)) {
                            purchase.getCover(item.alias, message.author);
                            purchase.withdraw(item.price, message.author);
                            return message.channel.send(shopEmbedWrapper(`Cool! **${message.author.username}** has bought new **${item.name}** cover!`, palette.lightgreen));
                        }   
                    })
            }
            catch(e) {
                console.log(e);
                return message.channel.send(shopEmbedWrapper(`Sorry **${message.author.username}**, I couldn't find that item.`));
            }       
        }//end of cover option



        else if(args[0].toUpperCase() === 'PACKAGE') { 
            return message.channel.send(shopEmbedWrapper(
                `I don't have any **packages** to sell at the moment.`
            ))
            async function processPackage() {
                if(!args[1]) {
                    return message.channel.send(shopEmbedWrapper(`**${message.author.username}**, please specify the package name.`));
                }
                try {


                    const targetItem = (message.content.substring(13)).toUpperCase();
                    const userevent = await collection.pullRowData('usereventsdata', message.author.id)
                    const item = await collection.pullPackage(targetItem)
                    const packageItems = await collection.packageAlias(item)


                        sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
                        if(slotvalue.indexOf(null) === -1 || slotvalue.indexOf(null) > 4)return message.channel.send(shopEmbedWrapper(`Sorry, you have reached the maximum badges limit. :(`, palette.red))
                        if(await collection.packageCrossCheck(targetItem, slotvalue))return message.channel.send(shopEmbedWrapper(`${message.author.username}, you already have **${item.name}** package badges.`, palette.red))   
                        if(userevent.candycanes < parseInt(item.price))return message.channel.send(shopEmbedWrapper(`Aw! it seems you don't have enough candycanes. :(`, palette.red));
                        if(userevent.candycanes >= parseInt(item.price)) {

                            return message.channel.send(shopEmbedWrapper(`Processing your transaction ..`, palette.darkmatte)).then(async msg => {

                                await purchase.getBadgeContinous(packageItems, message.author);
                                await pause(2000);
                                purchase.withdrawEvent(item.price, message.author);

                                msg.edit(shopEmbedWrapper(`Amazing! **${message.author.username}** has bought the **${item.name}** package!`, palette.lightgreen));
                            })
                        }
                        })
                }
                catch(e) {
                    console.log(e)
                    return message.channel.send(shopEmbedWrapper(`Sorry **${message.author.username}**, I couldn't find that item.`));
                }
            }       
        }//end of package option


        else if(!['ROLE', 'TICKET', 'SKIN', 'BADGE', 'COVER', 'PACKAGE'].includes(args[0].toUpperCase())) {
            return message.channel.send(shopEmbedWrapper(
                `Could you please specify the category? (ex: \`${config.prefix}buy\` \`ticket\` \`event participant\`)`));
        } 
    }
        else {
            return message.channel.send(shopEmbedWrapper(
                `Here's the correct usage: \`${config.prefix}buy\` \`<category>\` \`<itemname>\``));
        } 
    }
}
            
module.exports.help = {
    name:"buy",
        aliases:[]
}