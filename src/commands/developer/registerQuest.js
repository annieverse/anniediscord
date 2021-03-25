const Command = require(`../../libs/commands`)

/**
 * Registering new quest into the database.
 * @author klerikdust
 */
class RegisterQuest extends Command {

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
	async execute({ reply, bot:{db}, commanifier }) {
		//  Handle if user doesn't specify any arg
		if (!this.fullArgs) return reply(`Any quest you want me to register?`)
		const [name, reward, description, correctAnswer] = this.fullArgs.split(` | `)
		const confirmation = await reply(`You are going to register the following quest.\n**NAME::** ${name}\n**DESCRIPTION::** ${description}\n**REWARD:: **${commanifier(reward)}\n**CORRECT_ANSWER::** ${correctAnswer}`)
		await this.addConfirmationButton(`register_quest`, confirmation)
 		return this.confirmationButtons.get(`register_quest`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
			await db._query(`
				INSERT INTO quests(
					reward_amount,
					name,
					description,
					correct_answer
				)
				VALUES(?, ?, ?, ?)`
				, `run`
				, [parseInt(reward), name, description, correctAnswer]
				, `Registered new quest`
			)
 			this.finalizeConfirmation(r)
 			reply(`Quest successfully registered!`)
 		})
	}
}

module.exports.help = {
	start: RegisterQuest,
	name: `registerQuest`,
	aliases: [`registerquest`, `rq`],
	description: `Registering new quest into the database`,
	usage: `<name> | <rewardAmount> | <description> | <correctAnswer>`,
	group: `Developer`,
	permissionLevel: 4
}
