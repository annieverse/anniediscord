const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { get } = require("snekfetch");
const Color = require('color');
const profileManager = require(`./profileManager`)
const databaseManager = require(`./databaseManager`)
const rankManager = require(`./ranksManager`)
const palette = require(`./colorset`)
const probe = require(`probe-image-size`)
const sql = require(`sqlite`);
sql.open(`.data/database.sqlite`)

Canvas.registerFont(resolve(join(__dirname, "../fonts/Roboto.ttf")), "Roboto");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");
Canvas.registerFont(resolve(join(__dirname, "../fonts/KosugiMaru.ttf")), "KosugiMaru");

async function portfolio(stacks, member) {
    const configProfile = new profileManager();
    const collection = new databaseManager(member.id);
    const configRank = new rankManager(stacks.bot, stacks.message)
    const { pause } = stacks;


    /**
     * id = userid, cur = currentexp, max = maxexp,
     * crv = expcurve, lvl = userlevel, ac = userartcoins,
     * rep = userreputation, des = userdescription, ui = userinterfacemode
     * clr = hex code of user's rank color.
     */
    const userdata = await collection.userdata;
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
        get clr() {
            return this.ui === "light_profileskin" ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex() :
                this.ui === "dark_profileskin" ? (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.1)).hex() :
                (Color(configRank.ranksCheck(this.lvl).color).desaturate(0.2)).hex()
        },
    }

    const switchColor = {

        "dark_profileskin": {
            base: palette.nightmode,
            border: palette.deepnight,
            text: palette.white,
            secondaryText: palette.lightgray
        },

        "light_profileskin": {
            base: palette.white,
            border: palette.lightgray,
            text: palette.darkmatte,
            secondaryText: palette.blankgray
        }
    }

    let canvas_x = 790;
    let canvas_y = 355;
    let startPos_x = 15;
    let startPos_y = 15;
    let baseWidth = canvas_x - 40;
    let baseHeight = canvas_y - 50;

    const usercolor = configProfile.checkInterface(user.ui, member);


    let canv = new Canvas(canvas_x, canvas_y) // x y


    canv = canv.setColor(user.clr)
        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .save() // checkpoint

        .setColor(user.clr)
        .save() // stack 1


        /**
         *    CARD BASE
         *    850 x 400
         * 
         */
        .setShadowColor("rgba(28, 28, 28, 1)")
        .setShadowOffsetY(12)
        .setShadowBlur(18)
        .setColor(palette.darkmatte)
        .addRect(startPos_x + 10, startPos_y + 10, baseWidth - 20, baseHeight - 20) // (x, y, x2, y2)
        .createBeveledClip(startPos_x, startPos_y, baseWidth, baseHeight, 25)
        .setColor(switchColor[usercolor].base)
        .addRect(startPos_x, startPos_y, baseWidth, baseHeight) // (x, y, x2, y2)
        .setShadowBlur(0)
        .setShadowOffsetY(0)
        .save() // stack 2




    async function gridImage(posx, posy, dx, dy) {
        return sql.all(`SELECT url FROM userartworks WHERE userId = ${member.id} ORDER BY timestamp DESC`)
            .then(async res => {


                async function aspectRatio(src, suffix) {
                    return probe(src, async (err, data) => {
                        try {
                            if (err) console.log(err);
                            let width = data.width;
                            let height = data.height;
                            let smallest = width > height ? height : width;


                            if (smallest < dx) {
                                for (let i = smallest * 0.1; smallest < dx; i + (smallest * 0.1)) {
                                    width = Math.floor(width + i);
                                    height = Math.floor(height + i);
                                    smallest = Math.floor(smallest + i);
                                }
                            } else {
                                for (let i = 0.90; smallest > dx + 30; i - 0.05) {
                                    width = Math.floor(width * i);
                                    height = Math.floor(height * i);
                                    smallest = Math.floor(smallest * i);
                                }
                            }


                            let {
                                body: photo
                            } = await get(src);
                            let highest = width > height ? width : height;
                            canv.setColor(switchColor[usercolor].border)
                                .createBeveledClip(posx + suffix, posy, dx, dy, 0)
                                .addImage(await photo, posx + suffix, posy, width, height, 1)
                                .restore();
                        } catch (e) {
                            //console.log(err);
                            sql.run(`DELETE FROM userartworks WHERE url = "${src}"`);
                        }
                    })
                }

                async function nullCollection() {
                    canv.setColor(switchColor[usercolor].secondaryText)
                        .setTextAlign("center")
                        .setTextFont(`15pt RobotoBold`)
                        .addText(`No post yet.`, (baseWidth / 2) + 25, 230)
                        .addImage(await configProfile.getAsset('anniewot'), 350, 125, 80, 80, 40);
                }


                if (res.length < 1) {
                    return nullCollection();
                } else {
                    canv.setColor(switchColor[usercolor].border)
                        .addRect(posx, posy, dx, dy)
                        .addRect(posx + (dx * 1) + 2, posy, dx, dy)
                        .addRect(posx + (dx * 2) + 4, posy, dx, dy)

                        .save()
                        .save()
                        .save()
                        .save()
                        .save()
                        .save()
                        .save();

                    if (res.length === 1) {
                        await aspectRatio(res[0].url, 0);
                    } else if (res.length == 2) {
                        await aspectRatio(res[0].url, 0);
                        await aspectRatio(res[1].url, (dx * 1) + 2);

                    } else if (res.length >= 3) {
                        await aspectRatio(res[0].url, 0);
                        await aspectRatio(res[1].url, (dx * 1) + 2);
                        await aspectRatio(res[2].url, (dx * 2) + 4);
                    }

                }
            })
    }

    /**
     *    USER
     *    AVATAR
     * 
     */
    //canv.addRoundImage(avatar, 30, 30, 40, 40, 20)

    /**
     *    title
     * 
     */
    canv.setColor(user.clr)
        .setTextAlign("left")
        .setTextFont(`15pt Whitney`)
        .addText(`Portfolio`, (baseWidth / 2) + 25, 50)


        /**
         *    nickname
         * 
         */
        .setColor(switchColor[usercolor].secondaryText)
        .setTextAlign("right")
        .setTextFont(`15pt Whitney`)
        .addText(`${member.user.username} |`, (baseWidth / 2) + 20, 50)




    canv.restore()
    await gridImage(startPos_x, 70, 250, 250);
    await pause(10000)

    return canv.toBuffer();

}

module.exports = portfolio