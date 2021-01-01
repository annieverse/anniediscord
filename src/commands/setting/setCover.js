const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/profile`)
const fs = require(`fs`)
const fetch = require(`node-fetch`)
const stringSimilarity = require(`string-similarity`)
const { v4: uuidv4 } = require(`uuid`)

/**
 * Setting up your own custom background! upload or share the image link you want to use.
 * @author klerikdust
 */
class SetCover extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)

        /**
         * The cost deducted when uploading a new cover
         * @type {number}
         */
        this.uploadCost = 1000
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji, commanifier, bot:{db} }) {
        await this.requestUserMetadata(2)
        //  Handle if user doesn't specify any arg
        const ownedCovers = this.user.inventory.raw.filter(item => item.type_id === 1 && item.in_use === 0)
        const displayOwnedCovers = this.locale.SETCOVER.OWNED_COVERS+this.prettifyList(ownedCovers)
        const { isValidUpload, url } = this.getUserSelfUploadCover()
        if (!this.fullArgs && !isValidUpload) {
            const FOOTER = this.user.usedCover.isDefault 
            ? `SUGGEST_TO_UPLOAD`
            : this.user.usedCover.isSelfUpload 
            ? `DISPLAY_USED_SELF_COVER`
            : `DISPLAY_USED_REGULAR_COVER`
            return reply(`${this.locale.SETCOVER.GUIDE}\n${this.locale.SETCOVER[FOOTER]}\n${ownedCovers.length > 0 ? displayOwnedCovers : ``}`, {
                header: `Hi, ${name(this.user.id)}!`,
                image: `banner_setbackground`,
                socket: {
                    prefix: this.bot.prefix,
                    emoji: emoji(`AnnieYay`),
                    cover: this.user.usedCover.name
                }
            })
        }
        //  Handle user self-upload cover
        const id = uuidv4()
        if (isValidUpload) {
            try {
                const response = await fetch(url)
                const buffer = await response.buffer()
                await fs.writeFileSync(`./src/assets/selfupload/${id}.png`, buffer)
                this.cover = {
                    isSelfUpload: true,
                    item_id: id,
                    alias: id,
                    name: `My Upload`
                }
            }
            catch (e) {
                return this.logger.error(`Fail to render self-upload cover. > ${e.stack}`)
            }
            //  Handle if user doesn't have enough artcoins to upload a new cover
            if (this.user.inventory.artcoins < this.uploadCost) return reply(this.locale.SETCOVER.UPLOAD_INSUFFICIENT_COST, {
                socket: {
                    emoji: emoji(`artcoins`),
                    requiredLeft: commanifier(this.uploadCost-this.user.inventory.artcoins)
                }
            })
        }
        //  Handle if user asked to use default cover
        else if (this.fullArgs === `default`) {
            this.cover = await db.getItem(`defaultcover1`)
        }
        //  Otherwise, handle like the usual way
        else {
            //  Handle if user doesn't have any equippable cover
            if (!ownedCovers.length) return reply(this.locale.SETCOVER.NO_EQUIPPABLE_COVER)
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
        }
        this.user.usedCover = this.cover
        this.fetching = await reply(this.locale.SETCOVER.FETCHING, {
            socket: {
                itemId: this.cover.item_id,
                userId: this.user.id,
                emoji: emoji(`AAUloading`)
            } 
        })
        //  Rendering preview for user to see
        let img = await new GUI(this.user, this.bot, {width: 320, height: 310}).build()
        const confirmationMessage = this.locale.SETCOVER[this.cover.isSelfUpload ? `PREVIEW_SELF_UPLOAD` : `PREVIEW_CONFIRMATION`]
        this.confirmation = await reply(confirmationMessage, {
            prebuffer: true,
            image: img.toBuffer(),
            socket: {
                cover: this.cover.name,
                uploadCost: commanifier(this.uploadCost),
                emoji: emoji(this.cover.isSelfUpload ? `artcoins` : `AnnieSmile`)
            }
        })
        this.fetching.delete()
        this.addConfirmationButton(`applyCover`, this.confirmation)
        return this.confirmationButtons.get(`applyCover`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: emoji(`AnnieSleep`)}
			})
            await db.detachCovers(this.user.id, this.message.guild.id)
            if (this.cover.isSelfUpload) {
                db.applySelfUploadCover(this.cover.item_id, this.user.id, this.message.guild.id)
                db.updateInventory({itemId: 52, value: this.uploadCost, operation: `-`, userId: this.user.id, guildId: this.message.guild.id})
            }
            else {
                db.deleteSelfUploadCover(this.user.id, this.message.guild.id)
                db.applyCover(this.cover.item_id, this.user.id, this.message.guild.id)
            }
            //  Finalize
            this.finalizeConfirmation(r)
            const successMessage = this.cover.isSelfUpload ? `SUCCESSFUL_ON_SELF_UPLOAD` : `SUCCESSFUL`
            reply(this.locale.SETCOVER[successMessage], {
                socket: {
                    cover: this.cover.name,
                    emoji: emoji(this.cover.alias)
                }
            })
        })
    }

    /** 
     * Check if user has attempted to upload a new cover
     * @return {object}
     */
    getUserSelfUploadCover() {
        const hasAttachment = this.message.attachments.first() ? true : false
        const hasImageURL = this.fullArgs.startsWith(`http`) && this.fullArgs.length >= 15 ? true : false 
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: this.message.attachments.first() 
            ? this.message.attachments.first().url
            : this.fullArgs.startsWith(`http`) && this.fullArgs.length >= 15
            ? this.fullArgs
            : null
        }
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
    aliases: [`setcover`, `setcovers`, `setcvr`, `setbg`, `setbackground`],
    description: `Setting up your own custom background! upload or share the image link you want to use.`,
    usage: `setcover <Attachment/URL>`,
    group: `Setting`,
    permissionLevel: 0,
    multiUser: false
}

