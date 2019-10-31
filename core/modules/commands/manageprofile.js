class CentralHub {
    constructor(Stacks) {
        this.stacks = Stacks
        this.stacks.exitAnswers = [`cancel`, `exit`, `quit`]
    }

    async execute() {
        const { reply, collector, code: { MANAGE_PROFILE: { MAIN_MENU, MENU_CLOSED } }, exitAnswers} = this.stacks
        reply(MAIN_MENU,{
            socket:[
                `
                \n\`covers\`
                \n\`badges\`
                \n\`stickers\`
                `
            ]
        })

        collector.on(`collect`, async (msg) => {
            let response = msg.content.toLowerCase()
            if (exitAnswers.includes(response)) return reply(MENU_CLOSED)
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
                    reply(MENU_CLOSED)
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
        const { message, reply, multicollector, db, code: { MANAGE_PROFILE: { MENU, DONT_OWN_ITEM, ITEM_UPDATED, MENU_CLOSED, NO_COVERS } }, exitAnswers} = this.stacks
        let availiableCovers = await db(message.author.id).getCovers
        if (availiableCovers == 0) return reply(NO_COVERS,{socket:[`covers`]})
        let covers = await this.coverNames(await this.availiableCovers)
        let items = covers.item
        let itemAlias = covers.itemAlias
        let index = items.length-1
        let result
        if (items.length > 1) result = items.join(`, `)
        reply(MENU, { socket: [`cover`, result], footer: `Case Sensitive` })
        const secondCollector = multicollector(message)
        secondCollector.on(`collect`, async (secondmsg) => {
            let response = secondmsg.content
            if (exitAnswers.includes(response.toLowerCase())) return reply(MENU_CLOSED)
            if (items.includes(response)) { index = items.indexOf(response) } else { return reply(DONT_OWN_ITEM,{socket:[`cover`,response]}) }
            db(message.author.id).setCover(itemAlias[index])
            reply(ITEM_UPDATED, { socket: [`cover`, response] })
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
        itemAlias.push(``)
        for (let index = 0; index < item.length; index++) {
            if (itemAlias[index] == active_sticker.sticker) {
                item[index] = `${item[index]} [active]`
            }
        }
        return { item, itemAlias }
    }

    async execute() {
        const { message, reply, multicollector, db, code: { MANAGE_PROFILE: { MENU, DONT_OWN_ITEM, ITEM_UPDATED, MENU_CLOSED, NO_ITEMS } }, exitAnswers} = this.stacks
        if (await this.availiableStickers == 0) return reply(NO_ITEMS, { socket: [`stickers`] })
        let stickers = await this.stickerNames(await this.availiableStickers)
        let items = stickers.item
        let itemAlias = stickers.itemAlias
        let index = items.length - 1
        let result
        if (items.length > 1) result = items.join(`, `)
        reply(MENU, { socket: [`sticker`, result], footer: `Case Sensitive` })
        const secondCollector = multicollector(message)
        secondCollector.on(`collect`, async (secondmsg) => {
            let response = secondmsg.content
            if (exitAnswers.includes(response.toLowerCase())) return reply(MENU_CLOSED)
            if (items.includes(response)) { index = items.indexOf(response) } else { return reply(DONT_OWN_ITEM, { socket: [`sticker`, response] })}
            db(message.author.id).setSticker(itemAlias[index])
            reply(ITEM_UPDATED, { socket: [`sticker`, response] })
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