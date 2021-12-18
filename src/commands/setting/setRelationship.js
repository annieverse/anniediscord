const User = require(`../../libs/user`)
const Confirmator = require(`../../libs/confirmator`)
const relationshipPairs = require(`../../config/relationshipPairs.json`)
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
            header: `Hi, ${message.author.username}!`,
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
        const userData = await userLib.requestMetadata(message.author, 2)
        const userRels = userData.relationships.map(node => node.assigned_user_id)
        const targetUser = await userLib.lookFor(arg, useRemoveAction ? await this.fetchLocalPool(userRels, client) : null)
        if (!targetUser) return reply.send(locale.USER.IS_INVALID)
        //  Handle if target is the author
        if (userLib.isSelf(targetUser.master.id)) return reply.send(locale.RELATIONSHIP.SET_TO_SELF, {socket: {emoji: await client.getEmoji(`751016612248682546`)} })
        const targetUserData = await userLib.requestMetadata(targetUser.master, 2)
		//  Handle delete action	
        const c = new Confirmator(message, reply)
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
            return c.onAccept(() => {
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
        arg = arg.replace(targetUser.usedKeyword+` `, ``)
        //  Handle if the specified relationship cannot be found
        let searchStringResult = stringSimilarity.findBestMatch(arg, availableRelationships.map(i => i.name))
        const relationship = searchStringResult.bestMatch.rating >= 0.3 ? availableRelationships.filter(i => i.name === searchStringResult.bestMatch.target)[0] : null
        if (!relationship) return reply.send(locale.RELATIONSHIP.TYPE_DOESNT_EXIST, {socket: {emoji: await client.getEmoji(`692428969667985458`)} })
        const targetGender = await client.db.getUserGender(targetUser.master.id)
        const relRole = targetGender ? relationshipPairs[targetGender.gender][relationship.name] : relationship.name
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
        c.onAccept(async () => {
            //  Update relationship data on both side
            const authorRelationshipStatus = relationshipPairs.MASTER_PAIR[relationship.name]
            const authorRelationship = await client.db.getRelationship(authorRelationshipStatus)
            client.db.setUserRelationship(message.author.id, targetUser.master.id, parseInt(authorRelationship.relationship_id))
            client.db.setUserRelationship(targetUser.master.id, message.author.id, parseInt(relationship.relationship_id))
            await reply.send(``, {customHeader: [`${targetUser.master.username} has accepted your relationship request!`, targetUser.master.displayAvatarURL()]})
            return reply.send(locale.RELATIONSHIP.TIPS_AFTER_REGISTER, {
                simplified: true,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`848521358236319796`)
                }
            })
        })
    },

    /**
     * Fetching user's object for given list of ID.
     * @param {object} ids
     * @param {object} client Current client instance.
     * @return {object}
     */
    async fetchLocalPool(ids, client) {
        let res = []
        for (let i=0; i<ids.length; i++) {
            try {
                res.push(await client.users.fetch(ids[i]))
            }
            catch(e) {
                //  Fallback incase users aren't in range.
                res.push({id: ids[i], name: `Unreachable`})
            }
        }
        return res
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
            str += `╰☆～(${rel.relationship_id}) **${rel.name.split(` `).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(` `)}**\n`
        }
        return str
    }
}
