const Command = require(`../../libs/commands`)
const fsn = require(`fs-nextra`)
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
    }
    
    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, bot }) {
        //  Logging in to get access to the Pixiv API
        await pixiv.login(process.env.PIXIV_USERNAME, process.env.PIXIV_PASS)

        const fullArgs = this.fullArgs
        reply(this.locale.PIXIV[fullArgs ? `DISPLAY_CUSTOM_SEARCH` : `DISPLAY_RECOMMENDED_WORK`], {
            simplified: true,
            socket: {keyword: fullArgs}})
                .then(async loadmsg => {
                    //  Dynamically choose recommended/custom search based on input
                    const data = fullArgs ? await this.fetchCustomSearch(fullArgs) : await this.fetchRecommendedWork()

                    //  Handle if no returned result from the query
                    if (!data)  {
                        loadmsg.delete()
                        return reply(this.locale.PIXIV.NO_RESULT, {color: `red`})
                    }

                    const img = await this.getImage(data.image_urls.medium, data.id)
                    //  Handle if no returned result from given img path
                    if (!img) {
                        loadmsg.delete()
                        return reply(this.locale.PIXIV.FAIL_TO_LOAD, {color: `red`})
                    }

                    loadmsg.delete()
                    return reply(`${this.getTools(data.tools)}\n${this.getHashtags(data.tags)}`, {
                        customHeader: [`by ${data.user.name}`, bot.user.displayAvatarURL],
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
        const res = await pixiv.searchIllustPopularPreview(keyword)
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
        return fsn.readFile(`./${id}`).catch(() => {
            this.logger.error(`${fn} has failed to fetch pixiv img with path (${id})`)
            return false
        })
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