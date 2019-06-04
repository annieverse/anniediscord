const palette = require('../colorset.json');
const databaseManager = require('../utils/databaseManager');
const formatManager = require('../utils/formatManager');
const env = require('../.data/environment.json');
const prefix = env.prefix;


module.exports.run = async (bot, command, message, args, utils) => {

    /**
     *   dbkits.
     *   @utils direct edit/view database.
     *   < > referenced to dev arguments.
     */


    modifyDB();

    
    if (env.dev && !env.administrator_id.includes(message.author.id)) return;

    async function modifyDB() {

        //  Pre-defined messages.
        const log = (props = {}) => {
            props.code = !props.code ? `UNDEFINED` : props.code;

            const logtext = {
                "UNDEFINED": {
                    color: palette.darkmatte,
                    msg: `No available response.`
                },
                "MISSING_INITIAL_PARAMETER": {
                    color: palette.darkmatte,
                    msg: `Please provide the initial parameter. \`[get/all/run]\``
                }
            }

            const res = logtext[props.code];
            return format.embedWrapper(res.color, res.msg);
        }

        const dbmanager = new databaseManager(message.author.id);
        const format = new formatManager(message);
        const branch = await dbmanager.listedTables;

        if (!message.member.roles.find(r => r.name === 'Developer Team')) return format.embedWrapperDev(palette.red, `**Unauthorized access.**`)
        if (!args[0]) return format.markdown(
            palette.darkmatte,
            `Your ID is authorized to access this field.
                "register//newcol//newtab//addval//subsval//pull//checkout//remove//totalindex//transferindex//distribute"`)



        const sql = require('sqlite');
        sql.open('.data/database.sqlite');


        // Manual sql queries.
        if (args[0] === `query`) {
            if (!args[1]) return log({
                code: `MISSING_INITIAL_PARAMETER`
            });


            // Run the query.
            const run_query = async (opt) => {
                let query = /\(([^)]*)\)/.exec(message.content)[1]
                let res = await sql[opt](query.toString())
                return res;
            }

            //  Parse the object into readeable string.
            const prettify = (obj) => {
                let str = JSON.stringify(obj)
                str = str.replace(/\,/g, ",\n");
                return `\`\`\`json\n${str}\n\`\`\``;
            }

            const res = await run_query(args[1]);
            return message.channel.send(prettify(res));
        } else if (args[0] === 'register') {
            /**
             *      Register new id into given table.
             *      #register
             */
            if (args[1]) {
                const user = await utils.userFinding(message, args[1]);
                let data = {
                    id: user.id,
                    tbl: args[2],
                    get parsed() {
                        return dbmanager.registeringId(this.tbl, this.id)
                    }
                }
                try {
                    await data.parsed;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**ID: ${data.id} has been registered into GROUP: ${data.tbl}.**`
                    );
                } catch (e) {
                    return format.embedWrapper(
                        palette.darkmatte,
                        `Invalid data.`
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**register <userid> of <table>.**'
                )
            }
        } else if (args[0] === 'registerItem') {
            /**
             *      Register new item with specific parameters
             */
            if (args[1]) {

                /**
                 *  tokenized parameters contains[name, alias, type, price, description];
                 */
                let tokenize = message.content
                    .substring(command.length + 15)
                    .split(", ");

                let data = {
                    name: tokenize[0],
                    alias: tokenize[1],
                    type: tokenize[2],
                    price: tokenize[3],
                    description: tokenize[4],
                    get parsed() {
                        return dbmanager.registerItem(this.name, this.alias, this.type, this.price, this.description)
                    }
                }

                try {
                    await data.parsed;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**${data.name} ${data.type} has been registered to itemlist.**`
                    );
                } catch (e) {
                    return format.embedWrapper(
                        palette.darkmatte,
                        `Invalid **parameters**. <name/alias/type/price/desc>`
                    )
                }

            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**registering custom item in consecutive parameters order. <name/alias/type/price/desc>**'
                )
            }
        } else if (args[0] === 'newcol') {
            /**
             *      Creata new column on given table.
             *      #newcol
             */
            if (args[1]) {
                try {
                    let data = {
                        col: args[1],
                        type: args[2],
                        tbl: args[3],
                        get parsing() {
                            return dbmanager.registerColumn(this.tbl, this.col, this.type)
                        }
                    }
                    await data.parsing;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**NEW COL: ${data.col}-${data.type}, has been registered into GROUP: ${data.tbl}.**`
                    )
                } catch (e) {
                    console.log(e);
                    return format.embedWrapper(
                        palette.darkmatte,
                        '**Invalid property / format.**'
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**add new <column><type> to given <table>.**'
                )
            }
        } else if (args[0] === 'addval') {
            /**
             *      Add new value on given column of table.
             *      #addval
             */
            if (args[1]) {
                try {
                    const user = await utils.userFinding(message, args[1]);
                    let data = {
                        opt: message.content.includes("-i") ? "item_id" : "userId",
                        id: message.content.includes("-i") ? args[1] : user.id,
                        val: args[2],
                        col: args[3],
                        tbl: args[4],
                        get parsing() {
                            return dbmanager.sumValue(this.tbl, this.col, this.val, this.id, this.opt)
                        }
                    }
                    await data.parsing;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**ADDED ${data.val} VALUE on ${data.col} of ID: ${data.id}.**`
                    )
                } catch (e) {
                    console.log(e);
                    return format.embedWrapper(
                        palette.darkmatte,
                        '**Invalid property / format.**'
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**Give <id> new <value> of <column><table>.**'
                )
            }
        } else if (args[0] === 'subsval') {
            /**
             *      Add new value on given column of table.
             *      #addval
             */
            if (args[1]) {
                try {
                    const user = await utils.userFinding(message, args[1]);
                    let data = {
                        val: args[2],
                        col: args[3],
                        tbl: args[4],
                        get parsing() {
                            return dbmanager.subtractValue(this.tbl, this.col, this.val, user.id)
                        }
                    }
                    await data.parsing;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**SUBTRACT ${data.val} VALUE on ${data.col} of ID: ${user.id}.**`
                    )
                } catch (e) {
                    console.log(e);
                    return format.embedWrapper(
                        palette.darkmatte,
                        '**Invalid property / format.**'
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**Give <id> new <value> of <column><table>.**'
                )
            }
        } else if (args[0] === 'nullify') {
            /**
             *      Nullifying value in a column of given ID.
             */
            if (args[1]) {
                try {

                    const user = await utils.userFinding(message, args[1]);
                    let data = {
                        id: user.id,
                        col: args[2],
                        tbl: args[3],
                    }

                    sql.run(`UPDATE ${data.tbl} SET ${data.col} = NULL WHERE userId = ${data.id}`)
                    return format.embedWrapper(
                        palette.darkmatte,
                        `Value has been nullified in **${data.col} of ID ${data.id}**.`
                    )
                } catch (e) {
                    console.log(e);
                    return format.embedWrapper(
                        palette.darkmatte,
                        '**Invalid property / format.**'
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**Nullify collumn in <id> <column> of <table>.**'
                )
            }
        } else if (args[0] === 'replace') {
            /**
             *      Replacing new value on given column of table.
             */
            if (args[1]) {
                try {

                    /**
                     *  tokenized parameters.;
                     */
                    let tokenize = message.content
                        .substring(command.length + 10)
                        .split(", ");
                    console.log(tokenize);
                    const user = await utils.userFinding(message, tokenize[0]);
                    let data = {
                        id: message.content.includes("-i") ? tokenize[0] : user.id,
                        opt: message.content.includes("-i") ? 'item_id' : 'userId',
                        val: tokenize[1],
                        col: tokenize[2],
                        tbl: tokenize[3],
                        get parsing() {
                            return dbmanager.replaceValue(this.tbl, this.col, this.val, this.id, this.opt)
                        }
                    }
                    await data.parsing;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `Replaced new value **${data.val}** in **${data.col} of ID ${data.id}**.`
                    )
                } catch (e) {
                    console.log(e);
                    return format.embedWrapper(
                        palette.darkmatte,
                        '**Invalid property / format.**'
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**Replace value in <id> with new <value> in <column> of <table>.**'
                )
            }
        } else if (args[0] === 'newtab') {
            /**
             *      Creata new table.
             *      #newtab
             */
            if (args[1]) {
                try {
                    let data = {
                        tbl: args[1],
                        col: args[2],
                        type: args[3],
                        get parsing() {
                            return dbmanager.registerTable(this.tbl, this.col, this.type)
                        }
                    }
                    await data.parsing;
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**NEW TABLE: ${data.tbl} has been registered. With default column of ${data.col}-${data.type}.**`
                    )
                } catch (e) {
                    console.log(e);
                    return format.embedWrapper(
                        palette.darkmatte,
                        '**Invalid property / format.**'
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**add new <table> with default <column><type>.**'
                )
            }
        } else if (args[0] === 'pull') {
            /**
             *      Pull data of given id.
             *      @pull
             */
            if (args[1]) {
                try {
                    const user = await utils.userFinding(message, args[1]);
                    let data = {
                        opt: message.content.includes('-i') ? 'itemId' : 'userId',
                        id: message.content.includes('-i') ? args[1] : user.id,
                        tbl: args[2],
                        get parsed() {
                            return dbmanager.pullRowData(this.tbl, this.id, this.opt)
                        }
                    }
                    let stringified = JSON.stringify(await data.parsed);
                    return format.markdown(
                        palette.lightgreen,
                        stringified.split(",").join(",\n")
                    )
                } catch (e) {
                    return format.markdown(
                        palette.darkmatte,
                        `"UNHANDLED EXCEPTION": data of given ID doesn't exist in ${args[2]}.`
                    )
                }
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**pull <rowid> of given <table>.**'
                )
            }
        } else if (args[0] === 'checkout') {
            /**
             *      Check given table structures.
             *      #checkout
             */
            if (args[1]) {
                return format.markdown(
                    branch[args[1]] === undefined ? palette.darkmatte : palette.lightgreen,
                    branch[args[1]] === undefined ? '"UNHANDLED EXCEPTION": Invalid property.' : branch[args[1]].sql
                );
            } else {
                return format.embedWrapper(
                    palette.darkmatte, '**checkout stored <table>.**'
                )
            }
        } else if (args[0] === 'remove') {
            /**
             *      Delete id from given table.
             *      #remove
             */
            if (args[1]) {
                let data = {
                    opt: message.content.includes('-i') ? 'itemId' : 'userId',
                    id: args[1],
                    tbl: args[2],
                    get parsed() {
                        return dbmanager.removeRowData(this.tbl, this.id, this.opt)
                    }
                }
                await data.parsed
                return format.embedWrapper(
                    palette.darkmatte,
                    `**ID: ${data.id} has been successfully removed from GROUP: ${data.tbl}**`
                )
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    '**delete <rowid> of <table>.**'
                )
            }
        } else if (args[0] === 'totalindex') {
            /**
             *      Print out registered data.
             *      #totalindex
             */

            if (!args[1]) return format.embedWrapper(palette.darkmatte, `Please include the source.`)

            return sql.all(`SELECT _rowid_ FROM ${args[1]}`)
                .then(async data => {
                    return format.embedWrapper(
                        palette.darkmatte,
                        `**${format.threeDigitsComa(data.length)}** collected data.`
                    )
                })
        } else if (args[0] === 'transferindex') {
            /**
             *      Transfering registered IDs from userdata into new table.
             *      #transferindex
             */
            if (args[1]) {
                const sql = require('sqlite');
                sql.open('.data/database.sqlite');
                let data = await dbmanager.queryingAll;
                let idcollection = data.map(d => `(${d.userId})`);
                /**
                 *       Only use if you know what you are doing.
                 *       random transfer may leads to duplicate data.
                 */
                sql.run(`INSERT INTO ${args[1]} (userId) VALUES ${idcollection.toString()}`)
                    .then(() => {
                        format.embedWrapper(
                            palette.darkmatte,
                            `**${idcollection.length} IDs** have been shared to **GROUP: ${args[1]}**.`
                        )
                    })
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    `**Transfering registered IDs from userdata into new <table>.**`
                )
            }
        } else if (args[0] === 'distribute') {
            /**
             *      Distributing items to every registered user.
             *      @distribute
             */
            if (args[1]) {
                const sql = require('sqlite');
                sql.open('.data/database.sqlite');
                let indexuser = await dbmanager.queryingAll;
                let idcollection = indexuser.map(d => d.userId);
                const data = {
                    val: args[1],
                    col: args[2],
                    tbl: args[3]
                };

                sql.run(`UPDATE ${data.tbl} SET ${data.col} = IFNULL(${data.col}, ${parseInt(data.val)})`)
                sql.run(`UPDATE ${data.tbl} SET ${data.col} = (${data.col} + ${parseInt(data.val)})`)
                    .then(() => {
                        format.embedWrapper(
                            palette.darkmatte,
                            `**${format.threeDigitsComa(data.val)} ${data.col} have been distributed to ${idcollection.length} users.**`
                        )
                    })
            } else {
                return format.embedWrapper(
                    palette.darkmatte,
                    `**Distribute <value> into target <column> of <table>.**`
                )
            }
        }
    }
}

exports.help = {
    name: "db",
    aliases: [],
    description: `Allows to do sql queries and other commands`,
    usage: `${prefix}db <subcommand>`,
    group: "Admin",
    public: true,
}