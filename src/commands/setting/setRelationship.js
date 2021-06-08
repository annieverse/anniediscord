const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/setRelationship`)
const stringSimilarity = require(`string-similarity`)
/**
 * Assign your friend into your relationship trees!
 * @author klerikdust
 */
module.exports = {
    name: `setRelationship`,
    aliases: [`setrel`, `setrelationship`, `setrelations`, `setrelation`, `addrelationship`, `setrelationship`, `addrel`],
    description: `Assign your friend into your relationship trees!`,
    usage: `setrelationship`,
    permissionLevel: 0,
    limit: 7,
    async execute(client, reply, message, arg, locale, prefix) {
        const availableRelationships = await client.db.getAvailableRelationships()
        //  Handle if user doesn't provide any argument
        if (!arg) return reply.send(locale.RELATIONSHIP.GUIDE, {
            header: `Hi, ${message.author.usernam}!`,
            image: `banner_setrelationship`,
            socket: {
                list: this.prettifyList(availableRelationships),
                prefix: prefix
            }
        })
        const isRemovalAction = arg.startsWith(`delete`) || arg.startsWith(`remove`)
        //  This will perform the search on local pool if user uses deletion action.
        //  To ensure they able to delete their relationship tree with ease
        //  Without the limitation of server.
        let useRemoveAction = false
        if (isRemovalAction) {
            useRemoveAction = true
            arg = arg.split(` `).slice(1).join(` `)
        }
        const userLib = new User(client, message)
        const targetUser = await userLib.lookFor(arg)
        if (!targetUser) return reply.send(locale.USER.IS_INVALID)
        //  Handle if target is the author
        if (userLib.isSelf(targetUser.master.id)) return reply.send(locale.RELATIONSHIP.SET_TO_SELF, {socket: {emoji: await client.getEmoji(`751016612248682546`)} })
        const userData = await userLib.requestMetadata(message.author, 2)
        const targetUserData = await userLib.requestMetadata(targetUser.master, 2)
		//  Handle delete action	
        const c = new Confirmator(message, reply)
        const userRels = userData.relationships.map(node => node.assigned_user_id)
		if (useRemoveAction) {
			if (!userRels.includes(targetUser.master.id)) return reply.send(locale.RELATIONSHIP.TARGET_NOT_PART_OF, {
				socket: {
					user: targetUser.master.username,
					emoji: await client.getEmoji(`790338393015713812`)
				}
			})
			const deleteConfirmation = await reply.send(locale.RELATIONSHIP.DELETE_CONFIRMATION, {
				header: `Break up with ${targetUser.master.username}?`,
				thumbnail: targetUser.master.displayAvatarURL(),
				socket: {emoji: await client.getEmoji(`692428578683617331`)}
			}) 
            await c.setup(message.author.id, deleteConfirmation)
            c.onAccept(() => {
				//  Update relationship data on both side
				client.db.removeUserRelationship(message.author.id, targetUser.master.id)
				client.db.removeUserRelationship(targetUser.master.id, message.author.id)
				return reply.send(``, {
					customHeader: [`${targetUser.master.username} is no longer with you.`, targetUser.master.displayAvatarURL()]})
			})
		}	
        //  Handle if user already reached the maximum relationship members and attempted to add new member
        const relLimit = 7
        if ((userRels.length >= relLimit) && !userRels.includes(targetUser.master.id)) return reply.send(locale.RELATIONSHIP.HIT_LIMIT, {
            socket: {emoji: await client.getEmoji(`781956690337202206`)}
        })
        //  Handle if target already reached their maximum relationship
        if (targetUserData.relationships.length >= relLimit) return reply.send(locale.RELATIONSHIP.HIT_LIMIT_OTHERS, {
            socket: {
                user: targetUser.master.username
            }
        })
        //  Trim user search from arg string
        arg = arg.replace(targetUser.usedKeyword, ``)
        //  Handle if the specified relationship cannot be found
        let searchStringResult = stringSimilarity.findBestMatch(arg, availableRelationships.map(i => i.name))
        const relationship = searchStringResult.bestMatch.rating >= 0.3 ? availableRelationships.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
        if (!relationship) return reply.send(locale.RELATIONSHIP.TYPE_DOESNT_EXIST, {socket: {emoji: await client.getEmoji(`692428969667985458`)} })
        //  Render confirmation
        const confirmation = await reply.send(locale.RELATIONSHIP.TARGET_CONFIRMATION, {
            prebuffer: true,
            image: await new GUI(targetUserData, relationship.name).build(),
            socket: {
                user: targetUser.master.username,
                mention: targetUser.master,
                relationship: relationship.name,
            }
        })
        await c.setup(targetUser.master.id, confirmation)
        c.onAccept(() => {
            //  Update relationship data on both side
            client.db.setUserRelationship(message.author.id, targetUser.master.id, parseInt(relationship.relationship_id))
            client.db.setUserRelationship(targetUser.master.id, message.author.id, parseInt(relationship.relationship_id))
            return reply.send(``, {customHeader: [`${targetUser.master.username} has accepted your relationship request!`, targetUser.master.displayAvatarURL()]})
        })
    },

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
