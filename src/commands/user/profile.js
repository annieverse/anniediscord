const profile = require(`../../struct/gui/profile`)
const portfolio = require(`../../struct/gui/portfolio`)
const badge = require(`../../struct/gui/badges`)
const family = require(`../../struct/gui/families`)
const friend = require(`../../struct/gui/friends`)
const stat = require(`../../struct/gui/stats`)
const databaseManager = require(`../../libs/database`)

class Profile {
	constructor(Stacks) {
		this.stacks = Stacks
	}

	//          WORKING ON NEW SHOP INTERFACE
	/**
     *  Initialzer method
     */
	async execute() {
		const {message, command, reply, name, emoji, code: {PROFILECARD, PORTFOLIOCARD, BADGECARD, RELATIONSHIPCARD, STATCARD}, meta: {author, data} } = this.stacks

        const collection = new databaseManager(data.userId)
        const userartworks = await collection.userArtworks()
        const badgesdata = await collection.badges
        delete badgesdata.userId
        const key = Object.values(badgesdata).filter(e => e)
        const relations = await collection.relationships
        const familyrelations = relations.filter((e) => {
            if (e.theirRelation == `bestie`) return false
            if (e.theirRelation == `soulmate`) return false
            if (e.theirRelation == `senpai`) return false
            if (e.theirRelation == `kouhai`) return false
            return true
        })
        const friendrelations = relations.filter((e) => {
            if (e.theirRelation == `bestie`) return true
            if (e.theirRelation == `soulmate`) return true
            if (e.theirRelation == `senpai`) return true
            if (e.theirRelation == `kouhai`) return true
            return false
        })

        /*Don't add empty pages*/
        var pages = [{gui: profile, card: PROFILECARD, alias: `profile`}]
        if (userartworks) {
            pages.push({gui: portfolio, card: PORTFOLIOCARD, alias: `portfolio`})
        }
        if (key.length > 0 && key[0] != null) {
            pages.push({gui: badge, card: BADGECARD, alias: `badge`})
        }
        if (familyrelations.length > 0) {
            pages.push({gui: family, card: RELATIONSHIPCARD, alias: `family`})
        }
        if (friendrelations.length > 0) {
            pages.push({gui: friend, card: RELATIONSHIPCARD, alias: `friend`})
        }
        pages.push({gui: stat, card: STATCARD, alias: `stat`})

        let count = 0
        //  Returns if user is invalid or lvl too low
        switch (command) {
            case `timeline`:
            case `portfolio`:
                if (!author) return reply(PORTFOLIOCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `portfolio`)
                break
            case `badges`:
            case `badge`:
                if (!author) return reply(BADGECARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `badge`)
                break
            case `family`:
                if (!author) return reply(RELATIONSHIPCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `family`)
                break
            case `friend`:
            case `friends`:
                if (!author) return reply(RELATIONSHIPCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `friend`)
                break
            case `stats`:
            case `stat`:
                if (!author) return reply(STATCARD.INVALID_USER)
                count = pages.findIndex((e) => e.alias == `stat`)
                break
        default:
            if (!author) return reply(PROFILECARD.INVALID_USER)
        }

        const getPage = async (ctr) => {
            if (!pages[ctr]) return reply (`Couldn't find that card. It's probably empty.`)

            reply(`${emoji(`AAUloading`)} resolving ${pages[ctr].alias} data with ID ${author.id}`, {simplified: true})
            .then(async load => {
                reply(pages[ctr].card.HEADER, {
                    socket: [name(author.id)],
                    image: await pages[ctr].gui(this.stacks, author),
                    prebuffer: true,
                    simplified: true })
                .then(msg => {
                    msg.react(`⏪`).then(() => {
                        msg.react(`⏩`)
                        const backwardsFilter = (reaction, user) => (reaction.emoji.name === `⏪`) && (user.id === message.author.id)
                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === `⏩`) && (user.id === message.author.id)
    
                        const backwards = msg.createReactionCollector(backwardsFilter, {time: 60000})
                        const forwards = msg.createReactionCollector(forwardsFilter, {time: 60000})
    
                        backwards.on(`collect`, async () => {
                            count--
                            if (count < 0) {
                                count = pages.length - 1
                            }
                            await msg.delete()
                            getPage(count)
    
                        })
                        forwards.on(`collect`, async () => {
                            count++
                            if (count > pages.length - 1) {
                                count = 0
                            }
                            await msg.delete()
                            getPage(count)
                        })
                        
                        load.delete()
                        setTimeout(() => {
                            if (!msg.deleted) msg.clearReactions()
                        }, 60000)
                    })
                })
            })
        }
		//  Display result
        getPage(count)
	}
}

module.exports.help = {
	start: Profile,
	name: `profile`,
	aliases: [`profile`, `p`, `mycard`, `timeline`, `portfolio`, `badges`, `badge`, `family`, `friend`, `friends`, `stats`, `stat`],
	description: `Display user's profile card, including timeline, badges, relationship, and statistics`,
	usage: `profile [@user]<optional>`,
	group: `General`,
	public: true,
	required_usermetadata: true,
	multi_user: true
}