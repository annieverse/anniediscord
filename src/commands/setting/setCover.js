const Confirmator = require(`../../libs/confirmator`)
const GUI = require(`../../ui/prebuild/profile`)
const fs = require(`fs`)
const fetch = require(`node-fetch`)
const stringSimilarity = require(`string-similarity`)
const {
    v4: uuidv4
} = require(`uuid`)
const commanifier = require(`../../utils/commanifier`)
const User = require(`../../libs/user`)

/**
 * Setting up your own custom background! upload or share the image link you want to use.
 * @author klerikdust
 */
module.exports = {
    name: `setCover`,
    aliases: [`setcover`, `setcovers`, `setcvr`, `setbg`, `setbackground`],
    description: `Setting up your own custom background! upload or share the image link you want to use.`,
    usage: `setcover <Attachment/URL>`,
    permissionLevel: 0,
    uploadCost: 1000,
    async execute(client, reply, message, arg, locale, prefix) {
        const userData = await (new User(client, message)).requestMetadata(message.author, 2)
        //  Handle if user doesn't specify any arg
        const ownedCovers = userData.inventory.raw.filter(item => item.type_id === 1 && item.in_use === 0)
        const displayOwnedCovers = locale.SETCOVER.OWNED_COVERS + this.prettifyList(ownedCovers)
        const {
            isValidUpload,
            url
        } = this.getUserSelfUploadCover(arg, message)
        if (!arg && !isValidUpload) {
            const FOOTER = userData.usedCover.isDefault ?
                `SUGGEST_TO_UPLOAD` :
                userData.usedCover.isSelfUpload ?
                `DISPLAY_USED_SELF_COVER` :
                `DISPLAY_USED_REGULAR_COVER`
            return reply.send(`${locale.SETCOVER.GUIDE}\n${locale.SETCOVER[FOOTER]}\n${ownedCovers.length > 0 ? displayOwnedCovers : ``}`, {
                header: `Hi, ${message.author.username}!`,
                image: `banner_setbackground`,
                socket: {
                    prefix: prefix,
                    emoji: await client.getEmoji(`781504248868634627`),
                    cover: userData.usedCover.name
                }
            })
        }
        this.args = arg.split(` `)
        //  Handle user self-upload cover
        const id = uuidv4()
        if (isValidUpload) {
            const response = await fetch(url)
            const buffer = await response.buffer()
            await fs.writeFileSync(`./src/assets/selfupload/${id}.png`, buffer)
            this.cover = {
                isSelfUpload: true,
                item_id: id,
                alias: id,
                name: `My Upload`
            }
            //  Handle if user doesn't have enough artcoins to upload a new cover
            if (userData.inventory.artcoins < this.uploadCost) return reply.send(locale.SETCOVER.UPLOAD_INSUFFICIENT_COST, {
                socket: {
                    emoji: await client.getEmoji(`758720612087627787`),
                    requiredLeft: commanifier(this.uploadCost - userData.inventory.artcoins)
                }
            })
        }
        //  Handle if user asked to use default cover
        else if (arg === `default`) {
            this.cover = await client.db.getItem(`defaultcover1`)
        }
        //  Otherwise, handle like the usual way
        else {
            //  Handle if user doesn't have any equippable cover
            if (!ownedCovers.length) return reply.send(locale.SETCOVER.NO_EQUIPPABLE_COVER)
            const searchStringResult = stringSimilarity.findBestMatch(arg, ownedCovers.map(i => i.name))
            this.cover = searchStringResult.bestMatch.rating >= 0.4
                //  If searchstring successfully found the cover from the given string keyword with the accuracy of >= 40%, then pull based on given result.
                ?
                ownedCovers.filter(i => i.name === searchStringResult.bestMatch.target)[0]
                //  If doesn't work, try searching based on item_id
                :
                ownedCovers.filter(i => i.item_id === parseInt(this.args[0])).length > 0 ?
                ownedCovers.filter(i => i.item_id === parseInt(this.args[0]))[0]
                //  Finally if no item's name/ID are match, then return null
                :
                null
            //  Handle if dynamic search string doesn't give any result
            if (!this.cover) return reply.send(locale.SETCOVER.ITEM_DOESNT_EXISTS, {
                socket: {
                    emoji: await client.getEmoji(`692428969667985458`)
                }
            })
            //  Handle if user tries to use cover that currently being used.
            if (userData.usedCover.item_id === this.cover.item_id) return reply.send(locale.SETCOVER.ALREADY_USED, {
                socket: {
                    emoji: await client.getEmoji(`692428748838010970`),
                    cover: this.cover.name
                }
            })
        }
        userData.usedCover = this.cover
        const fetching = await reply.send(locale.SETCOVER.FETCHING, {
            socket: {
                itemId: this.cover.item_id,
                userId: message.author.id,
                emoji: await client.getEmoji(`790994076257353779`)
            }
        })
        //  Rendering preview for user to see
        let img = await new GUI(userData, client, {
            width: 320,
            height: 310
        }).build()
        const confirmationMessage = locale.SETCOVER[this.cover.isSelfUpload ? `PREVIEW_SELF_UPLOAD` : `PREVIEW_CONFIRMATION`]
        const confirmation = await reply.send(confirmationMessage, {
            prebuffer: true,
            image: img.toBuffer(),
            socket: {
                cover: this.cover.name,
                uploadCost: commanifier(this.uploadCost),
                emoji: await client.getEmoji(this.cover.isSelfUpload ? `758720612087627787` : `692428927620087850`)
            }
        })
        fetching.delete()
        const c = new Confirmator(message, reply)
        await c.setup(message.author.id, confirmation)
        c.onAccept(async () => {
            await client.db.detachCovers(message.author.id, message.guild.id)
            if (this.cover.isSelfUpload) {
                client.db.applySelfUploadCover(this.cover.item_id, message.author.id, message.guild.id)
                client.db.updateInventory({
                    itemId: 52,
                    value: this.uploadCost,
                    operation: `-`,
                    userId: message.author.id,
                    guildId: message.guild.id
                })
            } else {
                client.db.deleteSelfUploadCover(message.author.id, message.guild.id)
                client.db.applyCover(this.cover.item_id, message.author.id, message.guild.id)
            }
            const successMessage = this.cover.isSelfUpload ? `SUCCESSFUL_ON_SELF_UPLOAD` : `SUCCESSFUL`
            reply.send(locale.SETCOVER[successMessage], {
                socket: {
                    cover: this.cover.name,
                    emoji: await client.getEmoji(this.cover.alias)
                }
            })
        })
    },

    /** 
     * Check if user has attempted to upload a new cover
     * @param {string} arg
     * @param {Message} message
     * @return {object}
     */
    getUserSelfUploadCover(arg, message) {
        const hasAttachment = message.attachments.first() ? true : false
        const hasImageURL = arg.startsWith(`http`) && arg.length >= 15 ? true : false
        return {
            isValidUpload: hasAttachment || hasImageURL ? true : false,
            url: message.attachments.first() ?
                message.attachments.first().url :
                arg.startsWith(`http`) && arg.length >= 15 ?
                arg :
                null
        }
    },

    /**
     * Properly arrange returned list from `user.inventory.raw`
     * @param {array} [list=[]] this.user.inventory.raw
     * @returns {string}
     */
    prettifyList(list) {
        let str = ``
        for (let i = 0; i < list.length; i++) {
            const item = list[i]
            str += `╰☆～(${item.item_id}) **${item.name}**${list.length === (list.length-1) ? `` : `\n`}`
        }
        return str
    }
}