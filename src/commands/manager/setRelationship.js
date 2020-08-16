const Command = require(`../../libs/commands`)
/**
 * Edit and customize your relationship trees.
 * @author sunnyrainyworks.
 * @revised in v6.0.0 by klerikdust
 */
class SetRelationship extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, avatar, bot:{db} }) {
        await this.requestUserMetadata(2)
        await this.requestAuthorMetadata(2)

        const availableRelationships = await db.getAvailableRelationships()
        const prettifiedRelationshipsList = this.prettifyList(availableRelationships)

        //  Handle if no relationships are available to be assigned.
        if (!availableRelationships) return reply(this.locale.RELATIONSHIP.UNAVAILABLE)
        //  Handle if user doesn't provide any argument
        if (!this.fullArgs) return reply(this.locale.RELATIONSHIP.GUIDE)
        //  Handle if target doesn't exists
        if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
        //  Handle if target is the author
        if (this.user.isSelf) return reply(this.locale.RELATIONSHIP.SET_TO_SELF, {color: `red`, socket: {emoji: emoji(`AnnieMad`)} })

        //  Handle if target already registered in author's relationship tree
        const alreadyInRelationship = this.author.relationships.filter(rel => rel.assigned_user_id === this.user.id)
        if (alreadyInRelationship.length) {
            this.changeAndDeleteOptions = true
            await reply(this.locale.RELATIONSHIP.ALREADY_REGISTERED, {
                color: `red`,
                socket: {
                    user: name(alreadyInRelationship[0].assigned_user_id),            
                    role: alreadyInRelationship[0].relationship_name
                }
            })
            await reply(this.locale.RELATIONSHIP.CHANGE_DELETE_GUIDE, {simplified: true})
        }
        else {
            await reply(this.locale.RELATIONSHIP.SELECTION, {color: `golden`, socket: {user: name(this.user.id), list: prettifiedRelationshipsList} })
            await reply(this.locale.RELATIONSHIP.SELECTION_GUIDE, {simplified: true})
        }

        this.setSequence(3)
        this.sequence.on(`collect`, async msg => {
            let input = msg.content.toLowerCase()
            let parameters = input.split(` `)

            /** --------------------
             *  Sequence Cancellations
             *  --------------------
             */
            if (this.cancelParameters.includes(input)) {
                reply(this.locale.ACTION_CANCELLED)
                return this.endSequence()
            }

            /** --------------------
             *  Sequence Change & Delete action
             *  --------------------
             */
            if (this.changeAndDeleteOptions) {
                this.action = parameters[0]

                //  Relationship deletion
                if (this.action.startsWith(`delete`)) {
                    await db.removeUserRelationship(this.author.id, this.user.id, this.message.guild.id)
                    reply(this.locale.RELATIONSHIP.SUCCESSFULLY_REMOVED, {color: `lightgreen`, socket: {user: name(this.user.id)} })
                    return this.endSequence()
                }

                //  Relationship change
                if (this.action.startsWith(`change`)) {
                    const selectedRelationship = input.slice(parameters[0].length+1)
                    const foundMatchedRelationship = availableRelationships.filter(rel => (rel.relationship_id === parseInt(selectedRelationship)) || (rel.name === selectedRelationship))

                    if (!foundMatchedRelationship.length) return
                    await db.setUserRelationship(this.author.id, this.user.id, parseInt(foundMatchedRelationship[0].relationship_id), this.message.guild.id)
                    reply(this.locale.RELATIONSHIP.SUCCESSFULLY_REGISTERED, {
                        color: `lightgreen`,
                        thumbnail: avatar(this.user.id),
                        notch: true,
                        socket: {
                            user: name(this.author.id),
                            assignedUser: name(this.user.id),
                            role: foundMatchedRelationship[0].name
                        }
                    })
                    return this.endSequence()
                }
                return
            }

            //  Default action. Assigning relationship.
            const foundMatchedRelationship = availableRelationships.filter(rel => (rel.relationship_id === parseInt(input)) || (rel.name === input))
            await db.setUserRelationship(this.author.id, this.user.id, parseInt(foundMatchedRelationship[0].relationship_id), this.message.guild.id)
            reply(this.locale.RELATIONSHIP.SUCCESSFULLY_REGISTERED, {
                color: `lightgreen`,
                thumbnail: avatar(this.user.id),
                notch: true,
                socket: {
                    user: name(this.author.id),
                    assignedUser: name(this.user.id),
                    role: foundMatchedRelationship[0].name
                }
            })
            return this.endSequence()
        })
    }

    /**
     * Properly arrange returned list from `db.getAvailableRelationships`
     * @param {array} [list=[]] db.getAvailableRelationships
     * @returns {string}
     */
    prettifyList(list) {
        let str = ``
        for (let i = 0; i<list.length; i++) {
            const rel = list[i]
            str += `[${rel.relationship_id}] **${rel.name}**\n`
        }
        return str
    }

}

module.exports.help = {
    start: SetRelationship,
    name: `setRelationship`,
    aliases: [`setrel`, `setrelationship`, `setrelations`, `setrelation`, `addrelationship`, `setrelationship`, `addrel`],
    description: `Edit and customize your relationship trees`,
    usage: `setrelation`,
    group: `Manager`,
    permissionLevel: 0,
    multiUser: true
}