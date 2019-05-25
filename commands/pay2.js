const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const userFind = require('../utils/userFinding');
const userRecently = new Set();

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
  
    async function pay() {
        const format = new formatManager(message);
        const sql = require('sqlite');      
        const command = exports.help.name;
        const prefix = env.prefix;
        const user = message.author;
        let targetuser = null;
        let amount = 0;
        let pending = false;
        sql.open('.data/database.sqlite');

        //  Method:  Handles all message outputing
        //  @param:  Log Code
        //  @return: Formatted Message
        const log = (codelist) =>{
            const loglist = codelist.split(" ");
            const logtable = {
                //"prompt": {color: palette.golden, msg: `**${user.username}**, you're going to pay ${emoji(`artcoins`)}**${format.threeDigitsComa(price)}** for **${amount}** Lucky Tickets? \nplease type \`y\` to confirm your purchase. `},        
                "TEST": {
                    color: palette.red, 
                    msg: `TEST MESSAGE`
                },
                "SHORT_GUIDE" : {
                    color: palette.red, 
                    msg: `♡ __**Short Guide**__ ♡
                          Format: \`${prefix}${command} <user> <amount>\`
                          More Info: \`${prefix}${command} help\``
                },
                "FULL_GUIDE" : {
                    color: palette.red, 
                    msg: `[Enter a complete guide here.]`
                },
                "MISSING_ARGS" : {
                    color: palette.red, 
                    msg: `Hey ${user.username}, please give me a **user** to pay, and the **amount**!`
                },
                "VALID_TARGET_NO_AMOUNT" : {
                    color: palette.golden, 
                    msg: `Hey ${user.username}, how much would you like to pay ${targetuser}? `
                },
                "VALID_AMOUNT_NO_TARGET" : {
                    color: palette.golden, 
                    msg: `Hey ${user.username}, who would you like to pay ${emoji(`artcoins`)}**${format.threeDigitsComa(amount)}** to?`
                },
                "INVALID_AMOUNT": {
                    color: palette.red, 
                    msg: `Hey ${user.username}, that's a strange amount of Art Coins...
                          Could you try again with a different value? ♡`
                },
                "SELF_PAYMENT": {
                    color: palette.red, 
                    msg: `Stupid ${user.username}, why are you trying to pay yourself? ${emoji(`aauSatanialaugh`)}`
                },
                "UNKNOWN_USER": {
                    color: palette.red, 
                    msg: `Sorry ${user.username}, I couldn't find that user... ${emoji(`aauWallSlam`)}
                          You could try again by tagging them like this: "\`${prefix}${command}\` ${user}"`
                },
                "INSUFFICIENT_BAL": {
                    color: palette.red, 
                    msg: `I'm sorry! You you do not have that many Art Coins.`
                },
                "ERROR": {
                    color: palette.red, 
                    msg: `Error: Uncaught Scenario`
                }
            }
            const displist =[];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].msg;
            });
            return format.embedWrapper(logtable[loglist[0]].color, `${displist.join('\n\n')}`);
        }

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
         *  Checks if the value is greater than 0, and not 'NaN' or 'Infinity'
         *  Pair with "Example: if(isPosVal()) and Math.round() to round the argument safely."
         *  @param value string or number
         *  @returns boolean
         */
        const isValidValue = async(string) => await ((!Number.isNaN(Number(string)) && !(Math.round(Number(string)) <= 0) && Number.isFinite(Number(string))) || isAmountAll(string));

        /*  getValidInt() Information
         *  Used for getting the positive, non-zero integer
         *  pair with "isPosVal()"
         *  @param value string or number
         *  @returns a rounded Integer, or 'NaN'
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

        const getUserInventory = async(user) => await sql.get(`SELECT * FROM userinventories WHERE userID = "${user.id}"`);

        /*  argsCheckpoint() Information
         *
         */
        const argsCheckpoint = async() => {
            if(!args[0]) return log(`MISSING_ARGS SHORT_GUIDE`)
            if(args[0].includes('help')) return log(`FULL_GUIDE`)
            if(!args[1]) {
                if(await isValidUser(args[0])) {
                    if(await isUserTarget(args[0])) return log(`SELF_PAYMENT`)
                    targetuser = await getUserData(args[0]);
                    return log(`VALID_TARGET_NO_AMOUNT`);
                }
                if(await isValidValue(args[0])) {
                    await isAmountAll(args[0]) ? amount = (await getUserInventory(user)).artcoins : amount = await getValidInt(args[0]);
                    return log(`VALID_AMOUNT_NO_TARGET`);
                }
                if(await isInvalidNumber(args[0])) return log(`INVALID_AMOUNT`);
                else return log('UNKNOWN_USER')
            }
            if(!args[2]){
                
            }
            return log(`ERROR`)
        }

        // Method: Prompt message before proceeding the transaction
        const checkOut = () => {
            return log(`000`)
        }

        const test = async() => {
            const check = (await getUserInventory(user)).artcoins
            return format.embedWrapper(palette.red, `Check 1: ${check}`);
        }

        const test2 = async() => {
            check = await isPosVal(args[0]);
            check2 = false;
            if(check){
                check2 = await getPosInt(args[0]);
            }
            return format.embedWrapper(palette.red, `Positive Number: ${check} | Evaluated Integer: ${check2}`);
        }

        const run = async () => {
            argsCheckpoint();
        }

        run();
    }
    return pay();
}
exports.help = {
  name: "pay2",
        aliases:[]
}