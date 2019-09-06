const databaseManager = require(`../../utils/databaseManager`)

const Discord = require(`discord.js`)
/**
 * Main module
 * @Relations module for managing Relations,
 * not to be confused with the subcomponent of profile
 */

class ManageRelations {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const {reply, name, message, command, palette, meta: {author}} = this.stacks

        if (!author) return reply(`TODO invalid user`)

        const collection = new databaseManager(author.id)

        async function getRel() {
            const relations = await collection.relationships
            const embed = new Discord.RichEmbed().setColor(palette.darkmatte)
            const formatting = async () => {
                var content = ``
                for (var i = 0; i < relations.length; i++) {
                    content += `[${i + 1}] Me: ${relations[i].myrelation} - ${name(relations[i].userId)}: ${relations[i].theirrelation}\n`
                }
                return content
            }

            relations.length==0 ? embed.setDescription(`You're not in any relations. :(`) : embed.setDescription(await formatting())

            await message.channel.send(`**${name(author.id)}'s Collection**`)
            await message.channel.send(embed)
            if (author.id == message.author.id) {
                message.channel.send(`To add a relation type >addrel username. To remove a relation type >delrel username`)
            }
        }

        async function addRel() {
            if (author.id == message.author.id) {
                return message.channel.send(`You can't be in a relationship with yourself!`)
            }

            const relationtypes = await collection.relationshipTypes
            const embed = new Discord.RichEmbed().setColor(palette.darkmatte)
            const formatting = async () => {
                var content = ``
                for (var i = 0; i < relationtypes.length; i++) {
                    content += `[${i + 1}] ${relationtypes[i].type}\n`
                }
                return content
            }

            embed.setDescription(await formatting())

            await message.channel.send(`**What's your relationship title?**`)
            message.channel.send(embed)

            const collector = new Discord.MessageCollector(message.channel,
                m => m.author.id === message.author.id, {
                    max: 1,
                    time: 60000,
                })

            collector.on(`collect`, async (msg) => {
                let input = msg.content
                if (relationtypes[input-1]) {
                    collection.setRelationship(input, message.author.id).then(
                        message.channel.send(`Relationship status set successfully! Now ${name(author.id)} only needs to set their status.`))
                } else {
                    message.channel.send(`Relationship status couldn't be set.`)
                }
            })
        }

        async function delRel() {
            if (author.id == message.author.id) {
                return message.channel.send(`You can't delete a relationship with yourself!`)
            }
            message.channel.send(`Are you sure you want to delete this relationship? You will lose all your relation points and data :(\nPlease type y to confirm.`)

            const collector = new Discord.MessageCollector(message.channel,
                m => m.author.id === message.author.id, {
                    max: 1,
                    time: 60000,
                })

            collector.on(`collect`, async (msg) => {
                let input = msg.content
                if (input==`y`) {
                    collection.deleteRelationship(message.author.id).then(
                        message.channel.send(`Relationship status deleted. Bye bye.`))
                } else {
                    message.channel.send(`Deletion aborted.`)
                }
            })
        }

        switch(command) {
            case `addrel`:
            case `addrels`:
                addRel()
                break
            case `delrel`:
            case `delrels`:
                delRel()
                break
            default:
                getRel()
        }
    }
}


module.exports.help = {
    start: ManageRelations,
    name: `managerelations`,
    aliases: [`managerel`, `managerels`, `getrel`, `getrels`, `addrel`, `addrels`, `delrel`, `delrels`],
    description: `Manages the relations a user can have`,
    usage: `managerelations`,
    group: `Fun`,
    public: true,
    required_usermetadata: true,
    multi_user: true
}