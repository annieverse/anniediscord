const Discord = require('discord.js');
const formatManager = require('../../utils/formatManager');

module.exports.run = async (bot, command, message, args, utils) => {
	//
	//	change logs :
	//		11/05/18 - Bug fixes.
	//		10/18/18 - Embed changes, minor bug fixes
	//		09/16/18 - Reworked 8ball feature (naphnaphz)
	//
	//		

const format = new formatManager(message);
return ["bot", "bot-games", "cmds","sandbox"].includes(message.channel.name) ? initAsk()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)




async function initAsk() {
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
}
module.exports.help={
  name:"ask",
  aliases: [],
  description: `You can ask any question and Annie will answer you.`,
  usage: `>ask <message>`,
  group: "Fun",
  public: true,
}