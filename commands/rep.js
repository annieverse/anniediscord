const Discord = require('discord.js');
const config = require('../botconfig.json');
const palette = require('../colorset.json');
const ms = require('parse-ms');
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot, command, message, args)=> {


 async function userResolvable(input){
	    const userPatern = /^(?:<@!?)?([0-9]+)>?$/;
	    if(userPatern.test(input)) input = input.replace(userPatern, '$1');
	    let members = message.guild.members;
	    const filter = member => member.user.id === input
	        || member.displayName.toLowerCase() === input.toLowerCase()
	        || member.user.username.toLowerCase() === input.toLowerCase()
	        || member.user.tag.toLowerCase() === input.toLowerCase();
	    return members.filter(filter).first();
	}


 function displayUsername(id) {
		return bot.users.get(id).username;
	}


 function incrementRep(user) {
		sql.get(`SELECT * FROM userdata WHERE userId=${user}`)
		.then(async data => {
		 	   sql.run(`UPDATE userdata SET reputations = "${data.reputations + 1}" WHERE userId=${user}`);
		 	})
		}


const embed = new Discord.RichEmbed();
const embed2 = new Discord.RichEmbed();
const userArgumentsFinding = message.content.substring(5);
const parsedUser = await userResolvable(userArgumentsFinding);
let cooldown = 8.64e+7;

sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`).then(async usercheckrow => {

if ((usercheckrow.repcooldown !== null) && cooldown - (Date.now() - usercheckrow.repcooldown) > 0 ) {
    let timeObj = ms(cooldown - (Date.now() - usercheckrow.repcooldown));
    embed2.setColor(palette.red)
    embed2.setDescription(`You can give rep again in \`${timeObj.hours}h, ${timeObj.minutes}m, ${timeObj.seconds}s.\``)
    embed2.setFooter(`${message.author.username} | Reputations`, message.author.displayAvatarURL)
    return message.channel.send(embed2);	

}

else if(!args[0]) {
	embed.setColor(palette.darkmatte)
	embed.setDescription(`Could you please specify the user? (example: \`${config.prefix}rep\` \`@Kitomi\`)`)
	return message.channel.send(embed);

}

else if(parsedUser.id === message.author.id) {
		embed.setColor(palette.darkmatte)
		embed.setDescription(`Sorry, you can't give rep to yourself. :(`)

		return message.channel.send(embed)

}

else {
		await incrementRep(parsedUser.id);
		sql.run(`UPDATE usercheck SET repcooldown = "${Date.now()}" WHERE userId = ${message.author.id}`);
		embed.setColor(palette.halloween)
		embed.setDescription(`**${displayUsername(parsedUser.id)}** has received +1 rep point from **${message.author.username}**. <:AnniePumpkinHug:501857806836695040> `)

		return message.channel.send(embed);
	}	
  })
}
module.exports.help = {
    name:"rep",
        aliases:[]
}