const Cards = require(`../../ui/components/cards`)
const urlToBuffer = require(`../../utils/urlToBuffer`)
/**
 * Trade window banner. Mirrors the inventory header (`ownerHeader.js`) — same
 * 260×160 frame, same theme + cover layer driven by the trade initiator's
 * preferences — but lays two avatars side by side instead of one. The
 * initiator owns the visual theme; the partner just gets their portrait
 * drawn next to theirs.
 *
 * Construct with both parties already passed through `User.requestMetadata`
 * so we have `usedTheme` / `usedCover` / `master.displayAvatarURL` to pull
 * from. The GUI doesn't fetch any of that itself — it's a pure renderer
 * matching the prebuild pattern in this directory.
 *
 * to access the buffer, please call `.png()` after running `this.build()`.
 *
 * @class
 */
class UI {
    /**
     * @param {User} initiator parsed initiator from `./src/libs/user` (theme owner)
     * @param {User} partner parsed partner from `./src/libs/user`
     */
    constructor (initiator = {}, partner = {}) {
        this.initiator = initiator
        this.partner = partner
    }

    async build() {
        let card = await new Cards({
            width: 300,
            height: 160,
            theme: this.initiator.usedTheme.alias,
            align: `center`
        })
            .createBase({})
        //  Top cover layer follows the initiator's cover preference, same as
        //  the inventory header. Keeps the visual continuity for the user
        //  who started the trade.
        await card.addBackgroundLayer(this.initiator.usedCover.alias, {
            isSelfUpload: this.initiator.usedCover.isSelfUpload,
            minHeight: 120,
            gradient: true,
            gradientHeight: 100
        })
        //  Two avatars on a 300px-wide canvas. Initiator centered at x=75
        //  (column-A midpoint), partner at x=225 (column-B midpoint).
        //  marginLeft passed to addContent is the top-left corner of the
        //  avatar box, so we subtract the radius to land the centers on
        //  the requested coordinates.
        //
        //  cards.js `addContent` has a quirk: when `justify: 'center'` is
        //  set on an avatar draw, the helper at addContent:422 returns
        //  width/2 and IGNORES marginLeft. We skip justify and pass
        //  explicit marginLeft so both draws land where we want.
        const avatarRadius = 24
        const initiatorCenterX = 120
        const partnerCenterX = 225
        const initiatorMarginLeft = initiatorCenterX - avatarRadius
        const partnerMarginLeft = partnerCenterX - avatarRadius
        const initiatorAvatar = await urlToBuffer(this.initiator.master.displayAvatarURL({ extension: `png`, forceStatic: true }))
        const partnerAvatar = await urlToBuffer(this.partner.master.displayAvatarURL({ extension: `png`, forceStatic: true }))
        await card.addContent({
            avatar: initiatorAvatar,
            marginTop: 80,
            marginLeft: initiatorMarginLeft,
            avatarRadius: avatarRadius,
            inline: true
        })
        await card.addContent({
            avatar: partnerAvatar,
            marginTop: 80,
            marginLeft: partnerMarginLeft,
            avatarRadius: avatarRadius
        })
        card.ready()
        return card.getBuffer()
    }
}

module.exports = UI
