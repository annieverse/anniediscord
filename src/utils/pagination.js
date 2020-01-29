const { RichEmbed } = require(`discord.js`)
const palette = require(`./colorset`)


/**
 *  Main class to handle paging-like message system.
 *  @Paging
 *  @param {Object} message of the current message instance object
 *  @param {Array} data list of data that going to be displayed.
 * 
 * 
 *  Note from Naph:
 *  - This framework is just a boilerplate, so feel free to improve it's capabilities that might be more helpful in the future.
 * 
 */
class Paging {
    constructor(Components) {
        this.message = Components.message
        this.chunkOfData = Components.data || []
    }


    /**
     *  Assigning image data into embedded message. Returns collection of registered embeds.
     *  @ONLY_SUPPORTS_IMAGE
     *  @registerPages
     */
    registerPages() {
        let res = []
        for (let i = 0; i < this.chunkOfData.length; i++) {
            res[i] = new RichEmbed().setImage(this.chunkOfData[i]).setColor(palette.darkmatte)
        }
        return res
    }


    /**
     *  Rendering page result from `registerPages()`
     *  @render
     */
    render() {

        let page = 0
        let embeddedPages = this.registerPages()

        this.message.channel.send(`\`Preparing paging system . .\``)
        .then(async loading => {
            this.message.channel.send(embeddedPages[0])
                .then(async msg => {

                    loading.delete()

                    //  Buttons
                    await msg.react(`⏪`)
                    await msg.react(`⏩`)


                    // Filters - These make sure the varibles are correct before running a part of code
                    const backwardsFilter = (reaction, user) => reaction.emoji.name === `⏪` && user.id === this.message.author.id
                    const forwardsFilter = (reaction, user) => reaction.emoji.name === `⏩` && user.id === this.message.author.id


                    //  Timeout limit for page buttons
                    const backwards = msg.createReactionCollector(backwardsFilter, {
                        time: 120000
                    })
                    const forwards = msg.createReactionCollector(forwardsFilter, {
                        time: 120000
                    })
 

                    //	Left navigation
                    backwards.on(`collect`, r => {
                        r.remove(this.message.author.id)
                        page--
                        if (embeddedPages[page]) {
                            msg.edit(embeddedPages[page])
                        } else {
                            page++
                        }
                    })


                    //	Right navigation
                    forwards.on(`collect`, r => {
                        r.remove(this.message.author.id)
                        page++
                        if (embeddedPages[page]) {
                            msg.edit(embeddedPages[page])
                        } else {
                            page--
                        }
                    })
                })
            })
        }

}

module.exports = Paging
