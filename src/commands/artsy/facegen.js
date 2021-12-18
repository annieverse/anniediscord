/**
 * AI-Generated Anime Face provided by Gwern@TWDNE
 * @author klerikdust
 */
module.exports = {
    name: `facegen`,
	aliases: [`facegen`, `anigen`, `waifugen`, `wfgen`, `fcgen`, `waifu`, `generatewaifu`],
	description: `AI-Generated Anime Face provided by Gwern@TWDNE`,
	usage: `facegen`,
    permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
        const source = `https://www.thiswaifudoesnotexist.net/`
        const getID = Math.floor(Math.random() * 100000)
        const fetching = await reply.send(locale.FACEGEN.FETCHING, {
            simplified: true, 
            socket: {
                emoji: await client.getEmoji(`790994076257353779`)
            } 
        })
        await reply.send(locale.FACEGEN.HEADER, {
            customHeader: [message.author.username, message.author.displayAvatarURL()],
            image: source + `example-${getID}.jpg`,
            prebuffer: true
        })
        fetching.delete()
    }   
}
