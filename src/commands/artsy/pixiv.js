const Command = require(`../../libs/commands`)
const fs = require(`fs`)
const PixivApi = require(`pixiv-api-client`)
const PixImg = require(`pixiv-img`)
const pixiv = new PixivApi()

/**
 * Note:
 * This module requires pixiv account (verified username and pw) in order to get acccess to the API.
 * So, make sure to put your pixiv account details inside the .env file
 * 
 *  PIXIV_USERNAME = email
 *  PIXIV_PASS = account password
 * 
 * Pixiv API
 * @author klerikdust
 */
class Pixiv extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
        super(Stacks)
        this.cachePath = `./.pixivcaches/`
        this.forbiddenKeywords = [
            `lewd`,
            `r18`,
            `porn`,
            `dick`,
            `ass`,
            `vagina`,
            `anal`,
            `blowjob`,
            `bdsm`,
            `furry`,
            `anus`,
            `porno`,
            `boobs`,
            `boob`,
            `nipple`,
            `handjob`,
            `sex`
        ]
    }
    
    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
        //  Logging in to get access to the Pixiv API
        await pixiv.refreshAccessToken(process.env.PIXIV_REFRESH_TOKEN)
        const fullArgs = this.fullArgs
        this.reply(this.locale.PIXIV[fullArgs ? `DISPLAY_CUSTOM_SEARCH` : `DISPLAY_RECOMMENDED_WORK`], {
            simplified: true,
            socket: {keyword: fullArgs}})
                .then(async loadmsg => {
                    //  Dynamically choose recommended/custom search based on input
                    let data = fullArgs ? await this.fetchCustomSearch(fullArgs) : await this.fetchRecommendedWork()
                    //  Prevent forbidden search
                    const usedForbiddenKeyword = this.forbiddenKeywords.filter(k => fullArgs.includes(k))
                    if (usedForbiddenKeyword.length > 0) data = null
                    //  Handle if no returned result from the query
                    if (!data)  {
                        loadmsg.delete()
                        return this.reply(this.locale.PIXIV.NO_RESULT, {color: `red`})
                    }
                    const img = await this.getImage(data.image_urls.medium, data.id)
                    //  Handle if no returned result from given img path
                    if (!img) {
                        loadmsg.delete()
                        return this.reply(this.locale.PIXIV.FAIL_TO_LOAD, {color: `red`})
                    }

                    loadmsg.delete()
                    return this.reply(`${this.getTools(data.tools)}\n${this.getHashtags(data.tags)}`, {
                        customHeader: [`by ${data.user.name}`, this.bot.user.displayAvatarURL()],
                        image: img,
                        prebuffer: true
                    })
            })
    }

    /**
     * Fetch artworks by custom search/filter. Returns object of choosen index.
     * @param {String} keyword 
     * @returns {?object}
     */
    async fetchCustomSearch(keyword = ``) {
        const fn = `[Pixiv.fetchCustomSearch()]`
        this.logger.debug(`${fn} looking up for image with (keyword: ${keyword})`)
        const res = await pixiv.searchIllust(keyword)
        const postData = res.illusts[Math.floor(Math.random() * res.illusts.length)]

        return postData
    }

    /**
     * Fetch artworks by popularity ranking. Returns object of choosen index.
     * @returns {?object}
     */
    async fetchRecommendedWork() {
        const fn = `[Pixiv.fetchRecommendedWork()]`
        this.logger.debug(`${fn} randomizing result`)
        const res = await pixiv.illustRanking()
        const postData = res.illusts[Math.floor(Math.random() * res.illusts.length)]

        return postData
    }
    
    /**
     * Loading image from pixiv cache directory. (downloaded pixiv's image)
     * @param {string} url 
     * @param {string} filename 
     * @param {function} loaderMethod supply with Pistachio's loadCache.
     * @returns {buffer}
     */
    async getImage(url=``, filename=``) {
        const fn = `[Pixiv.getImage()]`
        this.logger.debug(`${fn} fetching request (URL: ${url}) with (filename:${filename})`)
        const id = await PixImg(url, `${this.cachePath + filename}.jpg`)
        return await this.getImageCache(id)
    }

    /**
     * Fetch cached pixiv's image. Return as buffer. If error occured, fallback with a Boolean.
     * @param {string} id image filename 
     * @returns {buffer}
     */
    async getImageCache(id=``) {
        const fn = `[Pixiv.getImageCache()]`
        this.logger.debug(`${fn} fetching cache with path (${id})`)
        const res = await fs.readFileSync(`./${id}`)
        if (!res) {
            const err = `${fn} Failed to fetch image with ID ${id} because of: ${err}`
            this.logger.error(err)
            throw new Error(err)
        }
        return res
    }

    /**
     * Map `name` prop from Pixiv's tags object. Returns a proper string of hashtags.
     * @param {array} tags 
     * @returns {string}
     */
    getHashtags(tags = Array) {
        let arr = tags.map(key => `#${key.name}`)
        let str = ``
        for (let el of arr) {
           str += `${el} `
        }
        return str
    } 

    /**
     * Parse "tools" property from Pixiv's Post Data. Omitted if no tools are found.
     * @param {array} tools
     * @returns {string}
     */
    getTools(tools=Array) {
        if (tools.length < 1) return ``
        return `**Made with ${tools[0]}**`
    } 
}


module.exports.help = {
	start: Pixiv,
	name: `pixiv`,
	aliases: [`pix`, `pxv`, `pixiv`],
	description: `Fetching image from pixiv.`,
	usage: `pixiv <SearchKeyword>(Optional)`,
    group: `Artsy`,
    permissionLevel: 0,
	multiUser: false
}
