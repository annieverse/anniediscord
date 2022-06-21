const commanifier = require(`../../utils/commanifier`)
const Confirmator = require(`../../libs/confirmator`)
    /**
     * Registering new quest into the database.
     * @author klerikdust
     */
module.exports = {
    name: `registerQuest`,
    aliases: [`registerquest`, `rq`],
    description: `Registering new quest into the database`,
    usage: `<name> | <rewardAmount> | <description> | <correctAnswer>`,
    permissionLevel: 4,
    applicationCommand: false,
    async execute(client, reply, message, arg, locale) {
        //  Handle if user doesn't specify any arg
        if (!arg) return reply.send(`Any quest you want me to register?`)
        const [name, reward, description, correctAnswer] = arg.split(` | `)
        const confirmation = await reply.send(`You are going to register the following quest.\n**NAME::** ${name}\n**DESCRIPTION::** ${description}\n**REWARD:: **${commanifier(reward)}\n**CORRECT_ANSWER::** ${correctAnswer}`)
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        return c.onAccept(() => {
            client.db._query(`
				INSERT INTO quests(
					reward_amount,
					name,
					description,
					correct_answer
				)
				VALUES(?, ?, ?, ?)`, `run`, [parseInt(reward), name, description, correctAnswer], `Registered new quest`)
            reply.send(`Quest successfully registered!`)
        })
    }
}