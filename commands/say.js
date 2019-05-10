const Discord = require('discord.js');
const botconfig = require("../botconfig");
const palette = require('../colorset.json');

module.exports.run = async(bot,command,message,args)=>{
let sayEmbed = new Discord.RichEmbed()

	let bicon = bot.user.displayAvatarURL;
	let text = args.join(" ");
	let textEmbed = args.slice(1).join(" ");

if (message.member.hasPermission("ADMINISTRATOR")) {

	if(args[0] === 'embed') {

	sayEmbed.setColor(palette.halloween)
	sayEmbed.setDescription(textEmbed)

                return message.delete().then((msg)=>
		 			msg.channel.send(sayEmbed));

    }
                message.delete();
		 			return message.channel.send(text);

	}


		sayEmbed.setColor('#ffac30')
		sayEmbed.setDescription(`You don't have authorization to use this command.`)
        sayEmbed.setFooter(`Anime Artist United | Say Message`, bicon)

		 return message.channel.send(sayEmbed);

}
module.exports.help = {
	name: "say",
        aliases:[]
}