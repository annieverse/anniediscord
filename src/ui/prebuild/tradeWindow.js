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
        //  Two avatars side by side.
        //
        //  cards.js `addContent` has a quirk: when `justify: 'center'` is
        //  passed for an avatar, the helper at addContent:422 returns
        //  width/2 directly and IGNORES marginLeft. So if both draws use
        //  justify:'center', they land at the same X and the second avatar
        //  paints on top of the first — looks like only one avatar.
        //
        //  Workaround: pass explicit marginLeft and drop justify entirely.
        //  With width=260 and 48×48 avatars (radius 24), centering both
        //  with a small gap at the centerline lands the initiator at x=78
        //  and the partner at x=134.
        const cardCenter = 260 / 2
        const avatarRadius = 24
        const avatarSize = avatarRadius * 2
        const halfGap = 4
        const initiatorMarginLeft = cardCenter - avatarSize - halfGap
        const partnerMarginLeft = cardCenter + halfGap
        //  After addContent draws the avatar, we know the exact pixel box
        //  it occupies (cards.js:435 uses `avatarMarginLeft()` for x and
        //  `(reservedSpace + marginTop) - 3` for y, where reservedSpace is
        //  zero before the first avatar draw and stays zero between
        //  inline:true draws on the same row). With marginTop=80 across
        //  both avatars the y of the box is 77; add the radius for the
        //  circle's center.
        const avatarBoxY = 80 - 3
        const avatarCenterY = avatarBoxY + avatarRadius
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
        //  Inner-border ring around each avatar, painted in the theme's
        //  primary color. Drawing AFTER addContent so it lands on top of
        //  the avatar pixels rather than under them. Stroke is inset by
        //  half the line width so the ring sits cleanly inside the
        //  avatar's circular crop instead of bleeding past the edge.
        const borderColor = card.color && card.color.main ? card.color.main : `#ffffff`
        const borderWidth = 4
        const strokeRadius = avatarRadius - (borderWidth / 2)
        const drawRing = (x) => {
            card.canv
                .save()
                .setStroke(borderColor)
                .setStrokeWidth(borderWidth)
                .beginPath()
                .arc(x + avatarRadius, avatarCenterY, strokeRadius, 0, Math.PI * 2)
                .stroke()
                .restore()
        }
        drawRing(initiatorMarginLeft)
        drawRing(partnerMarginLeft)
        card.ready()
        return card.getBuffer()
    }
}

module.exports = UI
