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

        async function getRelationship() {
            const relations = await collection.relationships
            const embed = new Discord.RichEmbed().setColor(palette.darkmatte)
            const formatting = async () => {
                var content = ``
                for (var i = 0; i < relations.length; i++) {
                    content += `[${i + 1}] Me: ${relations[i].myRelation} - ${name(relations[i].theirUserId)}: ${relations[i].theirRelation}\n`
                }
                return content
            }

            relations.length==0 ? embed.setDescription(`You're not in any relationships. :(`) : embed.setDescription(await formatting())

            await message.channel.send(`**${name(author.id)}'s Relations**`)
            await message.channel.send(embed)
            if (author.id == message.author.id) {
                /*To set one relationship as your main relationship, type the number of the relationship.*/
                reply(`To add a relationship, type \`>addrel username\`.\n
                To remove a relationship, type \`>delrel username\`.\n`, {
                    color: palette.golden,
                    notch: true
                })

                /*
                const collector = new Discord.MessageCollector(message.channel,
                    m => m.author.id === message.author.id, {
                        max: 1,
                        time: 60000,
                    })

                collector.on(`collect`, async (msg) => {
                    let input = msg.content
                    if (relations[input-1]) {
                        collection.setMainRelationship(relations[input-1].theirUserId).then(
                            reply(`Main relationship changed!`, {
                                color: palette.green,
                                notch: true
                            }))
                    } else if (Number.isInteger(input)) {
                        reply(`Main relationship change unsuccessful.`, {
                            color: palette.red,
                            notch: true
                        })
                    }
                    collector.stop()
                })
                */
            }
        }

        async function addRelationship() {
            if (author.id == message.author.id) {
                return reply(`You can't be in a relationship with yourself!`, {
                    color: palette.red,
                    notch: true
                })
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

            await message.channel.send(`**What's your relationship title? Type the number**`)
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
                        reply(`Relationship status set successfully!\n
                        When ${name(author.id)}, sets their status, it's official!`, {
                            color: palette.green,
                            notch: true
                        }))
                } else {
                    reply(`Relationship status couldn't be set.`, {
                        color: palette.red,
                        notch: true
                    })
                }
                collector.stop()
            })
        }

        async function deleteRelationship() {
            if (author.id == message.author.id) {
                return reply(`You can't delete a relationship with yourself!`, {
                    color: palette.red,
                    notch: true
                })
            }
            //You will lose all your relation points and data :(
                reply(`Are you sure you want to delete this relationship?\n
            Your partner would be sad.\n
            Please type \`y\` to confirm.`, {
                color: palette.golden,
                notch: true
            })

            const collector = new Discord.MessageCollector(message.channel,
                m => m.author.id === message.author.id, {
                    max: 1,
                    time: 60000,
                })

            collector.on(`collect`, async (msg) => {
                let input = msg.content
                if (input==`y`) {
                    collection.deleteRelationship(message.author.id).then(
                        reply(`Relationship status deleted. Bye bye.`, {
                            color: palette.green,
                            notch: true
                        }))
                } else {
                    reply(`Deletion aborted.`, {
                        color: palette.red,
                        notch: true
                    })
                }
                collector.stop()
            })
        }

        switch(command) {
            case `addrel`:
            case `addrels`:
                addRelationship()
                break
            case `delrel`:
            case `delrels`:
                deleteRelationship()
                break
            default:
                getRelationship()
        }
    }
}


module.exports.help = {
    start: ManageRelations,
    name: `managerelations`,
    aliases: [`viewrel`, `viewrels`, `seerel`, `seerels`, `getrel`, `getrels`, `addrel`, `addrels`, `delrel`, `delrels`],
    description: `Manages the relationships a user can be in`,
    usage: `managerelations`,
    group: `Fun`,
    public: true,
    required_usermetadata: true,
    multi_user: true
}