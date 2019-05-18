const Discord = require('discord.js');
const ms = require('parse-ms');

const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async(bot, command, message,args)=>{

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

		let embed = new Discord.RichEmbed()

		.setColor('#5178a5')
		.setDescription(`This feature will be available in the next update. Sorry for the incovenience. </3`)

		return message.channel.send(embed);

}

		///
		///	secretcommand.js
		///
		///		Secret Box Command
		///		changes log :
		///			09/20/18 - Reworked secretcommand feature.
		///
		/// NOTES >
		///		Kito asked me to pending this feature till the next update come. Probably in 1.3.5 Patch.
		///		So if you have any ideas, feel free to add it below.

	/*
		let elsePool = [
		`"You won't find anything in here."`,
		`"You've found an old pencil."`,
		`"You've found some copic brushes."`,
		`"*A Pile of dust.*"`,
		`"Oops.. empty box."`,
		`"Zonk. Please try again tomorrow!"`,
		`"Nothing."`,
		`"What you're looking for?"`
		];

		const coinsPool = [100,250,500,1000,3000];

	    let cooldown = 8.64e+7;

        const botcon = bot.user.displayAvatarURL;
        let dailyEmbed = new Discord.RichEmbed();
        let giftEmbed = new Discord.RichEmbed();
        var proc = Math.random();
        var coinsProc = Math.random();
        var procElsePool = elsePool[Math.floor(Math.random () * elsePool.length)];
        var coinsPoolArr = coinsPool[Math.floor(Math.random () * coinsPool.length)];

        dailyEmbed.setColor('#ad3632')
        dailyEmbed.setFooter(`Anime Artist United  |  Secret Box | ${message.author.username}`, botcon)
        giftEmbed.setDescription(`*opening ..* 🎁`)

	    sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`).then(async usercheckrow => {
         if (usercheckrow) {

            if ((usercheckrow.lastSecretBox !== null) && cooldown - (Date.now() - usercheckrow.lastSecretBox) > 0 ) {
                let timeObj = ms(cooldown - (Date.now() - usercheckrow.lastSecretBox));
                dailyEmbed.setDescription(`You can open the box again in **${timeObj.hours} hours, ${timeObj.minutes} minutes**.`)
               	return message.channel.send(dailyEmbed);

           }

             else if (proc < 0.2) {

             				    dailyEmbed.setDescription(`<@${message.author.id}> got jackpot **${coinsPoolArr}** AC !!"`)
             				    dailyEmbed.setColor('#82e093')

             				  	//sql.run(`UPDATE usercheck SET lastSecretBox = "${Date.now()}" WHERE userId = ${message.author.id}`);
		                		sql.get(`SELECT * FROM userdata WHERE userId ="${message.author.id}"`).then(async userdatarow => {
		                    	sql.run(`UPDATE userdata SET artcoins = "${coinsPoolArr + userdatarow.artcoins}" WHERE userId = ${message.author.id}`);
		                    	console.log(coinsProc, proc)
		                    	return message.channel.send(giftEmbed).then((msg) => msg.edit(dailyEmbed));
		                    })
                	  }

              else if(proc < 1.0) {
             		//sql.run(`UPDATE usercheck SET lastSecretBox = "${Date.now()}" WHERE userId = ${message.author.id}`);
                		dailyEmbed.setDescription(`${procElsePool}`)
                		console.log(coinsProc, proc)
		                    	return message.channel.send(giftEmbed).then((msg) => msg.edit(dailyEmbed));

                			}
		            	}
		       		 })
		
			}


/*		/// AKANE'S SECRETCMD
    let tomute =  message.guild.member(message.author.id);
    let cdseconds = 6;
    let muterole = message.guild.roles.find(`name`,"muted");
    await(tomute.addRole(muterole.id));


message.reply(`Haha you dumbass, you just muted yourself ${cdseconds*10000}ms`);

setTimeout(function(){
tomute.removeRole(muterole.id);
message.channel.send(`<@${tomute.id}>has been unmuted `)
},cdseconds*10000);
*/

module.exports.help={
    name:"secretbox",
        aliases:[]
}