const formatManager = require('../../utils/formatManager');

class pay2 {
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
        /****************************************************************************************************************************************************************************************************************
         * pay() COMMAND FUNCTION
         ****************************************************************************************************************************************************************************************************************/
        async function pay() {
            const format = new formatManager(message);
            const sql = require('sqlite');
            const command = exports.help.name;
            const prefix = env.prefix;
            const user = message.author;

            let target_user = null;
            let amount = 0;
            let balance = 0;

            sql.open('.data/database.sqlite');

            /****************************************************************************************************************************************************************************************************************
             * OUTPUT LOG HANDLER
             ****************************************************************************************************************************************************************************************************************/

            /*  log() Information
             *  @param:  Log Code
             *  @return: Formatted Message
             */
            const log = (codelist) => {
                const loglist = codelist.split(" ");
                const logtable = {
                    //"prompt": {color: palette.golden, msg: `**${user.username}**, you're going to pay ${utils.emoji(`artcoins`,bot)}**${format.threeDigitsComa(price)}** for **${amount}** Lucky Tickets? \nplease type \`y\` to confirm your purchase. `},        
                    "TEST": {
                        color: palette.green,
                        msg: `TEST MESSAGE: ${target_user} | ${utils.emoji(`artcoins`, bot)}**${format.threeDigitsComa(amount)}**`
                    },
                    "LB": {
                        color: palette.white,
                        msg: `\n`
                    },
                    "SHORT_GUIDE": {
                        color: palette.red,
                        msg: `♡ __**Short Guide**__ ♡
                    Format: \`${prefix}${command} <user> <amount>\`
                    Format: \`${prefix}${command} <amount> <user>\`
                    More Info: \`${prefix}${command} help\``
                    },
                    "FULL_GUIDE": {
                        color: palette.red,
                        msg: `[Enter a complete guide here.]`
                    },
                    "GREET_NEUTRAL": {
                        color: palette.red,
                        msg: `Hey ${user.username}~ `
                    },
                    "GREET_APOLOGY": {
                        color: palette.red,
                        msg: `Sorry ${user.username}... `
                    },
                    "CONFIRMATION": {
                        color: palette.red,
                        msg: `[Confirmation here.]`
                    },
                    "MISSING_ARGS": {
                        color: palette.red,
                        msg: `Please give me a **user** to pay, and the **amount**!`
                    },
                    "ARGS_UNKNOWN": {
                        color: palette.red,
                        msg: `I have no idea what this means... ${utils.emoji(`aauWallSlam`, bot)}`
                    },
                    "VALID_TARGET_NO_AMOUNT": {
                        color: palette.golden,
                        msg: `How much would you like to pay ${target_user}? ${utils.emoji(`aauinlove`, bot)}`
                    },
                    "VALID_AMOUNT_NO_TARGET": {
                        color: palette.golden,
                        msg: `Who would you like to pay ${utils.emoji(`artcoins`, bot)}**${format.threeDigitsComa(amount)}** to? ${utils.emoji(`aauinlove`, bot)}`
                    },
                    "INVALID_AMOUNT": {
                        color: palette.red,
                        msg: `That's a strange amount of **Artcoins**... ${utils.emoji(`aauwonkyhehe`, bot)}`
                    },
                    "SELF_PAYMENT": {
                        color: palette.red,
                        msg: `Stupid ${user.username}, why are you trying to pay yourself? ${utils.emoji(`aauSatanialaugh`, bot)}`
                    },
                    "UNKNOWN_USER": {
                        color: palette.red,
                        msg: `I couldn't find that user... ${utils.emoji(`aauWallSlam`, bot)}
                    You could try again by tagging them like this: "\`${prefix}${command}\` ${user}"`
                    },
                    "INSUFFICIENT_BAL": {
                        color: palette.red,
                        msg: `You you don't have that many **Artcoins**... ${utils.emoji(`aaupeek`, bot)}`
                    },
                    "YOUR_BALANCE": {
                        color: palette.red,
                        msg: `Your balance is: ${utils.emoji(`artcoins`, bot)}**${format.threeDigitsComa(balance)}** Artcoins.`
                    },
                    "ERROR": {
                        color: palette.red,
                        msg: `It seems like I'm having some problems...
                    Please notify the Creator's Council for assistance!`
                    },
                    "ERROR2": {
                        color: palette.golden,
                        msg: `Waiting for a response...`
                    }
                }
                const displist = [];
                loglist.forEach((code, i) => {
                    displist[i] = logtable[code].msg;
                });
                return format.embedWrapper(logtable[loglist[loglist.length - 1]].color, `${displist.join('')}`);
            }


            /****************************************************************************************************************************************************************************************************************
             * MICRO FUNCTIONS
             ****************************************************************************************************************************************************************************************************************/

            /*  isValudUser() Information
             */
            const isValidUser = async (string) => (await utils.userFinding(message, string) ? true : false);


            /*  getUserData() Information
             */
            const getUserData = async (string) => await utils.userFinding(message, string);

            /*  isValidValue() Information
             *  - Checks if the value is greater than 0, and not 'NaN' or 'Infinity'
             *  - Pair with "Example: if(isPosVal()) and Math.round() to round the argument safely."
             * 
             *  @param:     value string or number
             *  @return:   boolean
             */
            const isValidValue = async (string) => await ((!Number.isNaN(Number(string)) && !(Math.round(Number(string)) <= 0) && Number.isFinite(Number(string))));

            /*  getValidInt() Information
             *  - Used for getting the positive, non-zero integer
             *  - pair with "isPosVal()"
             * 
             *  @param:     value string or number
             *  @return:    a rounded Integer, or 'NaN'
             */
            const getValidInt = async (string) => await (!Number.isNaN(Number(string)) && !(Math.round(Number(string)) <= 0) && Number.isFinite(Number(string))) ? Math.round(Number(string)) : NaN;


            /*  isAmountAll() Information
             *
             */
            const isAmountAll = async (string) => (string.toLowerCase() === "all");

            /*  getUserInventory() Information
             *
             */
            const getUserInventory = async (user) => await sql.get(`SELECT * FROM userinventories WHERE userID = "${user.id}"`);









            const test = async () => {
                let reqest_help = false
                let target_arg_index = null
                let arg_target = null
                let amount_arg_index = null
                let arg_amount = null

                for (let i = 0; i < args.length; i++) {
                    if (args[i].toLowerCase() === "help") {
                        reqest_help = true;
                    }
                    if (await isValidUser(args[i])) {
                        arg_target = await getUserData(args[i]);
                        target_arg_index = i;
                    }
                    if (await isValidValue(args[i]) || await isAmountAll(args[i])) {
                        await isAmountAll(args[i]) ? arg_amount = (await getUserInventory(user)).artcoins : arg_amount = await getValidInt(args[i]);
                        amount_arg_index = i;
                    }
                }
                return format.embedWrapper(palette.red, `Here's your output ${user.username}: ${utils.emoji(`aauinlove`, bot)}
                                                     - Requesting Help: ${reqest_help}
                                                     - Target user: ${arg_target}
                                                     - Target index: ${target_arg_index}
                                                     - Amount to pay: ${arg_amount}
                                                     - Amount index: ${amount_arg_index}`);
            }


            /****************************************************************************************************************************************************************************************************************
             * CORE FUNCTION PROCESSOR
             ****************************************************************************************************************************************************************************************************************/
            const run = async () => {

                //  I wrote this to avoid function deletion cause of unused.
                log(`TEST`)

                await test();
                return

            }
            run();
        }
        return pay();
    }
}

module.exports.help = {
    start: pay2,
    name: "pay2",
    aliases: ["test"],
    description: `pay a specified user an amount of AC from your balance | Fwubbles? test file`,
    usage: `>pay2`,
    group: "Admin",
    public: false,
    require_usermetadata: true,
    multi_user: true
}