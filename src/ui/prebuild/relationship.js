const Cards = require(`../components/cards`)
const loadAsset = require(`../../utils/loadAsset`)
const {resolveImage} = require(`canvas-constructor`)

class UI {
    /**
     * Relationship UI Builder.
     * to access the buffer, please call `.toBuffer()` after running `this.build()`
     * @param {User} [user={}] parsed user object from `./src/libs/user`
     * @legacy
     * @return {Canvas}
     */
    constructor(user={}, nameParser, avatarParser, bot) {
        this.bot = bot
        this.user = user
        this.relationships = user.relationships
        this.nameParser = nameParser
        this.avatarParser = avatarParser
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
        this.card.canv.printCircularImage(await resolveImage(this.user.user.displayAvatarURL({format: `png`, dynamic: false})), 35, 35, 15, 15, 7)

        //  Title Bar
        this.card.canv.setColor(this.card.color.text)
        .setTextAlign(`left`)
        .setTextFont(`11pt roboto-bold`)
        .printText(`Relationship`, 55, 35)
        .setColor(this.card.color.separator)
        .printRectangle(this.startPos_x, 48, this.width, 2) // bottom border

        //  Main Content
        for (let i=0; i<Math.min(this.relationships.length, 9); i++) {
            const rel = this.relationships[i]
            const user = this.bot.users.cache.get(rel.assigned_user_id)
            const relAvatar = user ? await resolveImage(user.displayAvatarURL({format: `png`, dynamic: false})) : await resolveImage(await loadAsset(`error`))
            const relName = user ? this.nameParser(user.id) : rel.assigned_user_id
            this.listEntry(relName, relAvatar, rel.relationship_name, 30, 70 + i*33)
        }
        //  Footer
        this.card.canv.setTextAlign(`left`)
        .setTextFont(`10pt roboto-bold`)
        .printText(`I have a total of `+this.relationships.length+` family members ❤`, 30, 390)
        this.card.ready()
        return this.card.getBuffer()
    }

    listEntry(username, avatar, relation, x, y) {
        this.card.canv.setColor(this.card.color.text)
        .printCircularImage(avatar, x + 25, y + 20, 19, 19, 9)
        .setTextAlign(`left`)
        .setTextFont(`12pt roboto-bold`)
        .printText(username, x + 50, y + 20)
        .setColor(this.card.color.text)
        .setTextFont(`7pt roboto`)
        .printText(relation, x + 50, y + 34)
    }
}

module.exports = UI