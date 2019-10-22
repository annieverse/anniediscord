class CentralHub {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply, collector  } = this.stacks
        reply(`Please repsond with 
        \n\`covers\`
        \n\`badges\`
        \n\`stickers\`
        `)
        collector.on(`collect`, async (msg) => {
            let response = msg.content.toLowerCase()
            switch (response) {
                case `covers`:
                    new covers(this.stacks).execute()
                    break
                case `badges`:
                    new badges(this.stacks).execute()
                    break
                case `stickers`:
                    new stickers(this.stacks).execute()
                    break
                default:
                    break
            }
        })
    }
}

class covers {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    get availiableCovers(){
        const { bot: { db } } = this.stacks
        return db.getCovers
    }

    get activeCover(){
        const { bot: { db } } = this.stacks
        return db.activeCover
    }

    async coverNames(data){
        let item = []
        let itemAlias = []
        let active_cover = await this.activeCover
        data.forEach(async element => { 
            item.push(`${element.name}`)
            itemAlias.push(`${element.alias}`)
        })
        item.push(`default`)
        itemAlias.push(`defaultcover1`)//defaultcover1
        for (let index = 0; index < item.length; index++) {
            if (itemAlias[index] == active_cover.cover) {
                item[index] = `${item[index]} [active]`
            }
        }
        return {item,itemAlias}
    }

    async execute() {
        const { message,reply,multicollector,bot:{db}} = this.stacks
        if (await this.availiableCovers == 0) return reply(`I'm sorry but you dont have any covers`)
        let covers = await this.coverNames(await this.availiableCovers)
        let items = covers.item
        let itemAlias = covers.itemAlias
        let index = items.length-1
        let result
        if (items.length > 1) result = items.join(`, `)
        reply(`${result}\n\nPlease type the name of the cover you would like to change to`,{footer:`Case Sensitive`})
        const secondCollector = multicollector(message)
        secondCollector.on(`collect`, async (secondmsg) => {
            let response = secondmsg.content
            if (items.includes(response)) { index = items.indexOf(response) } else { return reply(`Sorry but you do not own this cover, ${response}`) }
            db.setCover(itemAlias[index])
            reply(`Your cover has been updated to: ${response}`)
        })
    }
}

class stickers {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    get availiableStickers() {
        const { bot: { db } } = this.stacks
        return db.getStickers
    }

    get activeSticker() {
        const { bot: { db } } = this.stacks
        return db.activeSticker
    }

    async stickerNames(data) {
        let item = []
        let itemAlias = []
        let active_sticker = await this.activeSticker
        console.log(active_sticker)
        data.forEach(async element => {
            item.push(`${element.name}`)
            itemAlias.push(`${element.alias}`)
        })
        item.push(`default`)
        itemAlias.push(``)//defaultcover1
        for (let index = 0; index < item.length; index++) {
            if (itemAlias[index] == active_sticker.sticker) {
                item[index] = `${item[index]} [active]`
            }
        }
        return { item, itemAlias }
    }

    async execute() {
        const { message, reply, multicollector, bot: { db } } = this.stacks
        if (await this.availiableStickers == 0 ) return reply(`I'm sorry but you dont have any stickers`)
        let stickers = await this.stickerNames(await this.availiableStickers)
        let items = stickers.item
        let itemAlias = stickers.itemAlias
        let index = items.length - 1
        let result
        if (items.length > 1) result = items.join(`, `)
        reply(`${result}\n\nPlease type the name of the sticker you would like to change to`, { footer: `Case Sensitive` })
        const secondCollector = multicollector(message)
        secondCollector.on(`collect`, async (secondmsg) => {
            let response = secondmsg.content
            if (items.includes(response)) { index = items.indexOf(response) } else { return reply(`Sorry but you do not own this sticker, ${response}`) }
            db.setSticker(itemAlias[index])
            reply(`Your sticker has been updated to: ${response}`)
        })
    }
}

class badges {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply } = this.stacks
        reply(`Not Supported yet`)
    }
}

module.exports.help = {
    start: CentralHub,
    name: `manageprofile`, 
    aliases: [], 
    description: `Choose from your stickers, badges and covers`,
    usage: `manageprofile`,
    group: `shop`,
    public: true,
    require_usermetadata: true,
    multi_user: false
}