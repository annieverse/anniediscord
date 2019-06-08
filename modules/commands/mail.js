const Discord = require('discord.js');
const formatManager = require('../../utils/formatManager'); 


module.exports.run = async (bot, command, message, args, utils) => {


!message.member.roles.find(r => r.name === 'Grand Master') ? message.channel.send('Unauthorized access.')   
: sendMail()

    async function sendMail() {
        const form = new formatManager(message);
        const target = await utils.userFinding(message, args[0]);
        const content = message.content.substring(args[0].length + 7);
        const embed = new Discord.RichEmbed()
            .setColor(palette.halloween)
            .setFooter(`[Admin]${message.author.username}`, message.author.displayAvatarURL)
            .setDescription(content)

            try {
                target.send(embed)
                form.embedWrapper(palette.darkmatte, `Message has been sent to **${target.user.tag}.**`)
                
            }
            catch(e) {
                form.embedWrapper(palette.darkmatte, `Can't proceed. Their dms are locked.`)
            }
    }

}

module.exports.help = {
    name: "mail",
    aliases: [],
    description: `Send a message to a specified user`,
    usage: `>mail @user <message>`,
    group: "Admin",
    public: true,
}