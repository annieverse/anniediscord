const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/profile`)
const moment = require(`moment`)
const { MessageAttachment } = require(`discord.js`)
const stringSimilarity = require('string-similarity');

/**
 * Setting up your profile cover
 * @author klerikdust
 */
class SetCover extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * Banner's img source
         * @type {string}
         */
         this.banner = `https://i.ibb.co/0F31FM0/setwelcomer.png`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji, avatar, bot:{db} }) {
        await this.requestUserMetadata(2)
        let ownedCovers = this.user.inventory.raw.filter(item => item.type_id === 1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) {
            ownedCovers = ownedCovers.filter(i => i.in_use === 0)
            const FOOTER = !ownedCovers.length ? this.locale.SETCOVER.SUGGEST_TO_BUY : this.locale.SETCOVER.OWNED_COVER_LIST
            return reply(`${this.locale.SETCOVER.GUIDE}\n\n${FOOTER}`, {
                header: `Hi, ${name(this.user.id)}!`,
                prebuffer: true,
                image: this.banner,
                socket: {
                    prefix: this.bot.prefix,
                    emoji: emoji(`AnnieSmuggy`),
                    list: this.prettifyList(ownedCovers)
                }
            })
        }
        //  Handle if user doesn't have any equippable cover
        if (!ownedCovers.length) return reply(this.locale.SETCOVER.NO_EQUIPPABLE_COVER, {})
        const searchStringResult = stringSimilarity.findBestMatch(this.fullArgs, ownedCovers.map(i => i.name))
        this.cover = searchStringResult.bestMatch.rating >= 0.4
        //  If searchstring successfully found the cover from the given string keyword with the accuracy of >= 40%, then pull based on given result.
        ? ownedCovers.filter(i => i.name === searchStringResult.bestMatch.target)[0] 
        //  If doesn't work, try searching based on item_id
        : ownedCovers.filter(i => i.item_id === parseInt(this.args[0])).length > 0
        ? ownedCovers.filter(i => i.item_id === parseInt(this.args[0]))[0]
        //  Finally if no item's name/ID are match, then return null
        : null
        //  Handle if dynamic search string doesn't give any result
        if (!this.cover) return reply(this.locale.SETCOVER.ITEM_DOESNT_EXISTS, {socket: {emoji:emoji(`AnnieThinking`)} })
        //  Handle if user tries to use cover that currently being used.
        if (this.user.usedCover.item_id === this.cover.item_id) return reply(this.locale.SETCOVER.ALREADY_USED, {
            socket: {
                emoji: emoji(`AnnieMad`),
                cover: this.cover.name
            }
        })
        //  Rendering preview for user to see
        this.user.usedCover = this.cover
        this.fetching = await reply(this.locale.SETCOVER.FETCHING, {
            simplified: true,
            socket: {
                itemId: this.cover.item_id,
                userId: this.user.id,
                emoji: emoji(`AAUloading`)
            } 
        })
        let img = await new GUI(this.user, this.bot, {width: 320, height: 310}, avatar).build()
        this.confirmation = await reply(this.locale.SETCOVER.PREVIEW_CONFIRMATION, {
            prebuffer: true,
            image: img.toBuffer(),
            socket: {
                cover: this.cover.name,
                emoji: emoji(`AnnieSmile`)
            }
        })
        this.fetching.delete()
        this.addConfirmationButton(`applyCover`, this.confirmation)
        return this.confirmationButtons.get(`applyCover`).on(`collect`, async r => {
            //  Perform action
            await db.detachCovers(this.user.id, this.message.guild.id)
            await db.applyCover(this.cover.item_id, this.user.id, this.message.guild.id)
            //  Finalize
            this.finalizeConfirmation(r)
            return reply(this.locale.SETCOVER.SUCCESSFUL, {socket: {
                cover: this.cover.name,
                emoji: emoji(this.cover.alias)
            }})
        })
    }

    /**
     * Properly arrange returned list from `user.inventory.raw`
     * @param {array} [list=[]] this.user.inventory.raw
     * @returns {string}
     */
    prettifyList(list) {
        let str = ``
        for (let i = 0; i<list.length; i++) {
            const item = list[i]
            str += `╰☆～(${item.item_id}) **${item.name}**${list.length === (list.length-1) ? `` : `\n`}`
        }
        return str
    }
}

module.exports.help = {
    start: SetCover,
    name: `setCover`,
    aliases: [`setcover`, `setcovers`, `setcvr`],
    description: `Setting up your profile cover`,
    usage: `setcover <coverName/ID>`,
    group: `Setting`,
    permissionLevel: 0,
    multiUser: false
}

