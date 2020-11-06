const Command = require(`../../libs/commands`)
const moment = require(`moment`)
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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, commanifier, emoji, avatar, name, bot:{db} }) {
		await this.requestUserMetadata(2)
		const quests = await db.getAllQuests()
		//  Handle if no quests are available to take
		if (!quests.length) return reply(this.locale.QUEST.EMPTY, {status: `warn`})
		const now = moment()
		const lastClaimAt = await db.toLocaltime(this.user.quests.updated_at)
		//  Handle if user's quest queue still in cooldown
		if (now.diff(lastClaimAt, this.cooldown[1]) < this.cooldown[0]) return reply(this.locale.QUEST.COOLDOWN, {
			socket: {time:  moment(lastClaimAt).add(...this.cooldown).fromNow()},
			color: `red`
		})
		this.fetching = await reply(this.locale.QUEST.FETCHING, {simplified: true, socket:{emoji: emoji(`AAUloading`)} })
		//  Update ID if active quest couldn't be found with the saved quest_id
		let nextQuestId = this.user.quests.next_quest_id
		if (!nextQuestId) {
			//  Make sure the quest_id index not fall below the threeshold
			nextQuestId = Math.floor(Math.random() * quests.length) || 1
			await db.updateUserNextActiveQuest(this.user.id, this.message.guild.id, nextQuestId)
		}
		let activeQuest = quests.find(node => node.quest_id === nextQuestId)
		this.quest = await reply(this.locale.QUEST.DISPLAY, {
			header: activeQuest.name,
			color: `crimson`,
			footer: this.locale.QUEST.FOOTER,
			thumbnail: avatar(this.user.id),
			socket: {
				description: activeQuest.description,
				reward: `${emoji(`artcoins`)}${activeQuest.reward_amount}`
			}
		})
		this.fetching.delete()
		this.setSequence(3)
		this.sequence.on(`collect`, async msg => {
			let answer = msg.content.toLowerCase()
			//  Handle if the answer is incorrect
			if (answer !== activeQuest.correct_answer) {
				reply(this.locale.QUEST.INCORRECT_ANSWER, {status: `warn`, deleteIn: 3})
				return
			}
			msg.delete()
			//  Update reward, user quest data and store activity to quest_log activity
			await db.updateInventory({itemId: 52, value: activeQuest.reward_amount, guildId: this.message.guild.id, userId: this.user.id})
			await db.updateUserQuest(this.user.id, this.message.guild.id, Math.floor(Math.random() * quests.length) || 1)
			await db.recordQuestActivity(nextQuestId, this.user.id, this.message.guild.id, answer)
			//  Successful
			return reply(this.locale.QUEST.SUCCESSFUL, {
				status: `success`,
				socket: {
					user: name(this.user.id),
					reward: `${emoji(`artcoins`)}${commanifier(activeQuest.reward_amount)}`
				}
			})
		})
	}
}

module.exports.help = {
	start: Quests,
	name: `quests`,
	aliases: [`quest`, `quests`, `qst`, `artquests`, `artquest`],
	description: `Displaying list of daily quests that you can accomplish and wins artcoins! the quest will be available once every 2 hours`,
	usage: `quest`,
	group: `User`,
	permissionLevel: 0,
}