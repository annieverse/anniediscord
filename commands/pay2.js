const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const userFind = require('../utils/userFinding');

exports.run = async (bot, command, message, args) => {

    //  Developer Mode Evnironment
    //  Command active only for developers
    const env = require(`../.data/environment.json`);
    if(env.dev && !env.administrator_id.includes(message.author.id))return;

    //  Lifesaver promise. Used pretty often when calling sql API.
    //  @pause
    function pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    //  Parsing emoji by its name.
    //  @emoji
    function emoji(name) {
        return bot.emojis.find(e => e.name === name)
    }

    /****************************************************************************************************************************************************************************************************************
     * pay() COMMAND FUNCTION
     ****************************************************************************************************************************************************************************************************************/
    async function pay() {
        const format = new formatManager(message);
        const sql = require('sqlite');      
        const command = exports.help.name;
        const prefix = env.prefix;
        const user = message.author;
        const collector = new Discord.MessageCollector(message.channel,
            m => m.author.id === message.author.id, {
                max: 1,
                time: 30000,
            });

        let target_user = null;
        let amount = 0;
        let balance = 0;
        let pending_target = false;
        let pending_amount = false;
        let arg_check_pass = false;

        sql.open('.data/database.sqlite');

        /****************************************************************************************************************************************************************************************************************
         * OUTPUT LOG HANDLER
         ****************************************************************************************************************************************************************************************************************/

        /*  log() Information
         *  @param:  Log Code
         *  @return: Formatted Message
         */
        const log = (codelist) =>{
            const loglist = codelist.split(" ");
            const logtable = {
                //"prompt": {color: palette.golden, msg: `**${user.username}**, you're going to pay ${emoji(`artcoins`)}**${format.threeDigitsComa(price)}** for **${amount}** Lucky Tickets? \nplease type \`y\` to confirm your purchase. `},        
                "TEST": {
                    color: palette.green, 
                    msg: `TEST MESSAGE: ${target_user} | ${emoji(`artcoins`)}**${format.threeDigitsComa(amount)}**`
                },
                "LB": {
                    color: palette.white, 
                    msg: `\n`
                },
                "SHORT_GUIDE" : {
                    color: palette.red, 
                    msg: `♡ __**Short Guide**__ ♡
                    Format: \`${prefix}${command} <user> <amount>\`
                    Format: \`${prefix}${command} <amount> <user>\`
                    More Info: \`${prefix}${command} help\``
                },
                "FULL_GUIDE" : {
                    color: palette.red, 
                    msg: `[Enter a complete guide here.]`
                },
                "GREET_NEUTRAL" : {
                    color: palette.red, 
                    msg: `Hey ${user.username}~ `
                },
                "GREET_APOLOGY" : {
                    color: palette.red, 
                    msg: `Sorry ${user.username}... `
                },
                "CONFIRMATION" : {
                    color: palette.red, 
                    msg: `[Confirmation here.]`
                },
                "MISSING_ARGS" : {
                    color: palette.red, 
                    msg: `Please give me a **user** to pay, and the **amount**!`
                },
                "ARGS_UNKNOWN": {
                    color: palette.red, 
                    msg: `I have no idea what this means... ${emoji(`aauWallSlam`)}`
                },
                "VALID_TARGET_NO_AMOUNT" : {
                    color: palette.golden, 
                    msg: `How much would you like to pay ${target_user}? ${emoji(`aauinlove`)}`
                },
                "VALID_AMOUNT_NO_TARGET" : {
                    color: palette.golden, 
                    msg: `Who would you like to pay ${emoji(`artcoins`)}**${format.threeDigitsComa(amount)}** to? ${emoji(`aauinlove`)}`
                },
                "INVALID_AMOUNT": {
                    color: palette.red, 
                    msg: `That's a strange amount of **Artcoins**... ${emoji(`aauwonkyhehe`)}`
                },
                "SELF_PAYMENT": {
                    color: palette.red, 
                    msg: `Stupid ${user.username}, why are you trying to pay yourself? ${emoji(`aauSatanialaugh`)}`
                },
                "UNKNOWN_USER": {
                    color: palette.red, 
                    msg: `I couldn't find that user... ${emoji(`aauWallSlam`)}
                    You could try again by tagging them like this: "\`${prefix}${command}\` ${user}"`
                },
                "INSUFFICIENT_BAL": {
                    color: palette.red, 
                    msg: `You you don't have that many **Artcoins**... ${emoji(`aaupeek`)}`
                },
                "YOUR_BALANCE" : {
                    color: palette.red, 
                    msg: `Your balance is: ${emoji(`artcoins`)}**${format.threeDigitsComa(balance)}** Artcoins.`
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
            const displist =[];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].msg;
            });
            return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
        }


        /****************************************************************************************************************************************************************************************************************
         * MICRO FUNCTIONS
         ****************************************************************************************************************************************************************************************************************/

        /*  isValudUser() Information
         */
        const isValidUser = async(string) => (await userFind.resolve(message, string) ? true : false);

        /*  isUserTarget() Information
         */
        const isUserTarget = async(string) => ((await getUserData(string)).id === user.id ? true : false);

        /*  getUserData() Information
         */
        const getUserData = async(string) => await userFind.resolve(message, string);

        /*  isValidValue() Information
         *  - Checks if the value is greater than 0, and not 'NaN' or 'Infinity'
         *  - Pair with "Example: if(isPosVal()) and Math.round() to round the argument safely."
         * 
         *  @param:     value string or number
         *  @return:   boolean
         */
        const isValidValue = async(string) => await ((!Number.isNaN(Number(string)) && !(Math.round(Number(string)) <= 0) && Number.isFinite(Number(string))));

        /*  getValidInt() Information
         *  - Used for getting the positive, non-zero integer
         *  - pair with "isPosVal()"
         * 
         *  @param:     value string or number
         *  @return:    a rounded Integer, or 'NaN'
         */
        const getValidInt = async(string) => await (!Number.isNaN(Number(string)) && !(Math.round(Number(string)) <= 0) && Number.isFinite(Number(string))) ? Math.round(Number(string)) : NaN;

        /*  isInvalidNumber() Information
         *
         */
        const isInvalidNumber = async(string) => await (!Number.isNaN(Number(string)) && ((Math.round(Number(string)) <= 0) || !(Number.isFinite(Number(string)))));

        /*  isAmountAll() Information
         *
         */
        const isAmountAll = async(string) => (string.toLowerCase() === "all");

        /*  getUserInventory() Information
         *
         */
        const getUserInventory = async(user) => await sql.get(`SELECT * FROM userinventories WHERE userID = "${user.id}"`);

         /*  updateArtcoins() Information
         *
         */       
        const updateArtcoins = async(user, amount) => await sql.run(`UPDATE userinventories SET artcoins = artcoins + ${amount} WHERE userId = ${user.id}`);

        /*  isInsufficientBalance() Information
         *
         */
        const isInsufficientBalance = async(user, amount) => ((await getUserInventory(user)).artcoins < amount)


        /****************************************************************************************************************************************************************************************************************
         * LOGIC FUNCTIONS
         ****************************************************************************************************************************************************************************************************************/

        /*  argsCheckpoint() Information
         *
         */
        const argsCheckpoint = async() => {
            if(!args[0]) return log(`GREET_NEUTRAL MISSING_ARGS LB LB SHORT_GUIDE`)
            if(args[0].includes('help')) return log(`FULL_GUIDE`)
            if(!args[1]) {
                if(await isValidUser(args[0])) {
                    if(await isUserTarget(args[0])) return log(`SELF_PAYMENT`)
                    target_user = await getUserData(args[0]);
                    pending_amount = true;
                    return log(`GREET_NEUTRAL VALID_TARGET_NO_AMOUNT`);
                }
                if(await isValidValue(args[0]) || await isAmountAll(args[0])) {
                    await isAmountAll(args[0]) ? amount = (await getUserInventory(user)).artcoins : amount = await getValidInt(args[0]);
                    if(await isInsufficientBalance(user, amount)) {
                        balance = (await getUserInventory(user)).artcoins;
                        return log(`GREET_APOLOGY INSUFFICIENT_BAL LB YOUR_BALANCE`)
                    }
                    pending_target = true;
                    return log(`GREET_NEUTRAL VALID_AMOUNT_NO_TARGET`);
                }
                if(await isInvalidNumber(args[0])) return log(`GREET_APOLOGY INVALID_AMOUNT`);
                else return log('GREET_APOLOGY UNKNOWN_USER')
            } else {
                if(await isValidUser(args[0])){
                    target_user = await getUserData(args[0]);
                    if(await isValidValue(args[1]) || await isAmountAll(args[1])){
                        await isAmountAll(args[1]) ? amount = (await getUserInventory(user)).artcoins : amount = await getValidInt(args[1]);
                        if(await isInsufficientBalance(user, amount)) {
                            balance = (await getUserInventory(user)).artcoins;
                            pending_amount = true;
                            return log(`GREET_APOLOGY INSUFFICIENT_BAL LB YOUR_BALANCE LB VALID_TARGET_NO_AMOUNT`)
                        } else return arg_check_pass = true;
                    } else {
                        pending_amount = true;
                        return log(`GREET_APOLOGY INVALID_AMOUNT LB VALID_TARGET_NO_AMOUNT`)
                    }
                }
                if(await isValidValue(args[0]) || await isAmountAll(args[0])){
                    await isAmountAll(args[0]) ? amount = (await getUserInventory(user)).artcoins : amount = await getValidInt(args[0]);
                    balance = (await getUserInventory(user)).artcoins;
                    if(await isValidUser(args[1])){
                        if(await isInsufficientBalance(user, amount)) {
                            pending_amount = true;
                            return log(`GREET_APOLOGY INSUFFICIENT_BAL LB YOUR_BALANCE LB VALID_TARGET_NO_AMOUNT`)
                        } else return arg_check_pass = true;
                    } else {
                        if(await isInsufficientBalance(user, amount)) return log(`GREET_APOLOGY ARGS_UNKNOWN LB LB SHORT_GUIDE`)
                        else {
                            pending_target = true;
                            return log(`GREET_APOLOGY UNKNOWN_USER LB VALID_AMOUNT_NO_TARGET`)
                        }
                    }
                }
                if(await isValidUser(args[1])){
                    target_user = await getUserData(args[1]);
                    if(await isValidValue(args[0]) || await isAmountAll(args[0])){
                        await isAmountAll(args[0]) ? amount = (await getUserInventory(user)).artcoins : amount = await getValidInt(args[0]);
                        if(await isInsufficientBalance(user, amount)) {
                            balance = (await getUserInventory(user)).artcoins;
                            pending_amount = true;
                            return log(`GREET_APOLOGY INSUFFICIENT_BAL LB YOUR_BALANCE LB VALID_TARGET_NO_AMOUNT`)
                        } else return arg_check_pass = true;
                    } else {
                        pending_amount = true;
                        return log(`GREET_APOLOGY INVALID_AMOUNT LB VALID_TARGET_NO_AMOUNT`)
                    }
                }
                if(await isValidValue(args[1]) || await isAmountAll(args[1])){
                    await isAmountAll(args[1]) ? amount = (await getUserInventory(user)).artcoins : amount = await getValidInt(args[1]);
                    balance = (await getUserInventory(user)).artcoins;
                    if(await isValidUser(args[0])){
                        if(await isInsufficientBalance(user, amount)) {
                            pending_amount = true;
                            return log(`GREET_APOLOGY INSUFFICIENT_BAL LB YOUR_BALANCE LB VALID_TARGET_NO_AMOUNT`)
                        } else return arg_check_pass = true;
                    } else {
                        if(await isInsufficientBalance(user, amount)) return log(`GREET_APOLOGY ARGS_UNKNOWN LB LB SHORT_GUIDE`)
                        else {
                            pending_target = true;
                            return log(`GREET_APOLOGY UNKNOWN_USER LB VALID_AMOUNT_NO_TARGET`)
                        }
                    }
                }
                return log(`GREET_APOLOGY ARGS_UNKNOWN LB LB SHORT_GUIDE`)
            }
        }

        const pendingAmount = async() => {

        }

        const pendingTarget = async() => {

        }

        const confirmation = async() => {
            return
        }

        // Method: Prompt message before proceeding the transaction
        const checkOut = () => {
            return log(`000`)
        }
          
        const test = async() => {
            let reqest_help = false
            let target_arg_index = null
            let arg_target = null
            let amount_arg_index = null
            let arg_amount = null

            for (let i = 0; i < args.length; i++){
                if(args[i].toLowerCase() === "help"){
                    reqest_help = true;
                }
                if(await isValidUser(args[i])){
                    arg_target = await getUserData(args[i]);
                    target_arg_index = i;
                }
                if(await isValidValue(args[i]) || await isAmountAll(args[i])){
                    await isAmountAll(args[i]) ? arg_amount = (await getUserInventory(user)).artcoins : arg_amount = await getValidInt(args[i]);
                    amount_arg_index = i;
                }
            }
            return format.embedWrapper(palette.red, `Here's your output ${user.username}: ${emoji(`aauinlove`)}
                                                     - Requesting Help: ${reqest_help}
                                                     - Target user: ${arg_target}
                                                     - Target index: ${target_arg_index}
                                                     - Amount to pay: ${arg_amount}
                                                     - Amount index: ${amount_arg_index}`);
        }

        const test2 = async() => {
            const msg_collector = new Discord.MessageCollector(message.channel,
                m => m.author.id === message.author.id, {
                    max: 1,
                    time: 30000,
                });
                
                format.embedWrapper(palette.golden, `Waiting for input, ${user.username}... ${emoji(`aauinlove`)}`)
                collector.on(`collect`, async (msg) => {
                    let user_input = msg.content.toLowerCase();
                    if (user_input){
                        collector.stop();
                        format.embedWrapper(palette.green, `Input recieved: ${user_input}`)
                    }
                });  
        }

        /****************************************************************************************************************************************************************************************************************
         * CORE FUNCTION PROCESSOR
         ****************************************************************************************************************************************************************************************************************/
        const run = async () => {
            await test();
            return

            return format.embedWrapper(palette.red, `Here's your output ${user.username}: ${emoji(`aauinlove`)}  
            - Passed Argument Check: ${arg_check_pass}
            - Pending AC Amount: ${pending_amount}
            - Pending Target User: ${pending_target}`);

            if (arg_check_pass || pending_amount || pending_target){
                // function pending_amount()
                if (pending_amount) while (pending_amount){

                }

                //function pengingTarget()
                if (pending_target) while (pending_target){

                }

                confirmation()
                checkOut()
            }else return //Complete
        }
        run();
    }
    return pay();
}
exports.help = {
  name: "pay2",
        aliases:["test"]
}