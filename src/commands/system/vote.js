/**
 * Upvote Annie and get the reward!
 * @author klerikdust
 */
module.exports = {
    name: `vote`,
	aliases: [`vote`, `vt`, `vot`, `votes`, `upvote`],
	description: `Upvote Annie and get the reward!`,
	usage: `vote`,
	permissionLevel: 0,
	page: `https://top.gg/bot/501461775821176832`,
    async execute(client, reply, message, arg, locale) {
        if (!client.dblApi) return reply.send(locale.VOTE.UNAVAILABLE)
		const voted = await client.dblApi.hasVoted(message.author.id)
		if (voted) return reply.send(locale.VOTE.IS_COOLDOWN, {
			socket: {
				page: `[write a review](${this.page})`,
				emoji: await client.getEmoji(`692428785571856404`)
			}
		})
		return reply.send(locale.VOTE.READY, {
			header: `Hi, ${message.author.username}`,
			image: `banner_votes`,
			socket: {
				emoji: await client.getEmoji(`692428927620087850`),
				url: `[Discord Bot List](${this.page}/vote)`
			}
		})
    }
}
