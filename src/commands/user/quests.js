const moment = require(`moment`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Displaying list of quests that you can accomplish and wins artcoins! 
 * You can take quest every 2 hours.
 * @author klerikdust
 */
module.exports = {
    name: `quests`,
	aliases: [`quest`, `quests`, `qst`, `artquests`, `artquest`, `q`],
	description: `Displaying quest that you can complete and wins artcoins! the quest will be available once every 2 hours`,
	usage: `quest`,
	permissionLevel: 0,
    cooldown: [2, `hours`],
    async execute(client, reply, message, arg, locale) {
		const quests = await client.db.getAllQuests()
		if (!quests.length) return reply.send(locale.QUEST.EMPTY)
        const userData = await (new User(client, message)).requestMetadata(message.author, 2)
        const questIdsPool = quests.map(q => q.quest_id)
		const now = moment()
		const lastClaimAt = await client.db.toLocaltime(userData.quests.updated_at)
		//  Handle if user's quest queue still in cooldown
		if (now.diff(lastClaimAt, this.cooldown[1]) < this.cooldown[0]) return reply.send(locale.QUEST.COOLDOWN, {
			topNotch: `**Shall we do something else first?** ${await client.getEmoji(`692428969667985458`)}`,
			thumbnail: message.author.displayAvatarURL(),
			socket: {
				time: moment(lastClaimAt).add(...this.cooldown).fromNow(),
				prefix: client.prefix
			},
		})
        //  Handle if user already took the quest earlier ago. Purposely made to avoid spam abuse.
		const sessionID = `QUEST_SESSION_${message.author.id}@${message.guild.id}`
		if (await client.db.redis.exists(sessionID)) return reply.send(locale.QUEST.SESSION_STILL_RUNNING, {socket: {emoji: await client.getEmoji(`692428748838010970`)}})
        //  Session up for 2 minutes
        client.db.redis.set(sessionID, 1, `EX`, 60 * 2)
		const fetching = await reply.send(locale.QUEST.FETCHING, {simplified: true, socket:{emoji: await client.getEmoji(`790994076257353779`)} })
		//  Update ID if active quest couldn't be found with the saved quest_id
		let nextQuestId = userData.quests.next_quest_id
		if (!nextQuestId) {
			nextQuestId = questIdsPool[Math.floor(Math.random() * questIdsPool.length)]
			client.db.updateUserNextActiveQuest(message.author.id, message.guild.id, nextQuestId)
		}
		let activeQuest = quests.find(node => node.quest_id === nextQuestId)
		const quest = await reply.send(locale.QUEST.DISPLAY, {
			header: `${message.author.username} is taking a quest!`,
			footer: locale.QUEST.FOOTER,
			thumbnail: message.author.displayAvatarURL(),
			socket: {
				questTitle: activeQuest.name,
				description: activeQuest.description,
				reward: `${await client.getEmoji(`758720612087627787`)}${commanifier(activeQuest.reward_amount)}`
			}
		})
		fetching.delete()
        //  Prepare answer collectors
        const collector = message.channel.createMessageCollector(
        m => m.author.id === message.author.id, {
            max: 10,
            time: 120000
        })
		collector.on(`collect`, async msg => {
			let answer = msg.content.toLowerCase()
            if (answer.startsWith((client.prefix))) answer = answer.slice(1)
			// Handle if user asked to cancel the quest
			if ([`cancel`].includes(answer)) {
				reply.send(locale.QUEST.CANCEL)
				msg.delete().catch(e => client.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${message.guild.id} > ${e.stack}`))
				quest.delete()
				client.db.redis.del(sessionID)
                return collector.stop()
			}
			//  Handle if the answer is incorrect
			if (answer !== activeQuest.correct_answer) return reply.send(locale.QUEST.INCORRECT_ANSWER, {deleteIn: 3})
            collector.stop()
			msg.delete().catch(e => client.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${message.guild.id} > ${e.stack}`))
			//  Update reward, user quest data and store activity to quest_log activity
			client.db.updateInventory({itemId: 52, value: activeQuest.reward_amount, guildId: message.guild.id, userId: message.author.id})
			client.db.updateUserQuest(message.author.id, message.guild.id, Math.floor(Math.random() * quests.length) || 1)
			client.db.recordQuestActivity(nextQuestId, message.author.id, message.guild.id, answer)
			//  Successful
			client.db.redis.del(sessionID)
			return reply.send(locale.QUEST.SUCCESSFUL, {
				socket: {
					praise: locale.QUEST.PRAISE[Math.floor(Math.random() * locale.QUEST.PRAISE.length)],
					user: message.author.username,
					reward: `${await client.getEmoji(`758720612087627787`)}${commanifier(activeQuest.reward_amount)}`
				}
			})
		})
    } 
}
