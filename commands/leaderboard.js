const Discord = require('discord.js');
const palette = require('../colorset.json');
const formatManager = require('../utils/formatManager');
const databaseManager = require('../utils/databaseManager');
const sql = require(`sqlite`);
const { Canvas } = require("canvas-constructor"); 
const { resolve, join } = require("path");
const { get } = require("snekfetch");
const imageUrlRegex = /\?size=2048$/g; 



Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-medium.ttf")), "RobotoMedium");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-bold.ttf")), "RobotoBold");
Canvas.registerFont(resolve(join(__dirname, "../fonts/roboto-thin.ttf")), "RobotoThin");
Canvas.registerFont(resolve(join(__dirname, "../fonts/Whitney.otf")), "Whitney");


module.exports.run = async(bot,_command, message, args)=> {

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

const env = require(`../.data/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);

return ["bot", "bot-games", "cmds", `sandbox`].includes(message.channel.name) ? leaderboardInit()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


async function leaderboardInit() {


    //  Centralized object
    let metadata = {
        keywords: {
            xp: [`xp`, `exp`, `lv`, `level`],
            ac: [`ac`, `artcoins`, `artcoin`, `balance`],
            rep: [`fame`, `rep`, `reputation`, `reputations`, `reps`]
        },
        get whole_keywords() {
            return [...this.keywords.xp, ...this.keywords.ac, ...this.keywords.rep]
        }
    }


    //  Pull required data.
    sql.open(`.data/database.sqlite`);
    const dbmanager = new databaseManager(message.author.id);
    metadata.user = await dbmanager.userMetadata;
    const ranking = {
        xpgroup: [],
        acgroup: [],
        repgroup: [],
        async pullingData() {
            for(let i = 0; i<10; i++) {
                this.xpgroup.push({
                    id: await dbmanager.indexRanking('userdata', 'currentexp', i, 'userId'),
                    xp: await dbmanager.indexRanking('userdata', 'currentexp', i, 'currentexp'),
                    lv: await dbmanager.indexRanking('userdata', 'currentexp', i, 'level')
                })
                this.acgroup.push({
                    id: await dbmanager.indexRanking('userinventories', 'artcoins',   i, 'userId'),
                    ac: await dbmanager.indexRanking('userinventories', 'artcoins',   i, 'artcoins')
                }),
                this.repgroup.push({
                    id: await dbmanager.indexRanking('userdata', 'reputations',   i, 'userId'),
                    rep: await dbmanager.indexRanking('userdata', 'reputations',   i, 'reputations')
                })
            }
        },
        async user() {
            await this.pullingData();
            return {
                xpgroup: this.xpgroup,
                acgroup: this.acgroup,
                repgroup: this.repgroup,
                authorindex_xp: await dbmanager.authorIndexRanking('userdata', 'currentexp'),
                authorindex_ac: await dbmanager.authorIndexRanking('userinventories', 'artcoins'),
                authorindex_rep: await dbmanager.authorIndexRanking('userdata', 'reputations')
            }
        }
    }
    const user = await ranking.user();


    //  Pre-defined messages.
    const log = (props = {}, ...opt) => {
        const logtext = {
            "SHORT_GUIDE": {
                msg: `**${message.author.username}**, checkout our leaderboard! type \`>lb xp/ac/fame\`.`,
                color: palette.darkmatte
            },

            "INVALID_CATEGORY": {
                msg: `Sorry i can't recognize that category. Try use \`lvl/ac/reps\` instead.`,
                color: palette.darkmatte
            },

            "AUTHOR_RANK": {
                msg: `You are currently **${format.ordinalSuffix(opt[0] + 1)}** with total **${format.threeDigitsComa(opt[1])} ${opt[2]}**`,
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


    // Parsing emoji by its name.
    const emoji = name => {
        return bot.emojis.find(e => e.name === name)
    }


    //  Promise
    const pause = (ms) => {
        return new Promise(resolve => setTimeout(resolve,ms));
    }


    //  Render the image
    const render = async (defined_x, defined_y) => {

        //  Canvas metadata
        const size = {
            x: defined_x,
            y: defined_y,
            x2: 10,
            y2: 15,
        };


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
                    this.highlight_user ? canv.setColor(palette.white) : canv.setColor(palette.golden);
                }


                //  Make sure the nickname length is not greater than 10 characters
                get nickname_formatter() {
                    let name = bot.users.get(user[this.group][this.index].id).username;
                    return name.length >= 10 ? `${name.substring(0, 9)}..` : name;
                }


                //  Return nickname
                get nickname() {
                    //this.text_check;
                    canv.setTextAlign("left")
                    canv.setColor(palette.white)
                    canv.setTextFont(`12pt RobotoBold`)
                    .addText(this.nickname_formatter, size.x2 + 160, this.y )
                    return this;
                }


                //  Returns reputation points
                get reputation() {
                    const reps = format.threeDigitsComa(user[this.group][this.index].rep);
                    this.text_check;         
                    canv.setTextAlign("right")
                    canv.setTextFont(`15pt RobotoThin`)
                    .addText(`${reps} ❤`, size.x - 50, this.y)  
                    return this;                    
                }


                //  Highlight if user is in the top ten list
                get highlight() {
                    if(user[this.group][this.index].id === message.author.id) {

                        this.highlight_user = true;

                        canv.setColor(palette.golden)
                        .addRect(size.x2, this.y - 35, size.x - size.x2, 60)
                        .restore()
                    }
                    canv.restore();
                    return this;
                }


                //  Returns user artcoins
                get artcoins() {
                    this.text_check;
                    canv.setTextFont(`12pt RobotoBold`)
                    .setTextAlign("right")
                    .addText(format.threeDigitsComa(user[this.group][this.index].ac), size.x - 50, this.y);
                    return this;
                }


                //  Return user level
                get level() {
                    this.text_check;         
                    canv.setTextAlign("right")
                    canv.setTextFont(`15pt RobotoThin`)
                    .addText(user[this.group][this.index].lv, size.x - 50, this.y)  
                    return this;
                }


                //  Return current exp
                get exp() {
                    //this.text_check;
                    canv.setTextAlign("left")
                    canv.setTextFont(`12pt Whitney`)
                    canv.addText(format.threeDigitsComa(user[this.group][this.index].xp) + ` XP`, size.x2 + 160, this.y + 20)
                    return this; 
                }

                
                //  Return current ranking
                get position() {
                    //this.text_check;
                    canv.setColor(palette.white)
                    canv.setTextAlign("left")
                    canv.setTextFont(`15pt RobotoBold`)
                    canv.addText(`#${this.index + 1}`, size.x2 + 30, this.y)
                    return this;
                }


                //  Returns avatar
                async avatar() {
                    const { body: avatar } = await get(bot.users.get(user[this.group][this.index].id).displayAvatarURL.replace(imageUrlRegex, "?size=256"));
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
                    metadata.title = `${emoji(`aauBell`)} **| Level Leaders**`;
                    metadata.footer_components = [user.authorindex_xp, metadata.user.currentexp, `EXP`];

                    for(let i = 0; i < user.xpgroup.length; i++) {
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
                    metadata.title = `${emoji(`artcoins`)} **| Artcoins Leaders**`;
                    metadata.footer_components = [user.authorindex_ac, metadata.user.artcoins, `${emoji(`artcoins`)}`];

                    for(let i = 0; i < user.acgroup.length; i++) {
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
                    metadata.title = `${emoji(`wowo`)} **| Popularity Leaders**`;
                    metadata.footer_components = [user.authorindex_rep, metadata.user.reputations, `♡`];

                    for(let i = 0; i < user.repgroup.length; i++) {
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


                //  Card background layer
                get base() {
                    canv.setShadowColor("rgba(28, 28, 28, 1)")
                    .setShadowOffsetY(7)
                    .setShadowBlur(15)
                    .setColor(palette.darkmatte)

                    .addRect(size.x2+15, size.y2+10,size.x-45, size.y-45)
                    .createBeveledClip(size.x2, size.y2, size.x-20, size.y-20, 15)
                    .setShadowBlur(0)
                    .setShadowOffsetY(0)
                    .setColor(palette.nightmode)
                    .addRect(size.x2, size.y2,size.x, size.y)
                    .addRect(size.x2 + 150, size.y2, size.x, size.y)
                    .restore()
                    .setColor(palette.white) 
                    .setTextFont(`16pt RobotoBold`)
                }


                //  Method selector
                get setup() {
                    this.base;
                    return this[this.group]();
                }

        }


        await new Leaderboard(metadata.selected_group).setup;
        return {
            img: canv.toBuffer(),
            title: metadata.title
        }
    }


    //  Core processes
    const main = async () => {

        return message.channel.send(`\`fetching leaderboard data .. please be patient\``)
            .then(async load  => {
                const res = await render(400, 700);

                message.channel.send(metadata.title, new Discord.Attachment(res.img, `leaderboard.jpg`))
                    .then(() => {
                        load.delete();
                        log({code: metadata.footer_components[1] ? `AUTHOR_RANK` : `UNRANKED` },
                         ...metadata.footer_components);
                })
            })

    }


    //  Get parent group
    const getGroup = () => {
        for(let key in metadata.keywords) {
            if(metadata.keywords[key].includes(args[0].toLowerCase())) {
                return key;
            }
        }
    }


    //  Initializer
    const run = async () => {

        //  Returns if no argument was specified.
        if(!args[0])return log({code: `SHORT_GUIDE`});

        
        //  Returns if the category is invalid.
        if(!metadata.whole_keywords.includes(args[0].toLowerCase()))return log({code: `INVALID_CATEGORY`});


        //  Success passing the conditions.
        metadata.selected_group =  getGroup();
        main();
    }

    run();
}
}

module.exports.help = {
    name:"lb",
        aliases:['leaderboard', 'rank', 'ranking']
}