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
    constructor(user={}, nameParser, avatarParser, bot, author) {
        this.bot = bot
        this.user = user
        this.relationships = user.relationships
        this.nameParser = nameParser
        this.avatarParser = avatarParser
        this.author = author,
        this.width = 320
        this.limit = 7
        this.height = 430 - (51.50 * (this.limit - user.relationships.length))
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
        await this.card.createBase({})
        //  Background
        await this.card.addBackgroundLayer(this.user.usedCover.alias,{
            isSelfUpload: this.user.usedCover.isSelfUpload, 
            gradient: true
        })
        //  Main Content
        for (let i=0; i<Math.min(this.relationships.length, 7); i++) {
            const rel = this.relationships[i]
            const user = await this.bot.users.fetch(rel.assigned_user_id)
            const relAvatar = user ? await resolveImage(user.displayAvatarURL({format: `png`, dynamic: false})) : await resolveImage(await loadAsset(`error`))
            const relName = user ? this.nameParser(user.id) : rel.assigned_user_id
            //  Add highlight and lighten the text if current row is the author
            if (user.id === this.author.id) {
                this.currentRowIsAuthor = true
                this.card.createDataBar({
                    barColor: `pink`, 
                    shadowColor: `pink`,
                    inline: true,
                    marginTop: 35+i*50,
                    marginLeft: 32,
                    height: 50,
                    width: 590
                })
            }
            this.listEntry(relName, relAvatar, rel.relationship_name, 30, 30 + i*50)
        }
        this.card.ready()
        return this.card.getBuffer()
    }

    listEntry(username, avatar, relation, x, y) {
        const textColor = this.currentRowIsAuthor ? `white` : this.card.color.text
        this.card.canv.setColor(textColor)
        .printCircularImage(avatar, x + 30, y + 30, 19, 19, 9)
        .setTextAlign(`left`)
        .setTextFont(`12pt roboto-bold`)
        .printText(username, x + 65, y + 30)
        .setColor(textColor)
        .setTextFont(`8pt roboto`)
        .printText(relation, x + 65, y + 44)
        this.currentRowIsAuthor = false
    }
}

module.exports = UI