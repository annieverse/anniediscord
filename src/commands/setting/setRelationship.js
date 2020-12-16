const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/setRelationship`)
const stringSimilarity = require('string-similarity')
/**
 * Assign your friend into your relationship trees!
 * @author klerikdust
 */
class SetRelationship extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * Relationship trees limit
         * @type {string}
         */
        this.limit = 7
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
        if (!this.fullArgs && this.user.isSelf) return reply(this.locale.RELATIONSHIP.GUIDE, {
            header: `Hi, ${name(this.author.id)}!`,
            image: `banner_setrelationship`,
            socket: {
                list: this.prettifyList(availableRelationships),
                prefix: this.bot.prefix
            }
        })
        //  Handle if target doesn't exists
        if (!this.user) return reply(this.locale.USER.IS_INVALID)
        //  Handle if target is the author
        if (this.user.isSelf) return reply(this.locale.RELATIONSHIP.SET_TO_SELF, {socket: {emoji: emoji(`AnnieMad`)} })
        //  Handle if user already reached the maximum relationship members and attempted to add new member
        const userRels = this.author.relationships.map(node => node.assigned_user_id)
        if ((userRels.length >= 7) && !userRels.includes(this.user.id)) return reply(this.locale.RELATIONSHIP.HIT_LIMIT, {
            socket: {emoji:emoji(`AnnieSmuggy`)}
        })
        //  Handle if the specified gift cannot be found
        let searchStringResult = stringSimilarity.findBestMatch(this.fullArgs, availableRelationships.map(i => i.name))
        const relationship = searchStringResult.bestMatch.rating >= 0.3 ? availableRelationships.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
        if (!relationship) return reply(this.locale.RELATIONSHIP.TYPE_DOESNT_EXIST, {socket: {emoji:emoji(`AnnieThinking`)} })
        //  Render confirmation
        this.confirmation = await reply(this.locale.RELATIONSHIP.TARGET_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(this.user, relationship.name).build(),
            socket: {
                user: name(this.user.id),
                mention: this.user,
                relationship: relationship.name,
            }
        })
        this.addConfirmationButton(`setRelationship`, this.confirmation, this.user.id)
        return this.confirmationButtons.get(`setRelationship`).on(`collect`, async r => {
            //  Update relationship data on author side
            await this.bot.db.setUserRelationship(this.author.id, this.user.id, parseInt(relationship.relationship_id), this.message.guild.id)
            //  Successful
            this.finalizeConfirmation(r)
            return reply(``, {customHeader: [`${name(this.user.id)} has accepted your relationship request!`, avatar(this.user.id)]})
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
            str += `╰☆～(${rel.relationship_id}) **${rel.name}**\n`
        }
        return str
    }

}

module.exports.help = {
    start: SetRelationship,
    name: `setRelationship`,
    aliases: [`setrel`, `setrelationship`, `setrelations`, `setrelation`, `addrelationship`, `setrelationship`, `addrel`],
    description: `Assign your friend into your relationship trees!`,
    usage: `setrelationship`,
    group: `Setting`,
    permissionLevel: 0,
    multiUser: true
}