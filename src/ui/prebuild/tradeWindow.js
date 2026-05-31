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
            width: 260,
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
            gradientHeight: 160
        })
        //  Two avatars side by side. The card is 260px wide; centering one
        //  avatar at radius 24 puts it at ~106. To split into two, push them
        //  apart by ~32px each side of center. inline: true keeps the
        //  reservedSpace cursor still so the second draw lands on the same
        //  row instead of dropping below.
        const initiatorAvatar = await urlToBuffer(this.initiator.master.displayAvatarURL({ extension: `png`, forceStatic: true }))
        const partnerAvatar = await urlToBuffer(this.partner.master.displayAvatarURL({ extension: `png`, forceStatic: true }))
        await card.addContent({
            avatar: initiatorAvatar,
            justify: `center`,
            marginTop: 80,
            marginLeft: -32,
            avatarRadius: 24,
            inline: true
        })
        await card.addContent({
            avatar: partnerAvatar,
            justify: `center`,
            marginTop: 80,
            marginLeft: 32,
            avatarRadius: 24
        })
        card.ready()
        return card.getBuffer()
    }
}

module.exports = UI
