const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/setRelationship`)
const stringSimilarity = require(`string-similarity`)
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
     * Fetch the User's snowflake in author's relationship tree.
     * @return {map}
     */
    async _getAuthorRelationshipUsers() { 
        const res = []
        for (let i=0; i<this.author.relationships.length; i++) {
            const obj = this.author.relationships[i]
            const user = await this.bot.users.fetch(obj.assigned_user_id)
            if (!user) continue
            res[i] = user
        }
        return res
    }
    
    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
        const availableRelationships = await this.bot.db.getAvailableRelationships()
        const isRemovalAction = this.fullArgs.startsWith(`delete`) || this.fullArgs.startsWith(`remove`)
        await this.requestAuthorMetadata(2)
        //  This will perform the search on local pool if user uses deletion action.
        //  To ensure they able to delete their relationship tree with ease
        //  Without the limitation of server.
        let useRemoveAction = false
        if (isRemovalAction) {
            useRemoveAction = true
            this.fullArgs = this.args.slice(1).join(` `)
        }
        await this.requestUserMetadata(2, isRemovalAction ? await this._getAuthorRelationshipUsers() : null)
        //  Handle if user doesn't provide any argument
        if (!this.fullArgs && (this.user.master.id === this.message.author.id)) return this.reply(this.locale.RELATIONSHIP.GUIDE, {
            header: `Hi, ${this.message.author.username}!`,
            image: `banner_setrelationship`,
            socket: {
                list: this.prettifyList(availableRelationships),
                prefix: this.bot.prefix
            }
        })
        //  Handle if target doesn't exists
        if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
        //  Handle if target is the author
        if (this.user.master.id === this.message.author.id) return this.reply(this.locale.RELATIONSHIP.SET_TO_SELF, {socket: {emoji: await this.bot.getEmoji(`751016612248682546`)} })
		//  Handle delete action	
        const userRels = this.author.relationships.map(node => node.assigned_user_id)
		if (useRemoveAction) {
			if (!userRels.includes(this.user.master.id)) return this.reply(this.locale.RELATIONSHIP.TARGET_NOT_PART_OF, {
				socket: {
					user: this.user.master.username,
					emoji: await this.bot.getEmoji(`790338393015713812`)
				}
			})
			const deleteConfirmation = await this.reply(this.locale.RELATIONSHIP.DELETE_CONFIRMATION, {
				header: `Break up with ${this.user.master.username}?`,
				thumbnail: this.user.master.displayAvatarURL(),
				socket: {emoji: await this.bot.getEmoji(`692428578683617331`)}
			}) 
			await this.addConfirmationButton(`setRelationship`, deleteConfirmation, this.author.master.id)
			return this.confirmationButtons.get(`setRelationship`).on(`collect`, async r => {
				//  Handle cancellation
				if (this.isCancelled(r)) return this.reply(``, {
					customHeader: [`Good decision. Keep the relationship eternal.`, this.user.master.displayAvatarURL()]
				})
				//  Update relationship data on both side
				this.bot.db.removeUserRelationship(this.author.master.id, this.user.master.id)
				this.bot.db.removeUserRelationship(this.user.master.id, this.author.master.id)
				//  Successful
				this.finalizeConfirmation(r)
				return this.reply(``, {
					customHeader: [`${this.user.master.username} is no longer with you.`, this.user.master.displayAvatarURL()]})
			})
		}	
        //  Handle if user already reached the maximum relationship members and attempted to add new member
        const relLimit = 7
        if ((userRels.length >= relLimit) && !userRels.includes(this.user.master.id)) return this.reply(this.locale.RELATIONSHIP.HIT_LIMIT, {
            socket: {emoji: await this.bot.getEmoji(`781956690337202206`)}
        })
        //  Handle if target already reached their maximum relationship
        if (this.user.relationships.length >= relLimit) return this.reply(this.locale.RELATIONSHIP.HIT_LIMIT_OTHERS, {
            socket: {
                user: this.user.master.username
            }
        })
        //  Handle if the specified relationship cannot be found
        let searchStringResult = stringSimilarity.findBestMatch(this.fullArgs, availableRelationships.map(i => i.name))
        const relationship = searchStringResult.bestMatch.rating >= 0.3 ? availableRelationships.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
        if (!relationship) return this.reply(this.locale.RELATIONSHIP.TYPE_DOESNT_EXIST, {socket: {emoji: await this.bot.getEmoji(`692428969667985458`)} })
        //  Render confirmation
        this.confirmation = await this.reply(this.locale.RELATIONSHIP.TARGET_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(this.user, relationship.name).build(),
            socket: {
                user: await this.bot.getUsername(this.user.master.id),
                mention: this.user.master,
                relationship: relationship.name,
            }
        })
        await this.addConfirmationButton(`setRelationship`, this.confirmation, this.user.master.id)
        return this.confirmationButtons.get(`setRelationship`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(``, {
				customHeader: [`Oops, they rejected your relationship request...`, this.user.master.displayAvatarURL()]
			})
            //  Update relationship data on both side
            this.bot.db.setUserRelationship(this.author.master.id, this.user.master.id, parseInt(relationship.relationship_id))
            this.bot.db.setUserRelationship(this.user.master.id, this.author.master.id, parseInt(relationship.relationship_id))
            //  Successful
            this.finalizeConfirmation(r)
            return this.reply(``, {customHeader: [`${this.user.master.username} has accepted your relationship request!`, this.user.master.displayAvatarURL()]})
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
