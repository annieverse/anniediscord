const PixivApi = require(`pixiv-api-client`)
const PixImg = require(`pixiv-img`)
const pixiv = new PixivApi()
/**
 * Main module
 * @Pixiv fetching image from pixiv.
 */
 
class Pixiv {
	constructor(Stacks) {
        this.stacks = Stacks
        this.choice = Stacks.choice
        this.args = Stacks.fullArgs
    }
    

    /**
     * Required for authentication
     * @param {String} username 
     * @param {String} pw 
     */
    async login(username, pw) {
        await pixiv.login(username, pw)
        return true
    }


    /**
     * Fetch artworks by custom search/filter. Returns object of choosen index.
     * @param {String} filter 
     */
    async fetchCustomSearch(filter = ``) {
        const res = pixiv.searchIllust(filter)
        return this.choice(res.illusts)
    }


    /**
     * Fetch artworks by recommended result. Returns object of choosen index.
     */
    async fetchRecommendedWork() {
        const res = await pixiv.illustRecommended()
        return this.choice(res.illusts)
    }


	async execute() {
        const { reply, loadPixivCaches } = this.stacks
        
        //  Logging in to get access to the Pixiv API
        await this.login('leizha.naphzter074@gmail.com', 'whitecookie007')

        reply(`fetching pixiv result...`)
            .then(async loadmsg => {
            //  Dynamically choose recommended/custom search based on input
            const data = !this.args ? await this.fetchRecommendedWork() : await this.fetchCustomSearch(this.args)
            reply(data.caption, {
                customHeader: [data.user.name, data.user.profile_image_urls.medium],
                prebuffer: true,
                image: await loadPixivCaches(await PixImg(data.image_urls.large))
            })
            return loadmsg.delete()
        })
	}
}


module.exports.help = {
	start: Pixiv,
	name: `pixiv`,
	aliases: [`pix`, `pxv`, `pixiv`],
	description: `Gives bot's ping`,
	usage: `ping`,
	group: `Server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}