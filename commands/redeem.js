const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const userRecently = new Set();


exports.run = async (bot,command, message, args) => {

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

    /**
    	Lifesaver promise. Used pretty often when calling sql API.
    	@pause
    */
    function pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }



    /**
        Parsing emoji by its name.
        @emoji
    */
    function emoji(name) {
        return bot.emojis.find(e => e.name === name)
    }



    /**
        Redeeming functions.
        Core event of transaction.
        @redeem
    */
    async function redeem(amount = parseInt((message.content).replace(/\D/g, ``))) {

        const format = new formatManager(message);
        const user = message.author;
        const sql = require('sqlite');
        sql.open('.data/database.sqlite');
        let price = 120 * amount;




        //  Logging result from current transaction
        const log = (code) => {
            const logtext = {
                "000": {color: palette.red, msg: `Can't proceed. Insufficient balance.`},
                "001": {color: palette.darkmatte, msg: `Transaction cancelled.`},
                "002": {color: palette.lightgreen, msg:`Purchase successful. The item has been sent to your inventory.`},
                "003": {color: palette.darkmatte, msg: `You can purchase again in 10 seconds.`},
                "004": {color: palette.darkmatte, msg: `I'm selling Lucky Tickets! Wanna give a try? \`>redeem <amount>\`.`},
                "005": {color: palette.red, msg: `Please put the correct amount!`},
                "006": {color: palette.darkmatte, msg: `Put positive values.`}
            }
            return format.embedWrapper(logtext[code].color, logtext[code].msg);
        }




        //  Prompt message before proceeding the transaction
        const check_out = () => {
            return format.embedWrapper(palette.golden, `**${user.username}**, you're going to pay ${emoji(`artcoins`)}**${format.threeDigitsComa(price)}** for **${amount}** Lucky Tickets? \nplease type \`y\` to confirm your purchase. `)
        }



        //  User current balance. Returns an integer.
        const user_balance = () => {
            return sql.get(`SELECT artcoins FROM userdata WHERE userId = ${user.id}`)
                .then(async data => data.artcoins)
        }



        //  Check if user has sufficient balance. Returns boolean.
        const sufficient_balance = () => {
            return sql.get(`SELECT artcoins FROM userinventories WHERE userId = ${user.id}`)
                .then(async data => data.artcoins >= price ? true : false)
        }




        //  Backend processes. Storing items and substracting user's credit.
        const transaction = () => {
            sql.run(`UPDATE userinventories SET artcoins = artcoins - ${price} WHERE userId = ${user.id}`);
            sql.run(`UPDATE userinventories SET lucky_ticket = (CASE WHEN lucky_ticket IS NULL THEN ${amount} ELSE (lucky_ticket + ${amount}) END) WHERE userId = ${user.id}`);
            console.log(`${user.tag} has bought ${amount} Lucky Tickets.`)
        }




        //  Check if user still in coolingdown state. Returns boolean.
        const still_coolingdown = () => {
            return userRecently.has(user.id) ? true : false;
        }




        //  Put 10 seconds interval per transaction.
        const coolingdown = () => {
            userRecently.add(user.id);
            setTimeout(() => {
                userRecently.delete(user.id);
            }, 10000)
        }




        //  Listening to user's confirmation
        const confirmation = async () => {
            const sufficient_bal = await sufficient_balance();
            const collector = new Discord.MessageCollector(message.channel,
            m => m.author.id === message.author.id, {
                max: 1,
                time: 30000,
            });

            collector.on(`collect`, async (msg) => {
                let user_input = msg.content.toLowerCase();


                // Transaction successful.
                if(user_input === `y` && sufficient_bal) {
                    msg.delete();
                    collector.stop();
                    transaction();
                    coolingdown();

                    return log(`002`);
                }

                // Transaction failed.
                else {
                    msg.delete();
                    collector.stop();

                    if(user_input !== `y`)return log(`001`);
                    if(!sufficient_bal)return log(`000`);
                }
            });    
        }




        //  Wrapped function for all-balance option.
        const all_bal_transaction = async () => {
            const user_bal = await user_balance();
            amount = Math.floor(user_bal / 120);
            price = 120 * amount;

            if(!price)return log(`000`);

            check_out();
            confirmation();           
        }




        /** 
            Core function. 
            Runs all processes above.
            @run
        */
        const run = () => {


            //  Locked feature
            //if(!message.member.roles.find(r => r.name === 'Creators Council'))
            
            if(![`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name))return format.embedWrapper(palette.darkmatte, `Please redeem in bot channels.`);

            //  Return log if the amount is not defined.
            if(!args[0])return log(`004`)


            //  Return log if user still in cooldown state.
            if(still_coolingdown())return log(`003`)


            //  Proceed transaction with all the available balance.
            if(args[0].includes(`all`))return all_bal_transaction();


            //  Return log if the amount is not-a-number.
            if(Number.isNaN(parseInt(args[0])))return log(`005`)


           	if(parseInt(args[0]) < 0)return log(`006`)


            amount = parseInt((message.content).replace(/\D/g, ``));

            check_out();
            confirmation();
        }

        run();

    }

    return redeem();
	
}
exports.help = {
  name: "redeem",
        aliases:[]
}