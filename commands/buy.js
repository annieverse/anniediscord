const Discord = require('discord.js');
const palette = require('../colorset.json');
const databaseManager = require('../utils/databaseManager');
const formatManager = require('../utils/formatManager');
const profileManager = require('../utils/profileManager');

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
return ["sandbox"].includes(message.channel.name) ? initBuy()
: format.embedWrapper(palette.darkmatte, `Unavailable access.`)

async function initBuy() {
    const profile_utils = new profileManager();
    const collection = new databaseManager(message.author.id);
    const badgesdata = await collection.badges;
    const slotkey = collection.storingKey(badgesdata);
    const slotvalue = collection.storingValue(badgesdata);
    const categories = ['ROLE', 'TICKET', 'SKIN', 'BADGE', 'COVER', 'PACKAGE'];
    const user_data = await collection.userdata;
    /**
        Parsing emoji by its name.
        @emoji
    */
    function emoji(name) {
        return bot.emojis.find(e => e.name === name)
    }



    const log = async (props = {}, ...opt) => {
            props.code = !props.code ? `NULL_CODE` : props.code;
            props.emoticon = !props.emoticon ? `artcoins` : props.emoticon;
            props.image = !props.image ? null : props.image;

            console.log(props);

            const load_asset = async () => {
                let buffer = await profile_utils.getAsset(props.image);
                return buffer;
            }

            const logtext = {
                "NULL_CODE": {
                    color: palette.darkmatte,
                    msg: `No available response.`,
                },

                "000": {
                    color: palette.red,
                    msg: `Can't proceed insufficient balance.`,
                },

                "001": {
                    color: palette.darkmatte,
                    msg: `Transaction cancelled.`,
                },

                "003": {
                    color: palette.darkmatte,
                    msg: `You can purchase again in 10 seconds.`,
                },

                "CONFIRMATION": {
                    color: palette.golden,
                    msg: `**${message.author.username}**, you're going to pay ${emoji(props.emoticon)}**${opt[0]}** for **${opt[1]}** cover.\nPlease type \`y\` to confirm your purchase.`,
                },

                "ERR_DUPLICATE": {
                    color: palette.red,
                    msg: `You are currently using that item.`,
                },

                "ERR_INSUFFICIENT_BAL": {
                    color: palette.red,
                    msg: `Aw! it seems you don't have enough ${opt[0]}. :(`,
                },

                "SUCCESS_N" : {
                    color: palette.lightgreen,
                    msg: `Yay! **${message.author.username}** has bought **${opt[0]}**!`,
                },

                "SUCCESS_E" : {
                    color: palette.lightgreen,
                    msg: `Amazing! **${message.author.username}** has bought **${opt[0]}**!\n I hope you are happy with it!`,
                },

                "MISSING_COVERNAME" : {
                    color: palette.darkmatte,
                    msg: `**${message.author.username}**, please specify the cover name.`,
                },

                "ERR_UNKNOWN_ITEM" : {
                    color: palette.darkmatte,
                    msg: `Sorry **${message.author.username}**, I couldn't find that item.`,
                },

                "TYPE_OUTOFRANGE" : {
                    color: palette.darkmatte,
                    msg: `Could you please specify the category? (ex: \`>buy\` \`ticket\` \`event participant\`)`,
                },

                "TUTORIAL": {
                    color: palette.darkmatte,
                    msg: `Here's the correct usage: \`>buy\` \`<category>\` \`<itemname>\``,
                },
            }

            const res = logtext[props.code];
            return format.embedWrapper(res.color, res.msg, props.image ? await load_asset() : null);
    }



    const pause = (ms) => {
        return new Promise(resolve => setTimeout(resolve,ms));
    }


    /*
    const shopEmbedWrapper = (desc, color=palette.darkmatte) => {
        embed1.setColor(color)
        embed1.setDescription(desc)
        return embed1;
    };
    */


    class transaction {
      constructor(itemname, type) {
        this.itemname = itemname;
        this.type = type;
      } 
        


        Roles(alias) {
            return message.guild.members.get(message.author.id).addRole(message.guild.roles.find(n => n.name === alias));
        }

        Skins(alias) {
          sql.run(`UPDATE userdata 
                  SET interfacemode ="${alias}" 
                  WHERE userId = ${message.author.id}`);
        }

        Covers(alias) {
          sql.run(`UPDATE userdata 
                  SET cover = "${alias}"
                  WHERE userId = ${message.author.id}`);
        }

        Badges(alias) {
            sql.run(`UPDATE userbadges 
                    SET ${slotkey[slotvalue.indexOf(null)]} = "${alias}" 
                    WHERE userId = ${message.author.id}`);
        }

        multiple_badges(src, user) {
                    let idx = parseInt(slotvalue.indexOf(null));
                    for(let i in src) {
                      sql.run(`UPDATE userbadges 
                               SET ${slotkey[idx + parseInt(i)]} ="${src[parseInt(i)]}" 
                               WHERE userId = ${user.id}`);
                    }
        }

        getExpBooster(boostertype, user) {
                sql.run(`UPDATE usercheck SET expbooster = "${boostertype}" WHERE userId = ${user.id}`);
                sql.run(`UPDATE usercheck SET expbooster_duration = ${Date.now()} WHERE userId = ${user.id}`);
            }


        
        withdraw(price, currency) {
                sql.run(`UPDATE userinventories 
                         SET ${currency} = ${currency} - ${parseInt(price)} 
                         WHERE userId = ${message.author.id}`);
        }

        withdrawEvent(price, user) {
                    sql.get(`SELECT * FROM usereventsdata WHERE userId =${user.id}`).then(async userdatarow => {
                        sql.run(`UPDATE usereventsdata SET candycanes = ${userdatarow.candycanes - parseInt(price)} WHERE userId = ${user.id}`);
                })
            }
        


        // Returns key-value
        lookfor(src) {
            for(let i in src) { 
                if(src[i][`upper(name)`] === this.itemname.toUpperCase()) {
                    return src[i]
                }
            }
        }


      
        // Returns an object of target item.
        get request_query() {
            return sql.all(`SELECT name, upper(name), alias, type, price, price_type, desc, status, rarity 
              FROM itemlist WHERE status = "sell" AND type = "${this.type}"`)
                .then(rootgroup => this.lookfor(rootgroup))
        }


        // Get item obj.
        get pull() {
            return this.request_query;
        }
    }

    //  Await for user confirmation before proceeding the transaction.
    const confirmation = async (metadata, proc) => {

            const sufficient_balance = () => {
                return user_data.artcoins >= metadata.price ? true : false;
            }

            const sufficient_bal = await sufficient_balance();
            const collector = new Discord.MessageCollector(message.channel,
            m => m.author.id === message.author.id, {
                max: 1,
                time: 30000,
            });

                log({code:`CONFIRMATION`, image: metadata.alias, emoticon: metadata.price_type}, metadata.price, metadata.name);   


                collector.on(`collect`, async (msg) => {
                    let user_input = msg.content.toLowerCase();


                    // Transaction successful.
                    if(user_input === `y` && sufficient_balance()) {
                        msg.delete();
                        collector.stop();

                        proc[metadata.type](metadata.alias);
                        proc.withdraw(metadata.price, metadata.price_type);

                        log({code: `SUCCESS_E`}, metadata.name);
                    }

                    // Transaction failed.
                    else {
                        msg.delete();
                        collector.stop();
                        if(user_input !== `y`)return log({code: `001`});
                        if(!sufficient_bal)return log({code: `000`});
                    }
                });    
        } 



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




        //  Applied new purchase system. Cover
        else if(args[0].toUpperCase() === 'COVER') {

            if(!args[1])return log({code:`MISSING_COVERNAME`})
            const target = message.content.substring(12);
            const trans = new transaction(target, `Covers`);
            const item = await trans.pull;

            sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`)
                .then(async metadata_user => {
                    sql.get(`SELECT * FROM userinventories WHERE userId = "${message.author.id}"`)
                        .then(async metadata_inventory => {
                            try {

                                //  Reject duplicate alias.
                                if(metadata_user.cover === item.alias)return log({code: `ERR_DUPLICATE`});

                                //  Insufficient balance.
                                if(metadata_inventory[item.price_type] < parseInt(item.price))return log({code: `ERR_INSUFFICIENT_BAL`}, item.price_type)
                                
                                // Balance has met the condition.
                                if(metadata_inventory[item.price_type] >= parseInt(item.price)) {
                                    confirmation(item, trans);
                                }

                            }
                    catch(e) {
                        console.log(e)
                        return log({code:`ERR_UNKNOWN_ITEM`});
                    }
                })   
            })
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


        //argument is not listed as valid category
        else if(!categories.includes(args[0].toUpperCase())) return log(`TYPE_OUTOFRANGE`); 
    }

        //no arguments givenn
        else return log(`TUTORIAL`);

    }
}
            
module.exports.help = {
    name:">buy",
        aliases:[]
}