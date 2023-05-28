"use strict"
const { ApplicationCommandType, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require(`discord.js`)
const Quest = require(`../../libs/quests`)
/**
 * Displaying list of quests that you can accomplish and wins artcoins! 
 * You can take quest every 2 hours.
 * @author klerikdust and Pan
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
		const user = message.member.user
		const sessionID = `QUEST_SESSION_${user.id}@${message.guild.id}`
		const questSession = new Quest(client, reply)
		await questSession.start(sessionID, user, locale, message)
		if (questSession.getSessionActive) return 
		if (!questSession.getQuestAvailable) return 
		const fetching = await reply.send(locale.QUEST.FETCHING, { simplified: true, socket: { emoji: await client.getEmoji(`790994076257353779`) } })
		const quest = await reply.send(locale.QUEST.DISPLAY, {
			header: `${user.username} is taking a quest!`,
			footer: locale.QUEST.FOOTER,
			thumbnail: user.displayAvatarURL(),
			socket: {
				questTitle: questSession.getQuestTitle,
				description: questSession.getQuestDescription,
				reward: questSession.getQuestFormattedReward
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
			questSession.testAnswer(msg.content)
			if ([`cancel`].includes(questSession.userAnswer)) {
				await reply.send(locale.QUEST.CANCEL)
				msg.delete().catch(e => client.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${message.guild.id} > ${e.stack}`))
				quest.delete()
				questSession.cancelSession()
				return collector.stop()
			}
			//  Handle if the answer is incorrect
			if (questSession.getAnswerIsCorrect===false) return await reply.send(locale.QUEST.INCORRECT_ANSWER, { deleteIn: 3 })
			collector.stop()
			msg.delete().catch(e => client.logger.warn(`fail to delete quest-answer due to lack of permission in GUILD_ID:${message.guild.id} > ${e.stack}`))
			questSession.updateRewards()
			return await reply.send(locale.QUEST.SUCCESSFUL, {
				socket: {
					praise: locale.QUEST.PRAISE[Math.floor(Math.random() * locale.QUEST.PRAISE.length)],
					user: message.author.username,
					reward: questSession.getQuestFormattedReward
				}
			})
		})
	},
	async Iexecute(client, reply, interaction, options, locale) {
		const user = interaction.member.user
		const sessionID = `QUEST_SESSION_${user.id}@${interaction.guild.id}`
		
		const questSession = new Quest(client, reply)
		await questSession.start(sessionID, user, locale, interaction)
		if (questSession.getSessionActive) return 
		if (!questSession.getQuestAvailable) return 

		const buttonCustomId = `${questSession.getSessionId}answer`
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
			header: `${user.username} is taking a quest!`,
			footer: locale.QUEST.FOOTER + `\n10 tries total`,
			thumbnail: user.displayAvatarURL(),
			socket: {
				questTitle: questSession.getQuestTitle,
				description: questSession.getQuestDescription,
				reward: questSession.getQuestFormattedReward
			},
			components: row
		})
		const filter = interaction => (interaction.customId === buttonCustomId || interaction.customId === `cancelQuest`) && interaction.user.id === user.id
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
				questSession.cancelSession()
				await reply.send(`Your quest time has expired, no worries though just excute the quest command again to pick up where you left off`, { ephemeral: true, followUp: true })
			} catch (error) {
				client.logger.error(`[Quests.js]\n${error}`)
			}
		})
		buttonCollector.on(`collect`, async i => {
			// Handle if user asked to cancel the quest
			if (i.customId === `cancelQuest`) {
				i.update({ embeds: [await reply.send(locale.QUEST.CANCEL, { raw: true })], components: [] })
				questSession.cancelSession()
				return buttonCollector.stop()
			}
			const modalId = `${questSession.getSessionId}-${i.id}`
			const modal = new ModalBuilder()
				.setCustomId(modalId)
				.setTitle(questSession.getQuestTitle)

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
			questSession.testAnswer(answer)

			const message = await i.fetchReply()
			//  Handle if the answer is incorrect
			if (questSession.getAnswerIsCorrect===false) {
				answerAttempt++
				if (answerAttempt > 10) {
					message.edit({ components: [] })
					return buttonCollector.stop()
				}
				buttonCollector.resetTimer({ time: 30000 })
				return await reply.send(locale.QUEST.INCORRECT_ANSWER, { deleteIn: 3, followUp: true })
			}
			buttonCollector.stop()
			questSession.updateRewards()
			message.edit({ components: [] })
			return await reply.send(locale.QUEST.SUCCESSFUL, {
				socket: {
					praise: locale.QUEST.PRAISE[Math.floor(Math.random() * locale.QUEST.PRAISE.length)],
					user: user.username,
					reward: questSession.getQuestFormattedReward
				},
				followUp: true
			})
		})
	}
}