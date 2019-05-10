const ms = require('parse-ms');
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');

module.exports.run = async(bot,command,message, args)=>{

    /// dailyjs
    ///
    ///  daily command
    ///    change logs:
    ///		  01/23/19 - Consecutive daily multiplier added.
    ///       12/24/18 - Restrict channel.
    ///       11/12/18 - Original colorset.
    ///       10/18/18 - halloween colorset
    ///       10/12/18 - Minor embed changes.
    ///       09/17/18 - Frying Pan's daily system.
    ///       09/18/18 - reworked embed.
    ///
    ///     -naphnaphz
    ///     -Frying Pan

let dbg_md = args[0];    

const format = new formatManager(message)
return ["bot", "games", "cmds"].includes(message.channel.name) ? dailies() 
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)

    async function dailies() {
	        const sql = require("sqlite");
	        let cooldown = 8.64e+7;
	        let streakcooldown = 25.92e+7;
	        let amount = 250;
	        let acmoji = '<:ArtCoins:467184620107202560>';
	        let user = message.author.username;


	        sql.open(".data/database.sqlite");
	        sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`).then(async usercheckrow => {
	        if (usercheckrow) {

	                if ((usercheckrow.lastdaily !== null) && cooldown - (dbg_md - usercheckrow.lastdaily) > 0 ) {
	                	console.log(usercheckrow);
	                    let timeObj = ms(cooldown - (dbg_md - usercheckrow.lastdaily));
	                    return format.embedWrapper(
	                        palette.red,
	                        `Hey **${user}**, your next claim will be available in`)
	                        	.then(async msg => {
	                            	msg.channel.send(`**${timeObj.hours} h** : **${timeObj.minutes} m** : **${timeObj.seconds} s**`)
	                       		})
	                }
	                else {
	                	let isItStreaking = ms(streakcooldown - (dbg_md - usercheckrow.lastdaily)).days >= 1 ? true : false;
	                	let countStreak = usercheckrow.totaldailystreak === null ? 1 : isItStreaking ? usercheckrow.totaldailystreak + 1 : 0
	                	let bonus = countStreak !== 0 ? 12 * countStreak : 0;

	                	sql.run(`UPDATE usercheck SET totaldailystreak = "${countStreak}" WHERE userId = ${message.author.id}`);
	                    sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`)
	                        .then(async userdatarow => {

			                    sql.run(`UPDATE userdata SET artcoins = "${amount + userdatarow.artcoins + bonus}" WHERE userId = ${message.author.id}`);
			                    sql.run(`UPDATE usercheck SET lastdaily = "${Date.now()}" WHERE userId = ${message.author.id}`);
			                    return format.embedWrapper(
			                       	palette.halloween,
			                        `**${user}** has received ${acmoji}**${amount}${isItStreaking ? `(+${bonus})` : `\u200b`}** artcoins! ${isItStreaking ? `\n***${countStreak}** days of consecutive claims.*` : `!\u200b`}`
	                          	)
	                        })
	         		}
	         }
	        else {
	             return format.embedWrapper(
	                palette.darkmatte,
	                `Sorry **${user}**! your profile data is missing. Could you please wait for few minutes?`
	            )
	        }
	    })
	}
}
module.exports.help={
    name:"xz",
        aliases:[]
}