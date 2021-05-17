const Command = require(`../../libs/commands`)
const moment = require(`moment`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Displaying list of quests that you can accomplish and wins artcoins! 
 * You can take quest every 2 hours.
 * @author klerikdust
 */
class Quests extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		/**
		 * Cooling down interval before user able to get the next quest.
		 * @type {array}
		 */
		this.cooldown = [2, `hours`]
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
		await this.requestUserMetadata(2)
		const quests = await this.bot.db.getAllQuests()
		if (!quests.length) return this.reply(this.locale.QUEST.EMPTY)
        const questIdsPool = quests.map(q => q.quest_id)
		const now = moment()
		const lastClaimAt = await this.bot.db.toLocaltime(this.user.quests.updated_at)
		//  Handle if user's quest queue still in cooldown
		if (now.diff(lastClaimAt, this.cooldown[1]) < this.cooldown[0]) return this.reply(this.locale.QUEST.COOLDOWN, {
			topNotch: `**Shall we do something else first?** ${await this.bot.getEmoji(`692428969667985458`)}`,
			thumbnail: this.user.master.displayAvatarURL(),
			socket: {
				time: moment(lastClaimAt).add(...this.cooldown).fromNow(),
				prefix: this.bot.prefix
			},
		})
        //  Handle if user already took the quest earlier ago. Purposely made to avoid spam abuse.
		const sessionID = `QUEST_SESSION_${this.message.author.id}@${this.message.guild.id}`
		if (await this.bot.db.redis.exists(sessionID)) return this.reply(this.locale.QUEST.SESSION_STILL_RUNNING, {socket: {emoji: await this.bot.getEmoji(`692428748838010970`)}})
        //  Session up for 2 minutes
        this.bot.db.redis.set(sessionID, 1, `EX`, 60 * 2)
		const fetching = await this.reply(this.locale.QUEST.FETCHING, {simplified: true, socket:{emoji: await this.bot.getEmoji(`790994076257353779`)} })
		//  Update ID if active quest couldn't be found with the saved quest_id
		let nextQuestId = this.user.quests.next_quest_id
		if (!nextQuestId) {
			nextQuestId = questIdsPool[Math.floor(Math.random() * questIdsPool.length)]
			this.bot.db.updateUserNextActiveQuest(this.user.master.id, this.message.guild.id, nextQuestId)
		}
		let activeQuest = quests.find(node => node.quest_id === nextQuestId)
		const quest = await this.reply(this.locale.QUEST.DISPLAY, {
			header: `${this.user.master.username} is taking a quest!`,
			footer: this.locale.QUEST.FOOTER,
			thumbnail: this.user.master.displayAvatarURL(),
			socket: {
				questTitle: activeQuest.name,
				description: activeQuest.description,
				reward: `${await this.bot.getEmoji(`758720612087627787`)}${commanifier(activeQuest.reward_amount)}`
			}
		})
		fetching.delete()
		this.setSequence(10)
		this.sequence.on(`collect`, async msg => {
			let answer = msg.content.toLowerCase()
            if (answer.startsWith((this.bot.prefix))) answer = answer.slice(1)
			// Handle if user asked to cancel the quest
			if ([`cancel`].includes(answer)) {
				this.reply(this.locale.QUEST.CANCEL)
				msg.delete().catch(e => this.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${this.guild.id} > ${e.stack}`))
				this.quest.delete()
				this.bot.db.redis.del(sessionID)
				return this.endSequence()
			}
			//  Handle if the answer is incorrect
			if (answer !== activeQuest.correct_answer) return this.reply(this.locale.QUEST.INCORRECT_ANSWER, {deleteIn: 3})
			this.endSequence()
			msg.delete().catch(e => this.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${this.guild.id} > ${e.stack}`))
			//  Update reward, user quest data and store activity to quest_log activity
			this.bot.db.updateInventory({itemId: 52, value: activeQuest.reward_amount, guildId: this.message.guild.id, userId: this.user.master.id})
			this.bot.db.updateUserQuest(this.user.master.id, this.message.guild.id, Math.floor(Math.random() * quests.length) || 1)
			this.bot.db.recordQuestActivity(nextQuestId, this.user.master.id, this.message.guild.id, answer)
			//  Successful
			this.bot.db.redis.del(sessionID)
			return this.reply(this.locale.QUEST.SUCCESSFUL, {
				socket: {
					praise: this.locale.QUEST.PRAISE[Math.floor(Math.random() * this.locale.QUEST.PRAISE.length)],
					user: this.user.master.username,
					reward: `${await this.bot.getEmoji(`758720612087627787`)}${commanifier(activeQuest.reward_amount)}`
				}
			})
		})
	}
}

module.exports.help = {
	start: Quests,
	name: `quests`,
	aliases: [`quest`, `quests`, `qst`, `artquests`, `artquest`, `q`],
	description: `Displaying list of daily quests that you can accomplish and wins artcoins! the quest will be available once every 2 hours`,
	usage: `quest`,
	group: `User`,
	permissionLevel: 0,
}
