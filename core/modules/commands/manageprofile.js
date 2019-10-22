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
        const {message,db} = this.stacks
        return db(message.author.id).getCovers
    }

    get activeCover(){
        const {message,db} = this.stacks
        return db(message.author.id).activeCover
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
        const { message,reply,multicollector,db} = this.stacks
        let availiableCovers = await db(message.author.id).getCovers
        if (availiableCovers == 0) return reply(`I'm sorry but you dont have any covers`)
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
            db(message.author.id).setCover(itemAlias[index])
            reply(`Your cover has been updated to: ${response}`)
        })
    }
}

class stickers {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    get availiableStickers() {
        const { message, db} = this.stacks
        return db(message.author.id).getStickers
    }

    get activeSticker() {
        const { message, db} = this.stacks
        return db(message.author.id).activeSticker
    }

    async stickerNames(data) {
        let item = []
        let itemAlias = []
        let active_sticker = await this.activeSticker
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
        const { message, reply, multicollector, db} = this.stacks
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
            db(message.author.id).setSticker(itemAlias[index])
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