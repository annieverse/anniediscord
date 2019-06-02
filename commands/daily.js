const ms = require('parse-ms');
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const cards = require('../utils/cards-metadata.json');
const sql = require("sqlite");

module.exports.run = async (bot, command, message, args, utils) => {

    /// dailyjs
    ///
    ///  daily command
	///    change logs:
  ///         05/17/19 - Fixed dailies streak bug.
	///		      05/13/19 - Added dreamer desire.
    ///		    01/23/19 - Consecutive daily multiplier added.
    ///       12/24/18 - Restrict channel.
    ///       11/12/18 - Original colorset.
    ///       10/18/18 - halloween colorset
    ///       10/12/18 - Minor embed changes.
    ///       09/17/18 - Frying Pan's daily system.
    ///       09/18/18 - reworked embed.
    ///
    ///     -naphnaphz
    ///     -Frying Pan
    ///     -Fwubbles
   
const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;


const format = new formatManager(message)
return [`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name) ? dailies() 
: format.embedWrapper(palette.darkmatte, `Unavailable access.`)

    async function dailies() {

		sql.open(".data/database.sqlite");

        // Request user's collection data.
        const cards_collection = () => {
            return sql.get(`SELECT poppy_card FROM collections WHERE userId = ${message.author.id}`)
                .then(async data => data);
        }
        
	    let cooldown = 8.64e+7;
	    let streakcooldown = 25.92e+7;
	    let amount = 250;
	    let user = message.author.username;
			const has_poppy = Object.values(await cards_collection());
      

        sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`)
            .then(async usercheckrow => {
	            if (usercheckrow) {
					      if ((usercheckrow.lastdaily !== null) && cooldown - (Date.now() - usercheckrow.lastdaily) > 0 ) {
	                    let timeObj = ms(cooldown - (Date.now() - usercheckrow.lastdaily));
	                    return format.embedWrapper(
	                        palette.red,
	                        `Hey **${user}**, your next dailies will be available in`)
	                        	.then(async msg => {
	                            	msg.channel.send(`**${timeObj.hours} h** : **${timeObj.minutes} m** : **${timeObj.seconds} s**`)
	                       		})
					}
	                else {
                  
                    let skill = cards.poppy_card.skills.main;
                    let has_poppy_check = has_poppy[0] > 0 ? true : false;
                    let isItStreaking = has_poppy_check ? true : ms(streakcooldown - (Date.now() - usercheckrow.lastdaily)).days >= 1 ? true : false;
                    let countStreak = usercheckrow.totaldailystreak < 1 ? 1 : isItStreaking ? usercheckrow.totaldailystreak + 1 : 0
                    let bonus = countStreak !== 0 ? 12 * countStreak : 0;


	                	sql.run(`UPDATE usercheck SET totaldailystreak = ${countStreak}, lastdaily = "${Date.now()}" WHERE userId = ${message.author.id}`);
			                sql.run(`UPDATE userinventories SET artcoins = artcoins + ${amount + bonus} WHERE userId = ${message.author.id}`);
			                    return format.embedWrapper(
			                       	has_poppy_check ? palette.purple : palette.halloween,
                                    `**${user}** has received ${utils.emoji(`artcoins`,bot)}**${amount}${isItStreaking ? `(+${bonus})` : `\u200b`}** artcoins! ${isItStreaking ? `
                                    **${countStreak} days of consecutive claims. ${has_poppy_check ? `${skill.name} Effect.` : ``}**` : `!\u200b`}`
	                          	)
					 }
				}
	       		else {
	             return format.embedWrapper(
	                palette.darkmatte,
	                `Sorry **${user}**! your profile data is missing. I'll send this`
	            )
	        }
	    })
	}
}
module.exports.help={
    name:"daily",
        aliases:["dly", "daili", "dail", "dayly", "attendance", "dliy"]
}