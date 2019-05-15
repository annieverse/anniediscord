const Discord = require("discord.js");
const moment = require(`moment`);
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager.js');
const userFinding = require('../utils/userFinding');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot,command, message,args)=>{


const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? initPay()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)



async function initPay() {

    function randomString(length, chars) { 
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
    }

    function template(content, color = palette.darkmatte) {
    	let embed = new Discord.RichEmbed()
    		.setColor(color)
    		.setDescription(content)
    		.setFooter(`AAU Bank`, bot.user.displayAvatarURL)

    		return message.channel.send(embed);
    }

    function getUserDataLvl(user) {
        return sql.get(`SELECT * FROM userdata WHERE userId ="${user.id}"`)
            .then(data => data.level);
    }

    const userLvl = await getUserDataLvl(message.member);
    if(userLvl<6)return message.channel.send("I'm sorry, your level isn't high enough to use this feature.")
   	if(!args[0]) return template(`**${message.author.username}**, here's how to use pay command :\n\`>pay\`  \`user\`  \`value\``)

    sql.get(`SELECT * FROM userdata WHERE userId = "${message.author.id}"`).then(async userdatarow => {
	    const user = await userFinding.resolve(message, args[0]);

	    if(!args[1])return template(`**${message.author.username}**, please put the number.`)
	    if(args[1].includes(user.id))return template(`❌ | Transaction failed.\nREASON: \`WRONG FORMAT.\``, palette.red)
	    if(user.id === message.author.id)return template(`I know what you did there,. ${message.author.username}.`);
	    if(userdatarow.artcoins < args[1])return template(`❌ | Transaction failed.\nREASON: \`NOT ENOUGH BALANCE.\``);


	    if(user.id !== message.author.id) {
		    const emoji = (name) => {
		        return bot.emojis.find(e => e.name === name)
		    }
		    let transactionCode2 = randomString(5, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		    let transactionCode = randomString(2, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		    let digitValue = format.threeDigitsComa(args[1]);
		    let timestamp = moment(Date.now()).format(`MMMM Do YYYY, h:mm:ss a`);

	            sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins - parseInt(args[1])} WHERE userId = ${message.author.id}`);
	            sql.get(`SELECT * FROM userdata WHERE userId ="${user.id}"`).then(async userdatarow => {
	            sql.run(`UPDATE userdata SET artcoins = ${userdatarow.artcoins + parseInt(args[1])} WHERE userId = ${user.id}`);
	          	console.log(`Transaction successful. ID : ${message.author.username}, ${user.user.username}`)

	                return template(`
	                    ✅ | Transaction successful.
	                    ${timestamp}\n
	                    TRANSACTION ID : ${transactionCode}-${transactionCode2}
	                    TRANSFER
	                    TO ACCOUNT:  \`${user.id}\`
	                    NAME :  **${user.user.username}**
	                    VALUE : ${emoji(`ArtCoins`)} **${digitValue}**
	                    This message is automatically generated after you made a
	                    successful payment with other user.\n

	                    If you have any trouble, please DM the available councils`, palette.lightgreen)
	            })
	        }
        })
}
}
module.exports.help = {
    name:"pay",
        aliases:[]
}