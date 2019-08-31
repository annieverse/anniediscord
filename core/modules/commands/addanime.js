const Discord = require(`discord.js`)
const sql = require(`sqlite`)
sql.open(`.data/database.sqlite`)
class addAnime {
    constructor(Stacks) {
        this.author = Stacks.meta.author
        this.data = Stacks.meta.data
        this.utils = Stacks.utils
        this.message = Stacks.message
        this.args = Stacks.args
        this.palette = Stacks.palette
        this.stacks = Stacks
    }

    async execute() {
        let message = this.message
        let palette = this.stacks.palette
        function profileDescription(userid, desc) {
            sql.get(`SELECT * FROM userdata WHERE userId=${userid}`)
                .then(() => {
                    sql.run(`UPDATE userdata SET anime_link = ? WHERE userId = ?`, [desc, userid])
                })
        }

        let descriptionArguments = message.content.substring(this.stacks.command.length+2).trim()
        const embed = new Discord.RichEmbed()

        if (!this.args[0]) {
            embed.setColor(palette.darkmatte)
            embed.setDescription(`Here's the example on how to add the Link to your anime site!\n\n\`>addanime\` \`https://myanimelist.net/profile/username\``)

            return message.channel.send(embed)
        } else if (!descriptionArguments.startsWith(`https://myanimelist.net/profile/`)) {
            embed.setColor(palette.darkmatte)
            embed.setDescription(`Right now you can only set MAL profile links. To have your site added, request in #suggestions`)

            return message.channel.send(embed)
        } else {
            await profileDescription(message.author.id, descriptionArguments)

            embed.setColor(palette.halloween)
            embed.setDescription(`Hello **${message.author.username}**, your anime link has been set to \`${descriptionArguments}\``)

            return message.channel.send(embed)

        }
    }
}

module.exports.help = {
    start: addAnime,
    name: `addanime`,
    aliases: [`anime`, `setanime`],
    description: `Set anime Link to anime site`,
    usage: `addanime <link to Anime List>`,
    group: `General`,
    public: true,
    require_usermetadata: true,
    multi_user: true
}