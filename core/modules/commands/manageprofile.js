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
        const { message, reply, multicollector, db, code: { MANAGE_PROFILE: { MENU, DONT_OWN_ITEM, ITEM_UPDATED, MENU_CLOSED, NO_ITEMS } }, exitAnswers} = this.stacks
        let availiableCovers = await db(message.author.id).getCovers
        if (availiableCovers == 0) return reply(NO_ITEMS,{socket:[`covers`]})
        let covers = await this.coverNames(await this.availiableCovers)
        let items = covers.item
        let itemAlias = covers.itemAlias
        let index = items.length-1
        let result
        if (items.length > 1) result = items.join(`, `)
        reply(MENU, { socket: [result,`cover`], footer: `Case Sensitive` })
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
        reply(MENU, { socket: [result,`sticker`], footer: `Case Sensitive` })
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

    get availiableBadges() {
        const { message, db} = this.stacks
        return db(message.author.id).getBadges
    }

    get activeBadges() {
        const { message, db } = this.stacks
        return db(message.author.id).activeBadges
    }

    async badgeNames(data) {
        let item = []
        let itemAlias = []
        let itemSlot = []
        let replacedName = []

        let active_badges = await this.activeBadges
        delete active_badges.userId
        let objectKeys = Object.keys(active_badges)
        let objectValues = Object.values(active_badges)
        objectKeys.forEach((element, index)=>{
            element === `slotanime` ? replacedName.push(`Anime Badge`) : replacedName.push(`Badge Space ${index+1}`)
        })
        data.forEach(element=> {
            item.push(`${element.name}`)
            itemAlias.push(`${element.alias}`)
        })

        
        for (let index = 0; index < item.length; index++) {
            for (let secondIndex = 0; secondIndex < objectValues.length; secondIndex++) {
                if (itemAlias[index] == objectValues[secondIndex]) {
                    itemSlot.push(`${replacedName[secondIndex]} : ${item[index]}`)
                }
            }
        }
        item.push(`default`)
        itemAlias.push(null)
        

        return { item, itemAlias, itemSlot, active_badges }
    }

    async execute() {
        const { message, reply, multicollector, db, code: { MANAGE_PROFILE: { ALREADY_DIPLAYED, NO_ITEM_SUPPLIED, DONT_OWN_ITEM, ITEM_UPDATED, MENU_CLOSED, NO_ITEMS, BADGE_MENU, INVALID_SLOT } }, exitAnswers } = this.stacks
        let availiableBadges = await db(message.author.id).getBadges
        if (availiableBadges == 0) return reply(NO_ITEMS, { socket: [`badges`] })
        let badges = await this.badgeNames(await this.availiableBadges)
        let items = badges.item
        let itemAlias = badges.itemAlias
        let itemSlots = badges.itemSlot
        let currentBadges = badges.active_badges
        currentBadges = Object.values(currentBadges)
        let index = items.length - 1
        let firstRes,secondRes
        let availiableSlots = [`1`, `2`, `3`, `4`, `5`, `6`,`anime`]
        let animeListOptions = [`mal`,`kitsu`]

        if (items.length > 1) secondRes = items.join(`, `)
        if (itemSlots.length > 1) firstRes = itemSlots.join(`, `)

        reply(BADGE_MENU +`\navailiable slots include ${availiableSlots.join(`, `)}`, {socket:[firstRes,secondRes],footer: `Case Sensitive` })
        const secondCollector = multicollector(message)
        secondCollector.on(`collect`, async (secondmsg) => {
            let response = secondmsg.content
            if (exitAnswers.includes(response.toLowerCase())) return reply(MENU_CLOSED)
            let firstRes = response.split(` `)
            let slot = firstRes[0].toLowerCase()
            delete firstRes[0]
            response = firstRes.join(` `).slice(1)
            if (!response) return reply(NO_ITEM_SUPPLIED + MENU_CLOSED)
            if (!availiableSlots.includes(slot)) return reply(INVALID_SLOT, { socket: [`badge`, slot] })
            if (slot == `anime` && !animeListOptions.includes(response)) return reply(DONT_OWN_ITEM, { socket: [`badge`, response] })
            slot = `slot${slot}`
            if (items.includes(response)) { index = items.indexOf(response) } else { return reply(DONT_OWN_ITEM, { socket: [`badge`, response] }) }
            if (currentBadges.includes(itemAlias[index]) && response != `default`) return reply(ALREADY_DIPLAYED, { socket: [`badge`] })
            db(message.author.id).setBadge({slot: slot, item: itemAlias[index]})
            reply(ITEM_UPDATED, { socket: [`badge`, response] })
        })
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