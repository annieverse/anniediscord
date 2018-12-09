const Discord = require('discord.js');
const palette = require('../colorset.json');

module.exports.run = async(bot,command,message,args)=>{
	//
	//	change logs :
	//		11/05/18 - Bug fixes.
	//		10/18/18 - Embed changes, minor bug fixes
	//		09/16/18 - Reworked 8ball feature (naphnaphz)
	//
	//		

let askEmbed = new Discord.RichEmbed();
let bicon = message.author.displayAvatarURL;

askEmbed.setColor(palette.halloween)
askEmbed.setFooter(`${message.author.username} | Asking Question`,bicon);

if(!args[1]) {
	askEmbed.setDescription('Please ask a full question!')
	return message.channel.send(askEmbed);
} 

let replies = ["Yes.", "No.", "I don't know.", "You", "Well, probably.", "Not sure.", "Definitely!"];
let result = Math.floor((Math.random() * replies.length));
let question = args.slice(0).join(" ");
		
		askEmbed.setThumbnail(bicon)
		askEmbed.addField(`${message.author.username}'s question :`, ` > ${question}`)
		askEmbed.addField(`Annie's answer :`, ` > ${replies[result]}`);

		return message.channel.send(askEmbed)

}
module.exports.help={
    name:"ask",
        aliases:[]
}