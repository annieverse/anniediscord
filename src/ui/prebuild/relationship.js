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
        //  Main Content
        for (let i=0; i<Math.min(this.relationships.length, 7); i++) {
            const rel = this.relationships[i]
            const user = this.bot.users.cache.get(rel.assigned_user_id)
            const relAvatar = user ? await resolveImage(user.displayAvatarURL({format: `png`, dynamic: false})) : await resolveImage(await loadAsset(`error`))
            const relName = user ? this.nameParser(user.id) : rel.assigned_user_id
            this.listEntry(relName, relAvatar, rel.relationship_name, 30, 30 + i*50)
        }
        this.card.ready()
        return this.card.getBuffer()
    }

    listEntry(username, avatar, relation, x, y) {
        this.card.canv.setColor(this.card.color.text)
        .printCircularImage(avatar, x + 30, y + 30, 19, 19, 9)
        .setTextAlign(`left`)
        .setTextFont(`12pt roboto-bold`)
        .printText(username, x + 65, y + 30)
        .setColor(this.card.color.text)
        .setTextFont(`7pt roboto`)
        .printText(relation, x + 65, y + 44)
    }
}

module.exports = UI