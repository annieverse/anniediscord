const PixivApi = require(`pixiv-api-client`)
const PixImg = require(`pixiv-img`)
const pixiv = new PixivApi()

/**
 * Note:
 * This module requires pixiv account (verified username and pw) in order to get acccess to the API.
 * So, make sure to put your account details inside .env file
 * 
 *  PIXIV_USERNAME = email
 *  PIXIV_PASS = account password
 * 
 * Main module
 * @Pixiv fetching image from pixiv.
 */
class Pixiv {
	constructor(Stacks) {
        this.stacks = Stacks
        this.choice = Stacks.choice
        this.args = Stacks.fullArgs
        this.CACHE_PATH = `./.pixivcaches/`
        this.loadCache = Stacks.loadPixivCaches
        this.moduleID = `${Stacks.meta.author.id}_PIXIV_SERVICE`
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
        const res = await pixiv.searchIllustPopularPreview(filter)
        return this.choice(res.illusts)
    }


    /**
     * Fetch artworks by popularity ranking. Returns object of choosen index.
     */
    async fetchRecommendedWork() {
        const res = await pixiv.illustRanking()
        return this.choice(res.illusts)
    }

    
    /**
     * Loading image from pixiv cache directory. (downloaded pixiv's image)
     * @param {String|URL} url 
     * @param {String|ID} filename 
     */
    async getImage(url = String, filename = String) {
        return this.loadCache(await PixImg(url, `${this.CACHE_PATH + filename}.jpg`))
    }


    /**
     * Map `name` prop from Pixiv's tags object. Returns a proper string of hashtags.
     * @param {ArrayOfObject} tags 
     */
    getHashtags(tags = Array) {
        let arr = tags.map(key => `#${key.name}`)
        let str = ``
        for (let el of arr) {
           str += `${el} `
        }
        return str
    } 


	async execute() {
        const { reply, code:{PIXIV}, isCooldown, setCooldown } = this.stacks

        if (await isCooldown(this.moduleID)) return reply(`Please wait a moment until your next request.`)
        setCooldown(this.moduleID)

        //  Logging in to get access to the Pixiv API
        await this.login(process.env.PIXIV_USERNAME, process.env.PIXIV_PASS)

        reply(PIXIV[this.args ? `DISPLAY_CUSTOM_SEARCH` : `DISPLAY_RECOMMENDED_WORK`], {
            simplified: true,
            socket: [this.args]})
                .then(async loadmsg => {
                    //  Dynamically choose recommended/custom search based on input
                    const data = !this.args ? await this.fetchRecommendedWork() : await this.fetchCustomSearch(this.args)

                    //  Handle if no returned result from the query
                    if (!data)  {
                        loadmsg.delete()
                        return reply(PIXIV.NO_RESULT, {color: `red`})
                    }

                    reply(this.getHashtags(data.tags), {
                        customHeader: [`by ${data.user.name}`, data.user.profile_image_urls.medium],
                        image: await this.getImage(data.image_urls.medium, data.id),
                        prebuffer: true
                    })
                    loadmsg.delete()
            })
	    }
}


module.exports.help = {
	start: Pixiv,
	name: `pixiv`,
	aliases: [`pix`, `pxv`, `pixiv`],
	description: `Fetching image from pixiv.`,
	usage: `pixiv`,
	group: `Art Platform`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}