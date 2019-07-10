const Discord = require('discord.js');
const { Attachment } = require('discord.js')
const formatManager = require('../../utils/formatManager');
const databaseManager = require('../../utils/databaseManager');
const sql = require(`sqlite`);
const { Canvas } = require("canvas-constructor");
const { resolve, join } = require("path");
const { get } = require("snekfetch");
const imageUrlRegex = /\?size=2048$/g;
const ms = require('parse-ms');
const cards = require('../../utils/cards-metadata.json');
const request = require('request')
const cheerio = require(`cheerio`);
const { loadImage } = require('canvas')

const probe = require(`probe-image-size`)

Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-black.ttf")), "RobotoBlack");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../../fonts/Whitney.otf")), "Whitney");

class leaderboard {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    async execute() {

        const { message, palette, pause, args, bot, emoji } = this.stacks;

        /// leaderboard.js
        ///
        ///    LEADERBOARD COMMAND
        ///    changes log:
        ///    06/02/19 - Classes structure. Refactor. Canvas-powered leaderboard.
        ///    12/21/18 - Structure reworks & added event leaderboard.
        ///    11/12/18 - Interface reworks.
        ///    10/24/18 - Added AC ranking, structure & embed changes.
        ///    10/18/18(2) - Mention bug fix.
        ///    10/18/18 - New command.
        ///
        ///  -naphnaphz


        const format = new formatManager(message);

        //  Centralized object
        let metadata = {
            keywords: {
                xp: [`xp`, `exp`, `lvl`, `level`],
                ac: [`ac`, `artcoins`, `artcoin`, `balance`],
                rep: [`fame`, `rep`, `reputation`, `reputations`, `reps`],
                arts: [`artists`, `artist`, `art`, `arts`, `artwork`]
            },
            get whole_keywords() {
                let arr = [];
                for (let key in this.keywords) {
                    arr.push(...this.keywords[key]);
                }
                return arr;
            }
        }


        //  Pre-defined messages.
        const log = (props = {}, ...opt) => {
            const logtext = {
                "SHORT_GUIDE": {
                    msg: `Hey **${message.author.username}**! checkout our new leaderboard!
                          \`>lb exp\` for level
                          \`>lb ac\` for artcoins
                          \`>lb fame\` for reputations
                          \`>lb art\` for favorite artists`,
                    color: palette.darkmatte
                },

                "INVALID_CATEGORY": {
                    msg: `Sorry i can't recognize that category. Try use \`lvl/ac/reps\` instead.`,
                    color: palette.darkmatte
                },

                "AUTHOR_RANK": {
                    msg: `You are currently **#${format.threeDigitsComa(opt[0] + 1)}** with total **${format.threeDigitsComa(opt[1])} ${opt[2]}**`,
                    color: palette.darkmatte
                },

                "UNRANKED": {
                    msg: `You are unranked.`,
                    color: palette.darkmatte
                }
            }

            const res = logtext[props.code];
            return format.embedWrapper(res.color, res.msg);
        }

        //  Render the image
        const render = async (defined_x, defined_y) => {

            //  Canvas metadata
            const size = {
                x: defined_x,
                y: defined_y,
                x2: 10,
                y2: 15,
            }


            //  Pull required data.
            sql.open(`.data/database.sqlite`);
            const dbmanager = new databaseManager(message.author.id);
            metadata.user = await dbmanager.userMetadata;

            const ranking = {
                xpgroup: [],
                acgroup: [],
                repgroup: [],
                artgroup: [],
                async pullingData() {
                    let leaderboardLength = 10;
                    for (let i = 0; i < leaderboardLength; i++) {
                        this.xpgroup.push({
                            id: await dbmanager.indexRanking('userdata', 'currentexp', i, 'userId'),
                            xp: await dbmanager.indexRanking('userdata', 'currentexp', i, 'currentexp'),
                            lv: await dbmanager.indexRanking('userdata', 'currentexp', i, 'level')
                        })
                        this.acgroup.push({
                            id: await dbmanager.indexRanking('userinventories', 'artcoins', i, 'userId'),
                            ac: await dbmanager.indexRanking('userinventories', 'artcoins', i, 'artcoins')
                        })
                        this.repgroup.push({
                            id: await dbmanager.indexRanking('userdata', 'reputations', i, 'userId'),
                            rep: await dbmanager.indexRanking('userdata', 'reputations', i, 'reputations')
                        })
                        this.artgroup.push({
                            id: await dbmanager.indexRanking(`userdata`, `liked_counts`, i, `userId`),
                            liked_count: await dbmanager.indexRanking(`userdata`, `liked_counts`, i, `liked_counts`)
                        })

                        // To not display Pan on any leaderboard
                        if (this.acgroup.some(x => x.id === '277266191540551680')) {
                            await this.personToDelete("277266191540551680", this.acgroup);
                            leaderboardLength++;
                        }
                    }


                },

                async user() {
                    await this.pullingData();
                    return {
                        xpgroup: this.xpgroup,
                        acgroup: this.acgroup,
                        repgroup: this.repgroup,
                        artgroup: this.artgroup,
                        authorindex_xp: await dbmanager.authorIndexRanking('userdata', 'currentexp'),
                        authorindex_ac: await dbmanager.authorIndexRanking('userinventories', 'artcoins'),
                        authorindex_rep: await dbmanager.authorIndexRanking('userdata', 'reputations'),
                        authorindex_art: await dbmanager.authorIndexRanking(`userdata`, `liked_counts`)
                    }
                },
                async personToDelete(personId, array) {
                    if (array.some(x => x.id === personId)) {
                        for (let index = 0; index < array.length; index++) {
                            const personToDelete = array[index];
                            if (personToDelete.id === personId) {
                                let i = array.indexOf(array[index])
                                deleteObjectFromArr(array, i)
                            }
                        }
                    }

                    function deleteObjectFromArr(arr, i) {
                        var index = i;
                        if (index > -1) {
                            arr.splice(index, 1);
                        }
                    }
                }
            }
            const user = await ranking.user();


            let canv = new Canvas(size.x, size.y);


            //  Bundled functions for each row rendering task.
            class Row {
                constructor(index, distancey, group) {
                    this.index = index;
                    this.y = distancey * (this.index + 1);
                    this.group = group;
                }


                //  Adapt the text to match with the background
                get text_check() {
                    return this.highlight_user ? canv.setColor(palette.white) : canv.setColor(palette.golden);
                }


                //  Make sure the nickname length is not greater than 10 characters
                get nickname_formatter() {
                    let name;
                    try {
                        name = bot.users.get(user[this.group][this.index].id).username;
                    } catch (err) {
                        name = "User Left";
                    }
                    return name.length >= 10 ? `${name.substring(0, 9)}..` : name;
                }


                //  Return nickname
                get nickname() {
                    canv.setTextAlign("left")
                    canv.setColor(palette.white)
                    canv.setTextFont(`12pt RobotoBlack`)
                        .addText(this.nickname_formatter, size.x2 + 160, this.y)
                    return this;
                }


                //  Returns reputation points
                get reputation() {
                    const reps = format.threeDigitsComa(user[this.group][this.index].rep);
                    this.text_check;
                    canv.setTextAlign("right")
                    canv.setTextFont(`15pt RobotoBlack`)
                        .addText(`${reps} ☆`, size.x - 50, this.y)
                    return this;
                }


                //  Highlight if user is in the top ten list
                get highlight() {
                    if (user[this.group][this.index].id === message.author.id) {
                        this.highlight_user = true;
                        canv.setColor(palette.golden)
                            .addRect(size.x2, this.y - 35, size.x - size.x2, 60)
                            .restore()
                    }
                    canv.restore();
                    return this;
                }


                //  Returns user liked post
                get liked() {
                    const reps = format.threeDigitsComa(user[this.group][this.index].liked_count);
                    this.text_check;
                    canv.setTextAlign(`right`)
                    canv.setTextFont(`15pt RobotoBlack`)
                        .addText(`${reps} ❤`, size.x - 50, this.y)
                    return this;
                }


                //  Returns user artcoins
                get artcoins() {
                    this.text_check;
                    canv.setTextFont(`15pt RobotoBlack`)
                        .setTextAlign("right")
                        .addText(format.threeDigitsComa(user[this.group][this.index].ac), size.x - 50, this.y);
                    return this;
                }


                //  Return user level
                get level() {
                    this.text_check;
                    canv.setTextAlign("right")
                    canv.setTextFont(`15pt Robotoblack`)
                        .addText(user[this.group][this.index].lv, size.x - 50, this.y)
                    return this;
                }


                //  Return current exp
                get exp() {
                    canv.setTextAlign("left")
                    canv.setTextFont(`12pt Whitney`)
                    canv.addText(format.threeDigitsComa(user[this.group][this.index].xp) + ` XP`, size.x2 + 160, this.y + 20)
                    return this;
                }


                //  Return current ranking
                get position() {
                    canv.setColor(palette.white)
                    canv.setTextAlign("left")
                    canv.setTextFont(`17pt RobotoBold`)
                    canv.addText(`#${this.index + 1}`, size.x2 + 30, this.y)
                    return this;
                }


                //  Returns avatar
                async avatar() {
                    let identify_user;
                    try {
                        identify_user = bot.users.get(user[this.group][this.index].id).displayAvatarURL.replace(imageUrlRegex, "?size=256");
                    } catch (err) {
                        identify_user = bot.user.displayAvatarURL.replace(imageUrlRegex, "?size=256");
                    }
                    const { body: avatar } = await get(identify_user);
                    canv.addRoundImage(await avatar, size.x2 + 80, this.y - 30, 50, 50, 25)
                    return this;
                }

            }


            //  Bundled functions for leaderboard interface.
            class Leaderboard {

                constructor(group) {
                    this.group = group
                }

                //  Level leaderboard
                async xp() {
                    metadata.title = `${emoji(`aauBell`, bot)} **| Level Leaders**`;
                    metadata.footer_components = [user.authorindex_xp, metadata.user.currentexp, `EXP`];

                    for (let i = 0; i < user.xpgroup.length; i++) {
                        canv.save()
                            .save();

                        new Row(i, 65, `xpgroup`)
                            .highlight
                            .nickname
                            .exp
                            .level
                            .position
                            .avatar()
                        await pause(500);

                        canv.restore();
                    }
                }


                //  Artcoins leaderboard
                async ac() {
                    metadata.title = `${emoji(`artcoins`, bot)} **| Artcoins Leaders**`;
                    metadata.footer_components = [user.authorindex_ac, metadata.user.artcoins, `${emoji(`artcoins`, bot)}`];

                    for (let i = 0; i < user.acgroup.length; i++) {
                        canv.save()
                            .save();

                        new Row(i, 65, `acgroup`)
                            .highlight
                            .nickname
                            .position
                            .artcoins
                            .avatar()
                        await pause(500);

                        canv.restore();
                    }
                }


                //  Reputations leaderboard
                async rep() {
                    metadata.title = `${emoji(`wowo`, bot)} **| Popularity Leaders**`;
                    metadata.footer_components = [user.authorindex_rep, metadata.user.reputations, `☆`];

                    for (let i = 0; i < user.repgroup.length; i++) {
                        canv.save()
                            .save();

                        new Row(i, 65, `repgroup`)
                            .highlight
                            .nickname
                            .position
                            .reputation
                            .avatar()
                        await pause(500);

                        canv.restore();
                    }
                }


                //  Artists leaderboard
                async arts() {
                    metadata.title = `${emoji(`hapiicat`, bot)} **| Artists Leaders**`;
                    metadata.footer_components = [user.authorindex_art, metadata.user.liked_counts, `♡`];

                    for (let i = 0; i < user.artgroup.length; i++) {
                        canv.save()
                            .save();

                        new Row(i, 65, `artgroup`)
                            .highlight
                            .nickname
                            .position
                            .liked
                            .avatar()
                        await pause(500);

                        canv.restore();
                    }
                }


                //  Card background layer
                base() {
                    canv.setShadowColor("rgba(28, 28, 28, 1)")
                        .setShadowOffsetY(7)
                        .setShadowBlur(15)
                        .setColor(palette.darkmatte)

                        .addRect(size.x2 + 15, size.y2 + 10, size.x - 45, size.y - 45)
                        .createBeveledClip(size.x2, size.y2, size.x - 20, size.y - 20, 15)
                        .setShadowBlur(0)
                        .setShadowOffsetY(0)
                        .setColor(palette.nightmode)
                        .addRect(size.x2, size.y2, size.x, size.y)
                        .addRect(size.x2 + 150, size.y2, size.x, size.y)
                        .restore()
                        .setColor(palette.white)
                        .setTextFont(`16pt RobotoBold`)
                }


                //  Method selector
                get setup() {
                    this.base();
                    return this[this.group]();
                }

            }


            await new Leaderboard(metadata.selected_group).setup;
            return {
                img: canv.toBuffer(),
                title: metadata.title
            }
        }


        //  Get parent group
        const getGroup = () => {
            for (let key in metadata.keywords) {
                if (metadata.keywords[key].includes(args[0].toLowerCase())) {
                    return key;
                }
            }
        }


        //  Core processes
        const main = async () => {

            return message.channel.send(`\`fetching leaderboard data .. please be patient\``)
                .then(async load => {
                    const res = await render(400, 700);

                    message.channel.send(metadata.title, new Discord.Attachment(res.img, `leaderboard.jpg`))
                        .then(() => {
                            load.delete();
                            log({ code: metadata.footer_components[1] ? `AUTHOR_RANK` : `UNRANKED` },
                                ...metadata.footer_components);
                        })
                })
        }


        //  Initializer
        const run = async () => {


            //  Returns for non-bot channels
            if (!["bot", "bot-games", "cmds", `sandbox`].includes(message.channel.name)) return;


            //  Returns if no argument was specified.
            if (!args[0]) return log({ code: `SHORT_GUIDE` });


            //  Returns if the category is invalid.
            if (!metadata.whole_keywords.includes(args[0].toLowerCase())) return log({ code: `INVALID_CATEGORY` });


            //  Success passing the conditions.
            metadata.selected_group = getGroup();
            main();
        }

        run()
    }
}

class daily {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.stacks = Stacks;
    }

    async execute() {
        let message = this.message;
        let bot = this.stacks.bot;
        let palette = this.stacks.palette;
        /// dailyjs
        ///
        ///  daily command
        ///    change logs:
        ///         05/17/19 - Fixed dailies streak bug.
        ///		      05/13/19 - Added dreamer desire.
        ///		    01/23/19 - Consecutive daily multiplier added.
        ///       12/24/18 - Restrict channel.
        ///       11/12/18 - Original colorset.
        ///       10/18/18 - halloween colorset
        ///       10/12/18 - Minor embed changes.
        ///       09/17/18 - Frying Pan's daily system.
        ///       09/18/18 - reworked embed.
        ///
        ///     -naphnaphz
        ///     -Frying Pan
        ///     -Fwubbles



        const format = new formatManager(message)
        return [`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name) ? dailies() :
            format.embedWrapper(palette.darkmatte, `Unavailable access.`)

        async function dailies() {

            sql.open(".data/database.sqlite");

            // Request user's collection data.
            const cards_collection = () => {
                return sql.get(`SELECT poppy_card FROM collections WHERE userId = ${message.author.id}`)
                    .then(async data => data);
            }

            let cooldown = 8.64e+7;
            let streakcooldown = 25.92e+7;
            let amount = 250;
            let user = message.author.username;
            const has_poppy = Object.values(await cards_collection());


            sql.get(`SELECT * FROM usercheck WHERE userId ="${message.author.id}"`)
                .then(async usercheckrow => {
                    if (usercheckrow) {
                        if ((usercheckrow.lastdaily !== null) && cooldown - (Date.now() - usercheckrow.lastdaily) > 0) {
                            let timeObj = ms(cooldown - (Date.now() - usercheckrow.lastdaily));
                            return format.embedWrapper(
                                palette.red,
                                `Hey **${user}**, your next dailies will be available in`)
                                .then(async msg => {
                                    msg.channel.send(`**${timeObj.hours} h** : **${timeObj.minutes} m** : **${timeObj.seconds} s**`)
                                })
                        } else {

                            let skill = cards.poppy_card.skills.main;
                            let has_poppy_check = has_poppy[0] > 0 ? true : false;
                            let isItStreaking = has_poppy_check ? true : ms(streakcooldown - (Date.now() - usercheckrow.lastdaily)).days >= 1 ? true : false;
                            let countStreak = usercheckrow.totaldailystreak < 1 ? 1 : isItStreaking ? usercheckrow.totaldailystreak + 1 : 0
                            let bonus = countStreak !== 0 ? 12 * countStreak : 0;


                            sql.run(`UPDATE usercheck SET totaldailystreak = ${countStreak}, lastdaily = "${Date.now()}" WHERE userId = ${message.author.id}`);
                            sql.run(`UPDATE userinventories SET artcoins = artcoins + ${amount + bonus} WHERE userId = ${message.author.id}`);
                            return format.embedWrapper(
                                has_poppy_check ? palette.purple : palette.halloween,
                                `**${user}** has received ${utils.emoji(`artcoins`, bot)}**${amount}${isItStreaking ? `(+${bonus})` : `\u200b`}** artcoins! ${isItStreaking ? `
                                    **${countStreak} days of consecutive claims. ${has_poppy_check ? `${skill.name} Effect.` : ``}**` : `!\u200b`}`
                            )
                        }
                    } else {
                        return format.embedWrapper(
                            palette.darkmatte,
                            `Sorry **${user}**! your profile data is missing. I'll send this`
                        )
                    }
                })
        }
    }
}

class test {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    async addRole() {
        if (!this.stacks.message.member.hasPermission("MANAGE_ROLES") || this.required_roles) return this.stacks.utils.sendEmbed(this.stacks.code.UNAUTHORIZED_ACCESS, this.stacks.palette.red);
        if (!this.stacks.args[0]) return this.stacks.utils.sendEmbed(this.stacks.code.ADDROLE.NO_USER, this.stacks.palette.red);
        let pUser = await this.stacks.utils.userFinding(this.stacks.args[0] || this.stacks.message.mentions.users.first())
        if (!pUser || pUser === null) return this.stacks.reply(this.stacks.code.ADDROLE.NO_USER_FOUND, {
            socket: [this.stacks.message.author],
            color: this.stacks.palette.red
        });
        if (!this.stacks.args[1]) return this.stacks.utils.sendEmbed(this.stacks.code.ADDROLE.NO_ROLE_SPECIFIED, this.stacks.palette.red);
        let role = this.stacks.args[1].substring(3, 21);
        let gRole = this.stacks.message.guild.roles.get(role);
        if (!gRole) return this.stacks.reply(this.stacks.code.ADDROLE.NO_ROLE_FOUND, {
            socket: [this.stacks.message.author],
            color: this.stacks.palette.red
        });
        if (this.stacks.hasRole(gRole.name)) return this.stacks.reply(this.stacks.code.ADDROLE.HAS_ROLE_ALREADY, {
            socket: [this.stacks.message.author],
            color: this.stacks.palette.red
        });
        await (this.stacks.addRole(gRole.name, pUser.id));
        this.stacks.message.react("👌")
        try {
            this.stacks.reply(this.stacks.code.ADDROLE.ROLE_ADDED, {
                color: this.stacks.palette.green,
                field: pUser,
                socket: [pUser, gRole.name]
            }).catch(() => {
                return this.stacks.reply(this.stacks.code.ADDROLE.DMS_LOCKED, {
                    color: this.stacks.palette.green,
                    socket: [pUser, gRole.name]
                })
            })
        } catch (e) {
            return this.stacks.reply(this.stacks.code.ADDROLE.DMS_LOCKED, {
                color: this.stacks.palette.green,
                socket: [pUser, gRole.name]
            })
        }
    }
    async execute() {
        const { message, bot } = this.stacks;
        this.addRole();
    }
}

class imageSearch {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    async execute() {

        const { message, bot, args } = this.stacks;

        image(message, args)

        function image(message, parts) {

            /* extract search query from message */

            var search = parts.join(" "); // Slices of the command part of the array ["!image", "cute", "dog"] ---> ["cute", "dog"] ---> "cute dog"

            var options = {
                url: "http://results.dogpile.com/serp?qc=images&q=" + search,
                method: "GET",
                headers: {
                    "Accept": "text/html",
                    "User-Agent": "Chrome"
                }
            };

            request(options, async function (error, response, responseBody) {
                if (error) {
                    // handle error
                    return;
                }

                /* Extract image URLs from responseBody using cheerio */

                var $ = cheerio.load(responseBody); // load responseBody into cheerio (jQuery)

                // In this search engine they use ".image a.link" as their css selector for image links
                var links = $(".image a.link");

                // We want to fetch the URLs not the DOM nodes, we do this with jQuery's .attr() function
                // this line might be hard to understand but it goes thru all the links (DOM) and stores each url in an array called urls
                var urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr("href"));
                //console.log(urls);

                if (!urls.length) {
                    // Handle no results
                    return;
                }

                var item = urls[Math.floor(Math.random() * urls.length)];
                item = urls[0]
                await canvas()
                
                async function canvas(){
                    try {
                        const buffer = await profile(item);
                        let filename = `SomeImage.jpg`;
                        let attachment = new Attachment(buffer.canvOne, filename);
                        await message.channel.send(attachment);

                    } catch (error) {
                        return message.channel.send(`An error ocurred: **${error.message}**`);
                    }

                    async function profile(image) {
                        try {
                            //let myimg = await loadImage(urls[0])
                            //console.log(myimg)

                            probe(urls[0]);

                            probe(src, async (err, data) => {
                                let suffix=0
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


                                    canvOne.addImage(await photo, 0, 0, width, height, 1)
                                    canvOne.toBuffer();

                                } catch (e) {
                                    //console.log(err);

                                }
                            })
                            /*
                            var scale = Math.min((200 / myimg.width), (200 / myimg.height));
                            myimg.width = myimg.width * scale;
                            myimg.height = myimg.height * scale;
                            */
                            const canvOne = new Canvas(700,900);
                            
                            return { canvOne };
                        } catch (error) {
                            await message.channel.send(`An error occurred: **${error.message}**`);
                        }

                        let dx = 250;
                        let dy = 250;
                        async function aspectRatio(src, suffix) {
                            return 
                        }
                    }
                }
                
                // Send result
                //message.channel.send(urls[0]);
            });
        }
    }
}

class xp {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    /**
     * Main experience formula used in Annie's level system
     * @param {Integer} x current exp
     * @param {Integer} level current level
     * @param {Integer} b current max exp/cap exp
     * @param {integer} c current curve exp until next exp cap
     * @formula
     */
    formula(x, level, b, c){
        for (let i = 150; i !== x; i += c) {
            b += c;
            c += 200;
            level++;
            if (i > x) {
                break;
            }
        }
        return {
            x: x,
            level: level,
            b: b,
            c: c

        }
    }


    async execute() {

    }
}

module.exports.help = {
    start: imageSearch,
    name: "pansSandbox",
    aliases: ["_-"],
    description: `Pans testing grounds`,
    usage: `${require(`../../.data/environment.json`).prefix}_collection`,
    group: "General",
    public: false,
    require_usermetadata: true,
    multi_user: true
}