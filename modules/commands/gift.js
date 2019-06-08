const Discord = require('discord.js');
const formatManager = require(`../../utils/formatManager`);
const sql = require(`sqlite`);
sql.open(`.data/database.sqlite`)


module.exports.run = async (bot, command, message, args, utils) => {



const format = new formatManager(message);
return [`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name) ? init_gift()
: format.embedWrapper(palette.darkmatte, `Unavailable access.`)

async function init_gift() {
    // Pre-defined messages.
    const log = async (props = {}, ...opt) => {
        props.code = !props.code ? "UNDEFINED" : props.code;
        props.icon = !props.icon ? "artcoins" : props.icon;

        const logtext = {
            "UNDEFINED": {
                color: palette.darkmatte,
                msg: "No available response."
            },

            "MISSING_TARGET_USER": {
                color: palette.darkmatte,
                msg: "Is that a ghost?"
            },

            "MISSING_ITEM_AMOUNT": {
                color: palette.darkmatte,
                msg: "Put the amount of the item."
            },
            
            "SHORT_GUIDE": {
                color: palette.crimson,
                msg: `Hey **${message.author.username}**, now you can give present to your crush!
                     Start by typing \`>gift <user>\` ${utils.emoji(`AnnieHype`,bot)}`
            },

            "LOCK_ACCESS": {
                color: palette.darkmatte,
                msg: `Feature is not available yet.`
            },

            "PROMPT_INVENTORY": {
                color: palette.golden,
                msg: `You currently owned :\n${opt[0]}\nPlease write \`<amount> <itemname>\` for **${opt[1]}**.`,
            },

            "INSUFFICIENT_ITEM": {
                color: palette.red,
                msg: `You don't have enough ${opt[0]}.`
            },

            "ITEM_NOT_AVAILABLE": {
                color: palette.red,
                msg: `Invalid item.`
            },

            "INCORRECT_FORMAT": {
                color: palette.red,
                msg: `Please write the correct format!`
            },

            "SELF-GIFTING": {
                color: palette.red,
                msg: `I know what you are doing there..`
            },

            "SUCCESSFUL": {
                color: palette.lightgreen,
                msg: `**${opt[0]}** has received ${utils.emoji(props.icon,bot)}**${opt[1]} ${opt[2]}(+${opt[3]} reps)**`
            }
        }
            const res = logtext[props.code];
            return format.embedWrapper(res.color, res.msg, false)
    }


   // Requesting user inventory data from sql API.
   let raw_object = {};
   function get_inventobject() {
       let user = message.author;
       return sql.get(`SELECT rose, chocolate_bar, chocolate_box, teddy_bear
                       FROM userinventories
                       WHERE userId = ${user.id}`)
           .then(async res => raw_object = res)
   }


   function eliminate_nulls() {
       for(let key in raw_object) {
           if(!raw_object[key]) {
               delete raw_object[key];
           }
       }
   }


   // Handles core transaction
   class Transaction {
        constructor(metadata) {
            this.metadata = metadata;
        }


        // Withdraw item after being sent to target.
        get withdraw() {
            return sql.run(`UPDATE userinventories 
                            SET "${this.metadata.item_to_send}" = (${this.metadata.item_to_send} - ${this.metadata.amount_to_send})
                            WHERE userId = ${message.author.id}`)
        }


        // Add new rep points based on received gift.
        get add_reps() {
            return sql.run(`UPDATE userdata
                            SET reputations = CASE WHEN reputations IS NULL
                            			THEN ${this.metadata.counted_reps}
                            		ELSE reputations + ${this.metadata.counted_reps}
                            	END
                            WHERE userId = ${this.metadata.target.id}`)
        }
   }


   //  Await for user confirmation before proceeding the transaction.
   const confirmation = async (metadata) => {

        // The rep points for each item
        const rep_size = {
            rose: 1,
            chocolate_bar: 1,
            chocolate_box: 3,
            teddy_bear: 5,
        }
     

        //  Calculate the points result
       const count = (item, amount) => {
            return rep_size[item] * amount; 
       }


        // Add underscore to be used as item alias.
        const denormalize = (string) => {
            string = string.replace(/\ /g, "_");
            return string;
        }
        

        const textified = (obj) => {
            let str = ``
            for(let key in obj.gifts) {
                str += `> ${utils.emoji(key.toString(),bot)}**${obj.gifts[key]}x ${key}**\n`
            }
            return str;
        }

        const collector = new Discord.MessageCollector(
            message.channel,
            m => m.author.id === message.author.id, {
                max: 1,
                time: 30000,
            });

        log({code: `PROMPT_INVENTORY`}, textified(metadata), metadata.target.name)
            .then(async prompt_msg => {
                collector.on(`collect`, async (msg) => {
                    let user_input = msg.content.toLowerCase();
        
                    metadata.amount_to_send = parseInt((msg.content).replace(/\D/g, ``));
                    metadata.item_to_send = `${denormalize(user_input).substring((metadata.amount_to_send.toString()).length + 1)}`;
                    metadata.counted_reps = count(metadata.item_to_send, metadata.amount_to_send);
        
                    //  Returns true if the quantity is sufficient.
                    const sufficient_item = metadata.amount_to_send <= metadata.gifts[metadata.item_to_send] ? true : false; 
        
        
                    //  Returns true if the item is not available.
                    const is_unavailable = metadata.gifts[metadata.item_to_send] === undefined ? true : false;

        
                    //  Returns true if user wrote the correct format.
                    const correct_format = metadata.amount_to_send && metadata.gifts[metadata.item_to_send] ? true : false;
                   
                    
                    
                    
                    // Transaction succesful
                    if(correct_format) {
        
                        prompt_msg.delete();
                        collector.stop();
        
                        const trans = new Transaction(metadata);
                        
                        trans.add_reps;
                        trans.withdraw;
        
                        log({code: `SUCCESSFUL`, icon: metadata.item_to_send},
                            metadata.target.name,
                            metadata.amount_to_send,
                            metadata.item_to_send,
                            count(metadata.item_to_send, metadata.amount_to_send)
                        )
                    }
        
                    // Transaction failed.
                    else {
                        prompt_msg.delete();
                        collector.stop();

                        if(is_unavailable) {
                            return log({code: `ITEM_NOT_AVAILABLE`});
                        }
                        
                        else if(!sufficient_item) {
                            return log({code: `INSUFFICIENT_ITEM`}, metadata.item_to_send);
                        }

                        else return log({code: `INCORRECT_FORMAT`});
                    }
                });                 
            }) 
    } 
   
    // Fetching
   const process = (target_user) => {
        return message.channel.send(`fetching inventory[gift] ..`)
        .then(async load => {

            //  Loading entries from userinventories
            await get_inventobject();
            eliminate_nulls()

            const metadata = {
                gifts: raw_object,
                target: {
                    id: target_user.id,
                    name: target_user.user.username,
                    tag: target_user.user.tag,
                }
            }

            confirmation(metadata)
            load.delete()
        })      
   }


   // Initialization
   const run = async () => {
        const target_user = await utils.userFinding(message, message.content.substring(command.length+2))
        
        // Locked feature. Only accessible to creators council.
        //if(!message.member.roles.find(r => r.name === 'Creators Council'))return log({code: `LOCK_ACCESS`})
        
      
        // No parameters given
        if(message.content.length <= command.length+1)return log({code: `SHORT_GUIDE`});
  

        // Invalid target
        if(!target_user)return log({code: `MISSING_TARGET_USER`});


        // Returns if user trying to gift themselves.
        if(target_user.id === message.author.id)return log({code: `SELF-GIFTING`});


        process(target_user);
   }

   run()

}


}
module.exports.help = {
    name: "gift",
    aliases: [],
    description: `gives an item from your inventory to a specified user`,
    usage: `>gift @user`,
    group: "General",
    public: true,
}