'use strict'
const {
    ActionRowBuilder,
    SelectMenuBuilder
} = require(`discord.js`)

class rewardPackageStruct {

    constructor(name = `default`) {
        this.name = name
    }

    /**
     * object to string
     * @param {Object} data 
     * @returns {string}
     */
    pack(data) {
        return JSON.stringify(data)
    }

    /**
     * string to object
     * @param {string} data 
     * @returns {Object}
     */
    unpack(data) {
        return JSON.parse(data)
    }

    /**
     * 
     * @param {Array} options
     * @param {Number} maxValues
     * @returns {ActionRowBuilder}
     */
    createSelectMenus(options, maxValues) {
        if (!Array.isArray(options)) return new TypeError(`parameter 'options' must be an Array`)
        if (Number.isNaN(maxValues)) return new TypeError(`parameter 'maxValues' must be an Number`)
        if (maxValues < 0) maxValues = 1
        const rows = []

        function chunkOptions(array) {
            const chunkSize = 10
            const chunks = []
            for (let i = 0; i < array.length; i += chunkSize) {
                const chunk = array.slice(i, i + chunkSize)
                chunks.push(chunk)
            }
            return chunks
        }

        const chunkedOptions = chunkOptions(options)
        for (let index = 0; index < chunkedOptions.length; index++) {
            let selectMenu = new SelectMenuBuilder()
                .setCustomId(`select_menu_${index}`)
                .setMinValues(0)
                .setMaxValues(maxValues)
                .setOptions(chunkedOptions[index])
                .setPlaceholder(chunkedOptions[index][0].label)
            rows.push(new ActionRowBuilder().setComponents(selectMenu))
        }
        return rows
    }

    createlistener(targetUserId = this.message.author.id, targetMessage = this.message) {
        this.message = targetMessage
        this.skipEdit = false
        const filter = (interaction) => interaction.user.id === targetUserId
        this.activeInstance = targetMessage.createMessageComponentCollector({
            filter,
            time: 300000
        })
    }

    on(fn = null) {
        if (!fn) throw new TypeError(`parameter 'fn' must be a valid callback function`)
        if (!this.activeInstance) throw new Error(`there are no active instance to listen to`)
        this.onEnd()
        return this.activeInstance.on(`collect`, async r => {
            await fn(r)
        })
    }

    end() {
        if (this.skipEdit) {
            this.message.delete()
        } else {
            this.message.edit({
                content: `Sorry but time ran out, please try again`,
                components: []
            })
        }
        this.activeInstance = null

    }

    confirmationEnd() {
        this.skipEdit = true
        if (this.activeInstance) this.activeInstance.stop()
    }

    onEnd() {
        this.activeInstance.on(`end`, () => {
            return this.end()
        })
    }
}
module.exports = rewardPackageStruct