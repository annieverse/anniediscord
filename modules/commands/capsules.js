const sql = require("sqlite");
const formatManager = require('../../utils/formatManager');
const ranksManager = require('../../utils/ranksManager');

sql.open(".data/database.sqlite");

class capsule {
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
        let utils = this.stacks

        const format = new formatManager(message)
        return [`sandbox`, `bot`, `gacha-house`, `games`].includes(message.channel.name) ? init_capsules()
            : format.embedWrapper(palette.darkmatte, `Unavailable feature.`);

        async function init_capsules() {

            const extension = new ranksManager(bot, message);


            //  Centralized data object
            let metadata = {
                user: {
                    id: message.author.id,
                    name: message.author.username,
                    tag: message.author.tag
                },
                available_capsules: 0,
                to_use: parseInt((message.content).replace(/\D/g, ``)),
                exp_per_capsule: 150,
                get total_gained() {
                    return this.exp_per_capsule * this.to_use
                },
                channel: message.channel.name,
                previous: {
                    current: 0,
                    lvl: 0,
                    max: 0,
                    curve: 0
                },
                updated: {
                    current: 0,
                    lvl: 0,
                    max: 0,
                    curve: 0
                }
            }

            // Pre-defined messages
            const log = async (props = {}, ...opt) => {

                // Props object
                props.code = !props.code ? `NULL_CODE` : props.code;
                props.emoticon = !props.emoticon ? `artcoins` : props.emoticon;



                //  Texts collection
                const logtext = {
                    "NULL_CODE": {
                        color: palette.darkmatte,
                        msg: `No available response.`,
                    },

                    "INSUFFICIENT_ITEM": {
                        color: palette.darkmatte,
                        msg: `You don't have enough capsule.`
                    },

                    "INVALID_AMOUNT": {
                        color: palette.darkmatte,
                        msg: `Please write a proper number.`
                    },

                    "SUCCESSFUL": {
                        color: palette.lightgreen,
                        msg: `**${metadata.user.name}** used ${utils.emoji(`powercapsule1`, bot)}**${opt[0]} capsules** and gained **+${opt[1]} EXP**.`
                    }

                }

                const res = logtext[props.code];
                return format.embedWrapper(res.color, res.msg);

            }


            //  Wrapped class to handle experience point.
            class Experience {
                constructor(data) {
                    this.data = data;
                }

                //  Add rank after updating exp.
                get add_rank() {
                    return message.guild.member(this.data.user.id).addRole(message.guild.roles.find(r => r.name === extension.ranksCheck(this.data.updated.lvl).title));
                }

                //  Remove previous rank if new lvl gap is greater than 5.
                get remove_rank() {
                    const previousDuplicateRanks = (extension.ranksCheck(this.data.updated.lvl).lvlcap)
                        .filter(val => val < this.data.updated.lvl);

                    let idpool = [];
                    for (let i in previousDuplicateRanks) {
                        idpool.push(((extension.ranksCheck(previousDuplicateRanks[i]).rank).id).toString())
                    }

                    console.log(idpool);
                    return message.guild.member(this.data.user.id).removeRoles(idpool)
                }

                //  Register new exp data.
                get update_exp() {

                    const formula = (x, lvl, b, c) => {
                        for (let i = 150; i !== x; i += c) {
                            b += c;
                            c += 200;
                            lvl++;
                            if (i > x) { break; }
                        }
                        return {
                            x: x,
                            lvl: lvl,
                            b: b,
                            c: c

                        }
                    }

                    return sql.get(`SELECT * FROM userdata WHERE userId = "${message.author.id}"`)
                        .then(async data => {

                            //  Save old data
                            metadata.previous.current = data.currentexp;
                            metadata.previous.lvl = data.level;
                            metadata.previous.max = data.maxexp;
                            metadata.previous.curve = data.nextexpcurve;


                            const parsedData = this.data.total_gained + metadata.previous.current;
                            const main = formula(parsedData, 0, 0, 150);

                            //  Register new data
                            metadata.updated.current = parsedData;
                            metadata.updated.lvl = main.lvl;
                            metadata.updated.max = main.b;
                            metadata.updated.curve = main.c;

                            //console.log(metadata);

                            sql.run(`UPDATE userdata 
                                SET currentexp = ${metadata.updated.current},
                                level = ${metadata.updated.lvl},
                                maxexp = ${metadata.updated.max},
                                nextexpcurve = ${metadata.updated.curve}
                                WHERE userId = ${metadata.user.id}`
                            );
                        })
                }

                // Returns true if new_rank is different from previous one.
                get ranked_up() {
                    let new_rank = extension.ranksCheck(this.data.updated.lvl).title;
                    let old_rank = extension.ranksCheck(this.data.previous.lvl).title;

                    console.log(new_rank, old_rank);
                    return new_rank !== old_rank ? true : false;
                }
            }


            //  Retrieve user's inventory
            const get_capsules = () => {
                sql.get(`SELECT power_capsules 
                     FROM userinventories
                     WHERE userId = ${metadata.user.id}`)
                    .then(async data => metadata.available_capsules = data.power_capsules)
            }


            // Subtract item by amount of used capsules.
            const withdraw = () => {
                sql.run(`UPDATE userinventories 
                     SET power_capsules = power_capsules - ${metadata.to_use}
                     WHERE userId = "${metadata.user.id}"`)
            }


            //  Start core proccess.
            const proccess = async () => {
                const xp = new Experience(metadata);

                withdraw();
                xp.update_exp;
                await this.stacks.pause(500);


                //  Update rank if current rank rank is not equal
                //  with the new rank.
                if (xp.ranked_up) {

                    xp.remove_rank;
                    await this.stacks.pause(500);

                    xp.add_rank;
                    await this.stacks.pause(500);
                }

                return log({ code: `SUCCESSFUL` }, metadata.to_use, format.threeDigitsComa(metadata.total_gained))
            }


            // Initialize.
            const run = async () => {
                await get_capsules();
                await this.stacks.pause(200);

                //  Locked feature.
                //if(!message.member.roles.find(r => r.name === 'Grand Master'))return;     


                //  Returns if owned capsule is lower than the requirement.
                if (metadata.available_capsules < metadata.to_use) return log({ code: `INSUFFICIENT_ITEM` })


                //  Returns if amount is not specified.
                if (!metadata.to_use) return log({ code: `INVALID_AMOUNT` })


                proccess();
            }

            run();
        }
    }
}
module.exports.help = {
    start: capsule,
    name:"capsules",
    aliases: ["eat"],
    description: `Eats the capsules you get from gacha and gives you XP in return`,
    usage: `${require(`../../.data/environment.json`).prefix}eat <amount>`,
    group: "Shop-related",
    public: true,
    require_usermetadata: true,
    multi_user: false
}