const { Canvas } = require(`canvas-constructor`)
const { resolve, join } = require(`path`)
const Theme = require(`../../ui/colors/themes`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/Roboto.ttf`)), `Roboto`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-medium.ttf`)), `RobotoMedium`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-bold.ttf`)), `RobotoBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/roboto-thin.ttf`)), `RobotoThin`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/Whitney.otf`)), `Whitney`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/KosugiMaru.ttf`)), `KosugiMaru`)

async function relation(stacks, member) {
    const { meta: {data}, bot: {db} } = stacks
    const rank = stacks.meta.data.rank

    /**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user's rank color.
     */
    const userdata = data
    const user = {
        id: userdata.userId,
        cur: userdata.currentexp,
        max: userdata.maxexp,
        crv: userdata.nextexpcurve,
        lvl: userdata.level,
        ac: userdata.artcoins,
        rep: userdata.reputations,
        des: userdata.description,
        ui: userdata.interfacemode,
        prt: userdata.partner,
        rtg: userdata.rating,
        likecount: userdata.liked_counts,
        cov: userdata.cover,
        log: userdata.last_login,
        theme: Theme[userdata.interfacemode]
    }
    const relations = await db.userRelations(member.id)

    const familyrelations = relations.filter((e) => {
        if (e.theirRelation == `bestie`) return false
        if (e.theirRelation == `soulmate`) return false
        if (e.theirRelation == `senpai`) return false
        if (e.theirRelation == `kouhai`) return false
        return true
    })

    let canvas_x = 320//300
    let canvas_y = 420//400
    let startPos_x = 10
    let startPos_y = 10
    let baseWidth = canvas_x - 20
    let baseHeight = canvas_y - 20


    const avatar = await stacks.avatar(member.id, true)

    let canv = new Canvas(canvas_x, canvas_y) // x y

    /**
     *    CARD BASE
     */
    canv = canv.setShadowColor(`rgba(28, 28, 28, 1)`)
        .setShadowOffsetY(5)
        .setShadowBlur(10)
        .setColor(user.theme.main)
        .addRect(startPos_x + 7, startPos_y + 7, baseWidth - 14, baseHeight - 14) // (x, y, x2, y2)
        .createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
        .addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
        .setShadowBlur(0)
        .setShadowOffsetY(0)
        .save()

    /**
     *    USER
     *    AVATAR
     */
    canv.addRoundImage(avatar, 15, 15, 30, 30, 15)

    /**
     *    TITLE BAR
     */
        .setColor(user.theme.text)
        .setTextAlign(`left`)
        .setTextFont(`11pt RobotoBold`)
        .addText(`Family`, 55, 35)
        .setColor(user.theme.separator)
        .addRect(startPos_x, 48, baseWidth, 2) // bottom border

    if (relations.length == 0) {
        return canv.toBuffer()
    }


    const listEntry = (username, avatar, relation, x, y) => {
        canv.setColor(rank.color)
            .addRoundImage(avatar, x + 4, y, 38, 38, 19)
            .setTextAlign(`left`)
            .setTextFont(`13pt RobotoBold`)
            .addText(username, x + 50, y + 20)
            .setColor(user.theme.text)
            .setTextFont(`8pt RobotoBold`)
            .addText(relation, x + 50, y + 34)
    }

    for (var i=0;i<Math.min(familyrelations.length, 9); i++) {
        var relUser = await stacks.bot.fetchUser(familyrelations[i].theirUserId)
        var userAvatar = await stacks.avatar(relUser.id, true)
        listEntry(relUser.username, userAvatar, familyrelations[i].theirRelation, 30, 70 + i*33)
    }

    canv.setTextAlign(`left`)
        .setTextFont(`10pt RobotoBold`)
        .addText(`I have a total of `+familyrelations.length+` family members ❤`, 30, 390)


    return canv.toBuffer()

}

module.exports = relation