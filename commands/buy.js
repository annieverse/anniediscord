const Discord = require('discord.js');
const palette = require('../colorset.json');
const databaseManager = require('../utils/databaseManager');
const formatManager = require('../utils/formatManager');
const profileManager = require('../utils/profileManager');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message, args)=>{
/// buy.js

///     BUY COMMAND
///    changes log:
///     05/08/19 - Improved initBuy structure
///              - Transaction class
///              - Simplified sql syntax without losing its readability
///              - Stored pre-defined texts
///              - New transaction workflow
///              - Major refactor

///     02/26/19 - Added ticket category.
///     12/31/18 - genItems.json merged into sql database.
///     12/02/18 - few arguments required to buy specific items, simplified structure.
///     10/19/18 - uppercased user's args, rolename key added in genItems.json.
///     09/17/18 - huge reworks in buy system. The changes will be followed by shop.js.
///     09/29/18 - added purchase option for role_items(items.json)

const env = require('../.data/environment.json');
if(env.dev && !env.administrator_id.includes(message.author.id))return;

    const format = new formatManager(message);
    return [`sandbox`, `bot`, `gacha-house`, `games`, `roles-shop`].includes(message.channel.name) ? initBuy()
    : format.embedWrapper(palette.darkmatte, `Unavailable access.`)

    async function initBuy() {
        const profile_utils = new profileManager();
        const collection = new databaseManager(message.author.id);

        // Badges-related variables
        const badgesdata = await collection.badges;
        const slotkey = collection.storingKey(badgesdata);
        const slotvalue = collection.storingValue(badgesdata);
        

        // Time promise
        const pause = (ms) => {
            return new Promise(resolve => setTimeout(resolve,ms));
        }


        // Parsing emoji by its name.
        const emoji = (name) => {
            return bot.emojis.find(e => e.name === name)
        }


        // Pre-defined messages
        const log = async (props = {}, ...opt) => {

                // Props object
                props.code = !props.code ? `NULL_CODE` : props.code;
                props.emoticon = !props.emoticon ? `artcoins` : props.emoticon;
                props.render_image = !props.render_image ? false : true;
                props.image = !props.render_image ? null : props.image;


                // Loading asset from disk
                const load_asset = async () => {
                    let buffer = await profile_utils.getAsset(props.image);
                    return buffer;
                }


                //  Texts collection
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
                        msg: `**${message.author.username}**, you're going to pay ${emoji(props.emoticon)}**${format.threeDigitsComa(opt[0])}** for **${opt[1]}** ${opt[2]}.\nPlease type \`y\` to confirm your purchase.`,
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

                    "MISSING_SKINNAME" : {
                        color: palette.darkmatte,
                        msg: `**${message.author.username}**, please specify the skin name!`,
                    },

                    "MISSING_BADGENAME" : {
                        color: palette.darkmatte,
                        msg: `**${message.author.username}**, please specify the badge name. :0`,
                    },

                    "MISSING_TICKETNAME" : {
                        color: palette.darkmatte,
                        msg: `**${message.author.username}**, don't forget to specify the ticket name. ;)`,
                    },

                    "MISSING_ROLENAME" : {
                        color: palette.darkmatte,
                        msg: `**${message.author.username}**, please specify the role name.`,
                    },

                    "MAX_BADGE_LIMIT": {
                        color: palette.red,
                        msg: `Sorry, you have reached the maximum badges limit. :(`,
                    },

                    "EXPBOOSTER_APPLIED": {
                        color: palette.lightgreen,
                        msg: `**${message.author.username}** has bought **${opt[0]}** ticket! The effect will be automatically applied.`
                    },

                    "ERR_UNKNOWN_ITEM" : {
                        color: palette.darkmatte,
                        msg: `Sorry **${message.author.username}**, I couldn't find that item.`,
                    },

                    "TYPE_OUTOFRANGE" : {
                        color: palette.darkmatte,
                        msg: `I can't find any item in the given category!`,
                    },

                    "TUTORIAL": {
                        color: palette.darkmatte,
                        msg: `Here's the correct usage: \`>buy\` \`<category>\` \`<itemname>\``,
                    },
                }

                const res = logtext[props.code];
                return format.embedWrapper(res.color, res.msg, props.image ? await load_asset() : null);
        }

        
        // Supporting transaction workflow. Initialized on each different category.
        class transaction {


        constructor(itemname, type) {
            this.itemname = itemname;
            this.type = type;
            } 
            

            // Adding role
            Roles(data) {
                return message.guild.members.get(message.author.id).addRole(message.guild.roles.find(n => n.name === data.name));
            }


            // Updating profile interface
            Skins(data) {
            sql.run(`UPDATE userdata 
                    SET interfacemode ="${data.alias}" 
                    WHERE userId = ${message.author.id}`);
            }


            //  Updating cover alias.
            Covers(data) {
            sql.run(`UPDATE userdata 
                    SET cover = "${data.alias}"
                    WHERE userId = ${message.author.id}`);
            }


            // Updating badges column
            Badges(data) {
                sql.run(`UPDATE userbadges 
                        SET ${slotkey[slotvalue.indexOf(null)]} = "${data.alias}" 
                        WHERE userId = ${message.author.id}`);
            }

            // Applying EXP booster.
            Exp_booster(data) {
                sql.run(`UPDATE usercheck 
                        SET expbooster = "${data.alias}",
                            expbooster_duration = ${Date.now()}
                        WHERE userId = ${message.author.id}`);
            }


            // Parsing ticket-model item
            Tickets(data) {
                return this[data.unique_type](data)
            }


            // Updating multiple badges.
            multiple_badges(src, user) {
                        let idx = parseInt(slotvalue.indexOf(null));
                        for(let i in src) {
                        sql.run(`UPDATE userbadges 
                                SET ${slotkey[idx + parseInt(i)]} ="${src[parseInt(i)]}" 
                                WHERE userId = ${user.id}`);
                        }
            }



            //  Withdrawing the balance
            withdraw(price, currency) {
                    sql.run(`UPDATE userinventories 
                            SET ${currency} = ${currency} - ${parseInt(price)} 
                            WHERE userId = ${message.author.id}`);
            }


            //  Withdrawing event's currency. Deprecated.
            withdrawEvent(price, user) {
                sql.run(`UPDATE usereventsdata 
                        SET candycanes = candycanes - ${parseInt(price)} 
                        WHERE userId = ${user.id}`);
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
                return sql.all(`SELECT name, upper(name), alias, type, unique_type, price, price_type, desc, status, rarity 
                                FROM itemlist 
                                WHERE status = "sell" 
                                AND type = "${this.type}"`)
                    .then(rootgroup => this.lookfor(rootgroup))
            }


            // Get item obj.
            get pull() {
                return this.request_query;
            }
        }


        //  Await for user confirmation before proceeding the transaction.
        const confirmation = async (metadata, proc, show_image = false) => {
                const user_data = await collection.userdata;


                // Check if the user's balance is sufficient.
                const sufficient_balance = () => {
                    return user_data.artcoins >= metadata.price ? true : false;
                }


                // Lowercase first letter and de-plural string.
                const normalize = (string) => {
                    string = string.charAt(0).toLowerCase()+ string.slice(1);
                    string = string.slice(0, -1);
                    return string;
                }


                const sufficient_bal = await sufficient_balance();
                const collector = new Discord.MessageCollector(message.channel,
                m => m.author.id === message.author.id, {
                    max: 1,
                    time: 30000,
                });

                log({
                    code:`CONFIRMATION`,
                    image: metadata.alias, 
                    emoticon: metadata.price_type,
                    render_image: show_image,
                    },
                    metadata.price, metadata.name, normalize(metadata.type)
                );   


                collector.on(`collect`, async (msg) => {
                    let user_input = msg.content.toLowerCase();


                    // Transaction successful.
                    if(user_input === `y` && sufficient_balance()) {
                        msg.delete();
                        collector.stop();

                        proc[metadata.type](metadata);
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


        // Initialize module.
        const run = async () => {
            const categories = ['ROLE', 'TICKET', 'SKIN', 'BADGE', 'COVER', 'PACKAGE'];
            if(args[0]) {
                let key = args[0].toUpperCase();

                // Purchase role
                if(key === categories[0]) {

                    if(!args[1])return log({code:`MISSING_ROLENAME`})
                    const target = message.content.substring(10);
                    const trans = new transaction(target, `Roles`);
                    const item = await trans.pull;

                        try {
                            sql.get(`SELECT * FROM userinventories WHERE userId = "${message.author.id}"`)
                                .then(async metadata_inventory => {

                                // Reject insufficent balance
                                if(metadata_inventory.artcoins < parseInt(item.price))return log({code: `ERR_INSUFFICIENT_BAL`}, item.price_type)
                              
                                // Balance has met the condition
                                if(metadata_inventory.artcoins >= parseInt(item.price)) {
                                    confirmation(item, trans)
                                }
                            })
                        }
                        catch(e) {
                            return log({code: `ERR_UNKNOWN_ITEM`})
                        }   
                }


                // Purchase ticket
                else if(key === categories[1]) {

                    if(!args[1])return log({code:`MISSING_TICKETNAME`})
                    const target = message.content.substring(12);
                    const trans = new transaction(target, `Tickets`);
                    const item = await trans.pull;

                        try {
                            sql.get(`SELECT * FROM userinventories WHERE userId = "${message.author.id}"`)
                                .then(async metadata_inventory => {
                                    
                                    //  Insufficient balance
                                    if(metadata_inventory.artcoins < parseInt(item.price))return log({code: `ERR_INSUFFICIENT_BAL`}, item.price_type)
                                    
                                    //  Balance has met the condition
                                    if(metadata_inventory.artcoins >= parseInt(item.price)) {
                                        confirmation(item, trans);
                                    }
                            })
                        }
                        catch(e) {
                            return log({code: `ERR_UNKNOWN_ITEM`})
                        }   
                }


                // Purchase skin
                else if(key === categories[2]) {

                    if(!args[1])return log({code:`MISSING_SKINNAME`})
                    const target = message.content.substring(10);
                    const trans = new transaction(target, `Skins`);
                    const item = await trans.pull;


                    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`)
                        .then(async metadata_user => {
                            sql.get(`SELECT * FROM userinventories WHERE userId = "${message.author.id}"`)
                                .then(async metadata_inventory => {
                                    try {
                                        //  Reject duplicate alias.
                                        if(metadata_user.interfacemode === item.alias)return log({code: `ERR_DUPLICATE`});

                                        //  Insufficient balance.
                                        if(metadata_inventory[item.price_type] < parseInt(item.price))return log({code: `ERR_INSUFFICIENT_BAL`}, item.price_type)
                                        
                                        // Balance has met the condition.
                                        if(metadata_inventory[item.price_type] >= parseInt(item.price)) {
                                            confirmation(item, trans);
                                        }
                                    }
                                    catch(e) {
                                        return log({code: `ERR_UNKNOWN_ITEM`})
                                    }   
                                })
                        })    
                }


                //  Purchase badge
                else if(key === categories[3]) {

                    if(!args[1])return log({code:`MISSING_BADGENAME`})
                    const target = message.content.substring(11);
                    const trans = new transaction(target, `Badges`);
                    const item = await trans.pull;

                    try {
                        sql.get(`SELECT * FROM userinventories WHERE userId = "${message.author.id}"`)
                            .then(async metadata_inventory => {
                            
                            //  No available slots left
                            if(slotvalue.indexOf(null) === -1)return log({code: `MAX_BADGE_LIMIT`})

                            //  Reject duplicate alias
                            if(slotvalue.includes(item.alias))return log({code: `ERR_DUPLICATE`})

                            //  Insufficient balance
                            if(metadata_inventory.artcoins < parseInt(item.price))return log({code: `ERR_INSUFFICIENT_BAL`})
                            
                            // Balance has met the condition
                            if(metadata_inventory.artcoins >= parseInt(item.price)) {
                                confirmation(item, trans, true)
                            }
                        })
                    }
                    catch(e) {
                        return log({code: `ERR_UNKNOWN_ITEM`})
                    }       
                }


                // Purchase cover
                else if(key === categories[4]) {

                    if(!args[1])return log({code:`MISSING_COVERNAME`})
                    const target = message.content.substring(11);
                    const trans = new transaction(target, `Covers`);
                    const item = await trans.pull;

                    console.log(item);

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
                                            confirmation(item, trans, true);
                                        }

                                    }
                            catch(e) {
                                console.log(e)
                                return log({code:`ERR_UNKNOWN_ITEM`});
                            }
                        })   
                    })
                }


                // Purchase package
                else if(key === categories[5]) { 
                    return message.channel.send(shopEmbedWrapper(
                        `I don't have any **packages** to sell at the moment.`
                    ))
                }

                //argument is not listed as valid category
                else return log({code: `TYPE_OUTOFRANGE`}); 
            }
            //no arguments given
            else return log({code: `TUTORIAL`});
            
        }

        run()
    }
}
            
module.exports.help = {
    name:"buy",
        aliases:[]
}