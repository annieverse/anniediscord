const Cards = require(`../components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
const loadAsset = require(`../../utils/loadAsset`)

class UI {
    /**
     * Relationship UI Builder.
     * to access the buffer, please call `.toBuffer()` after running `this.build()`
     * @param {User} [user={}] parsed user object from `./src/libs/user`
     * @legacy
     * @return {Canvas}
     */
    constructor(user={}, nameParser, bot) {
        this.bot = bot
        this.user = user
        this.relationships = user.relationships
        this.nameParser = nameParser
        this.width = 320
        this.height = 430
        this.startPos_x = 10
        this.startPos_y = 10
        this.baseWidth = this.width - 20
        this.baseHeight = this.height - 20
        this.card = new Cards({
            width: this.width,
            height: this.height,
            theme: this.user.usedTheme.alias
        })
    }

    async build() {
        //  Base and card owner's avatar
        this.card.createBase({cornerRadius: 25})
        this.card.canv.addRoundImage(await urlToBuffer(this.user.user.displayAvatarURL), 15, 15, 30, 30, 15)

        //  Title Bar
        this.card.canv.setColor(this.card.color.text)
        .setTextAlign(`left`)
        .setTextFont(`11pt roboto-bold`)
        .addText(`Relationship`, 55, 35)
        .setColor(this.card.color.separator)
        .addRect(this.startPos_x, 48, this.width, 2) // bottom border

        //  Main Content
        for (let i=0; i<Math.min(this.relationships.length, 9); i++) {
            const rel = this.relationships[i]
            const user = this.bot.users.get(rel.theirUserId)
            const relAvatar = user ? await urlToBuffer(user.displayAvatarURL) : await loadAsset(`error`)
            const relName = user ? this.nameParser(user.id) : rel.theirUserId
            this.listEntry(relName, relAvatar, rel.theirRelation, 30, 70 + i*33)
        }

        //  Footer
        this.card.canv.setTextAlign(`left`)
        .setTextFont(`10pt roboto-bold`)
        .addText(`I have a total of `+this.relationships.length+` family members ❤`, 30, 390)
        return this.card.ready()
    }

    listEntry(username, avatar, relation, x, y) {
        this.card.canv.setColor(this.card.color.text)
        .addRoundImage(avatar, x + 4, y, 38, 38, 19)
        .setTextAlign(`left`)
        .setTextFont(`12pt roboto-bold`)
        .addText(username, x + 50, y + 20)
        .setColor(this.card.color.text)
        .setTextFont(`7pt roboto`)
        .addText(relation, x + 50, y + 34)
    }
}

module.exports = UI