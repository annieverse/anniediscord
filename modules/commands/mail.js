const Discord = require('discord.js');
const formatManager = require('../../utils/formatManager'); 

class mail {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.stacks = Stacks;
    }

    async execute() {
        let message = this.message;
        let palette = this.stacks.palette;
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
            catch (e) {
                form.embedWrapper(palette.darkmatte, `Can't proceed. Their dms are locked.`)
            }
        }
    }
}

module.exports.help = {
    start: mail,
    name: "mail",
    aliases: [],
    description: `Send a message to a specified user`,
    usage: `>mail @user <message>`,
    group: "Admin",
    public: true,
    require_usermetadata: true,
    multi_user: true
}