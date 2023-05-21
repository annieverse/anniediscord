const moment = require(`moment`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const { ApplicationCommandType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require(`discord.js`)
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
	multiUser: false,
	applicationCommand: true,
	messageCommand: true,
	type: ApplicationCommandType.ChatInput,
	cooldown: [2, `hours`],
	async execute(client, reply, message, arg, locale) {
		const questMetadata = await this.getQuestMetadata(client, reply, message, locale)
		if (questMetadata===false) return
		const questlang = this.getLangQuest(questMetadata.questData[locale.currentLang],questMetadata.questData)
		const questIdKey = questlang[questMetadata.activeQuest.quest_id]

		const fetching = await reply.send(locale.QUEST.FETCHING, { simplified: true, socket: { emoji: await client.getEmoji(`790994076257353779`) } })
		const quest = await reply.send(locale.QUEST.DISPLAY, {
			header: `${message.author.username} is taking a quest!`,
			footer: locale.QUEST.FOOTER,
			thumbnail: message.author.displayAvatarURL(),
			socket: {
				questTitle: this.getLangQuestProp(questlang,questMetadata.questData,questMetadata.activeQuest.quest_id,`name`),
				description: this.getLangQuestProp(questlang,questMetadata.questData,questMetadata.activeQuest.quest_id,`description`),
				reward: `${await client.getEmoji(`758720612087627787`)}${commanifier(questMetadata.activeQuest.reward_amount)}`
			}
		})
		fetching.delete()
		//  Prepare answer collectors
		const collector = message.channel.createMessageCollector({
			filter: m => m.author.id === message.author.id,
			max: 10,
			time: 120000
		})
		collector.on(`collect`, async msg => {
			let answer = msg.content.toLowerCase()
			if (answer.startsWith((client.prefix))) answer = answer.slice(1)
			// Handle if user asked to cancel the quest
			if ([`cancel`].includes(answer)) {
				await reply.send(locale.QUEST.CANCEL)
				msg.delete().catch(e => client.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${message.guild.id} > ${e.stack}`))
				quest.delete()
				client.db.redis.del(questMetadata.sessionID)
				return collector.stop()
			}
			//  Handle if the answer is incorrect
			if (answer !== questIdKey.answer) return await reply.send(locale.QUEST.INCORRECT_ANSWER, { deleteIn: 3 })
			collector.stop()
			msg.delete().catch(e => client.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${message.guild.id} > ${e.stack}`))
			//  Update reward, user quest data and store activity to quest_log activity
			client.db.databaseUtils.updateInventory({ itemId: 52, value: questMetadata.activeQuest.reward_amount, guildId: message.guild.id, userId: message.author.id })
			client.db.quests.updateUserNextActiveQuest(message.author.id, message.guild.id, Math.floor(Math.random() * questMetadata.quests.length) || 1)
			client.db.quests.recordQuestActivity(questMetadata.nextQuestId, message.author.id, message.guild.id, answer)
			//  Successful
			client.db.redis.del(questMetadata.sessionID)
			return await reply.send(locale.QUEST.SUCCESSFUL, {
				socket: {
					praise: locale.QUEST.PRAISE[Math.floor(Math.random() * locale.QUEST.PRAISE.length)],
					user: message.author.username,
					reward: `${await client.getEmoji(`758720612087627787`)}${commanifier(questMetadata.activeQuest.reward_amount)}`
				}
			})
		})
	},
	async Iexecute(client, reply, interaction, options, locale) {
		const questMetadata = await this.getQuestMetadata(client, reply, interaction, locale)
		if (questMetadata===false) return
		
		const questlang = this.getLangQuest(questMetadata.questData[locale.currentLang],questMetadata.questData)
		const questIdKey = questlang[questMetadata.activeQuest.quest_id]

		const buttonCustomId = questMetadata.sessionID + `answer`
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(buttonCustomId)
					.setLabel(`Answer`)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(`cancelQuest`)
					.setLabel(`Cancel`)
					.setStyle(ButtonStyle.Secondary)
			)
		const quest = await reply.send(locale.QUEST.DISPLAY, {
			header: `${interaction.member.user.username} is taking a quest!`,
			footer: locale.QUEST.FOOTER + `\n10 tries total`,
			thumbnail: interaction.member.user.displayAvatarURL(),
			socket: {
				questTitle: this.getLangQuestProp(questlang,questMetadata.questData,questMetadata.activeQuest.quest_id,`name`),
				description: this.getLangQuestProp(questlang,questMetadata.questData,questMetadata.activeQuest.quest_id,`description`),
				reward: `${await client.getEmoji(`758720612087627787`)}${commanifier(questMetadata.activeQuest.reward_amount)}`
			},
			components: row
		})
		const member = interaction.user.id
		const filter = interaction => (interaction.customId === buttonCustomId || interaction.customId === `cancelQuest`) && interaction.user.id === member
		const buttonCollector = quest.createMessageComponentCollector({ filter, time: 30000 })
		let answerAttempt = 0
		buttonCollector.on(`ignore`, async (i) => {
			i.reply({ content: `I'm sorry but only the user who sent this message may interact with it.`, ephemeral: true })
		})
		buttonCollector.on(`end`, async (collected, reason) => {
			if (reason != `time`) return
			const message = await interaction.fetchReply()
			try {
				message.edit({ components: [] })
				client.db.redis.del(questMetadata.sessionID)
				await reply.send(`Your quest time has expired, no worries though just excute the quest command again to pick up where you left off`, { ephemeral: true, followUp: true })
			} catch (error) {
				client.logger.error(`[Quests.js]\n${error}`)
			}
		})
		buttonCollector.on(`collect`, async i => {
			// Handle if user asked to cancel the quest
			if (i.customId === `cancelQuest`) {
				i.update({ embeds: [await reply.send(locale.QUEST.CANCEL, { raw: true })], components: [] })
				client.db.redis.del(questMetadata.sessionID)
				return buttonCollector.stop()
			}
			const modalId = questMetadata.sessionID + `-` + i.id
			const modal = new ModalBuilder()
				.setCustomId(modalId)
				.setTitle(questIdKey.name)

			const questAnswerInput = new TextInputBuilder()
				.setCustomId(`questAnswerInput`)
				// The label is the prompt the user sees for this input
				.setLabel(`answer`)
				// Short means only a single line of text
				.setStyle(TextInputStyle.Short)
				.setRequired(true)

			const firstActionRow = new ActionRowBuilder().addComponents(questAnswerInput)
			modal.addComponents(firstActionRow)

			buttonCollector.resetTimer({ time: 30000 })

			await i.showModal(modal)
			const filter = (interaction) => interaction.customId === modalId
			let rawAnswer
			try {
				rawAnswer = await interaction.awaitModalSubmit({ filter, time: 30000 })
			} catch (error) {
				client.logger.error(`Error has been handled\n${error}`)
			}
			if (!rawAnswer) return
			rawAnswer.deferUpdate()
			const answer = rawAnswer.fields.getTextInputValue(`questAnswerInput`).toLowerCase()
			const message = await i.fetchReply()
			//  Handle if the answer is incorrect
			if (answer !== questIdKey.answer) {
				answerAttempt++
				if (answerAttempt > 10) {
					message.edit({ components: [] })
					return buttonCollector.stop()
				}
				buttonCollector.resetTimer({ time: 30000 })
				return await reply.send(locale.QUEST.INCORRECT_ANSWER, { deleteIn: 3, followUp: true })
			}
			buttonCollector.stop()
			//  Update reward, user quest data and store activity to quest_log activity
			client.db.databaseUtils.updateInventory({ itemId: 52, value: questMetadata.activeQuest.reward_amount, guildId: interaction.guild.id, userId: interaction.member.id })
			client.db.quests.updateUserNextActiveQuest(interaction.member.id, interaction.guild.id, Math.floor(Math.random() * questMetadata.quests.length) || 1)
			client.db.quests.recordQuestActivity(questMetadata.nextQuestId, interaction.member.id, interaction.guild.id, answer)
			//  Successful
			client.db.redis.del(questMetadata.sessionID)
			message.edit({ components: [] })
			return await reply.send(locale.QUEST.SUCCESSFUL, {
				socket: {
					praise: locale.QUEST.PRAISE[Math.floor(Math.random() * locale.QUEST.PRAISE.length)],
					user: interaction.member.user.username,
					reward: `${await client.getEmoji(`758720612087627787`)}${commanifier(questMetadata.activeQuest.reward_amount)}`
				},
				followUp: true
			})
		})
	},
	async getQuestMetadata(client, reply, messageRef, locale) {
		//  Handle if user already took the quest earlier ago. Purposely made to avoid spam abuse.
		const sessionID = `QUEST_SESSION_${messageRef.member.user.id}@${messageRef.guild.id}`
		if (await client.db.redis.exists(sessionID)) {
			await reply.send(locale.QUEST.SESSION_STILL_RUNNING, { socket: { emoji: await client.getEmoji(`692428748838010970`) } })
			return false
		}
		//  Session up for 2 minutes
		client.db.redis.set(sessionID, 1, `EX`, 60 * 2)

		const quests = await client.db.quests.getAllQuests()
		if (!quests.length) {
			await reply.send(locale.QUEST.EMPTY)
			return false
		}
		const userData = await (new User(client, messageRef)).requestMetadata(messageRef.member.user, 2, locale)
		const questIdsPool = quests.map(q => q.quest_id)
		const now = moment()
		const lastClaimAt = await client.db.systemUtils.toLocaltime(userData.quests.updated_at)
		//  Handle if user's quest queue still in cooldown
		if (now.diff(lastClaimAt, this.cooldown[1]) < this.cooldown[0]) {
			await reply.send(locale.QUEST.COOLDOWN, {
				topNotch: `**Shall we do something else first?** ${await client.getEmoji(`692428969667985458`)}`,
				thumbnail: messageRef.member.user.displayAvatarURL(),
				socket: {
					time: moment(lastClaimAt).add(...this.cooldown).fromNow(),
					prefix: client.prefix
				},
			})
			return false
		}
		let nextQuestId = userData.quests.next_quest_id
		if (!nextQuestId) {
			nextQuestId = questIdsPool[Math.floor(Math.random() * questIdsPool.length)]
			client.db.quests.updateUserNextActiveQuest(messageRef.member.user.id, messageRef.guild.id, nextQuestId)
		}
		let activeQuest = quests.find(node => node.quest_id === nextQuestId)
		// Try to grab the correct language file, if it fails fallback to en
		let questData = {}
		questData.en = require(`./../../quests/en.json`)
		try {
			if (locale.currentLang != `en`) questData[locale.currentLang] = require(`./../../quests/${locale.currentLang}.json`)
		} catch (error) {
			client.logger.warn(`[quests.js] Could not load "${locale.currentLang}" lang for quests`)
		}
		return {activeQuest,questData,quests,nextQuestId,sessionID}
	},
	/**
	 * Try to return the correct property from the object and fall back to en if the locale isnt available
	 * @param {Object} lang 
	 * @param {Object} data 
	 * @returns 
	 */
	getLangQuest(lang,data){
		try {
			if (!lang) throw Error(`Quest lang not populated`)
		} catch (error) {
			return data.en
		}
		return lang
	},
	/**
	 * Try to return the correct property from the object and fall back to en if the locale isnt available
	 * @param {Object} lang 
	 * @param {Object} langSource 
	 * @param {Object} quest_id 
	 * @param {Object} prop 
	 * @returns 
	 */
	getLangQuestProp(lang,langSource, quest_id,prop){
		if (prop != `name` && prop != `description`) throw new TypeError(`[quest.js][getLangQuestProp] parmeter prop can only be "name" or "description"`)
		try {
			if (!questlang[quest_id][prop]) throw Error(`Quest lang prop not populated`)
		} catch (error) {
			return langSource.en[quest_id][prop]
		}
		return lang
	}
}