const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const userFind = require('../utils/userFinding');
const userRecently = new Set();

exports.run = async (bot, command, message, args) => {

    //  Developer Mode Evnironment
    //  Command active only for developers
    const env = require(`../utils/environment.json`);
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
        const user = message.author;
        const sql = require('sqlite');
        sql.open('.data/database.sqlite');
         
        //  Method:  Handles all message outputing
        //  @param:  Log Code
        //  @return: Formatted Message
        const log = (code) => {
            const logtext = {
                //"prompt": {color: palette.golden, msg: `**${user.username}**, you're going to pay ${emoji(`artcoins`)}**${format.threeDigitsComa(price)}** for **${amount}** Lucky Tickets? \nplease type \`y\` to confirm your purchase. `},
                "000": {
                    color: palette.red, 
                    msg: `I'm sorry! You you do not have that many Art Coins.`
                },                
                "TEST": {
                    color: palette.red, 
                    msg: `Arguments: ${args[0]} | ${args[1]} | ${args[2]}`
                },
                "SHORT_GUIDE" : {
                    color: palette.red, 
                    msg: `[Enter a short guide here.]`
                }
            }
            return format.embedWrapper(logtext[code].color, logtext[code].msg);
        }

        const isValidArg = (string) => {

        }

        // Method:  Check if specified string is a valid user
        // @param:  String Input
        // @return: Boolean
        const isValidUser = async(string) => (await userFind.resolve(message, string) ? true : false);

        const getUserData = async(string) => await userFind.resolve(message, string);

        /*  
         *  Checks if the value is greater than 0, and not 'NaN' or 'Infinity'
         *  Pair with "Example: if(isPosVal()) and Math.round() to round the argument safely."
         *  @param value string or number
         *  @returns boolean
         */
        const isPosVal = async(string) => (!Number.isNaN(Number(string)) && !(Math.round(Number(string)) <= 0) && Number.isFinite(Number(string)));

        /*  
         *  Used for getting the positive, non-zero integer
         *  pair with "isPosVal()"
         *  @param value string or number
         *  @returns a rounded Integer, or 'NaN'
         */
        const getPosInt = async(msg) => {
            return !Number.isNaN(Number(msg)) && !(Math.round(Number(msg)) <= 0) && Number.isFinite(Number(msg)) ? Math.round(Number(msg)) : NaN;
        }
        
        // Method: Validates and Organizes Arguments
        const argsCheckpoint = () => {
            if(args.length !== 2) return log(`SHORT_GUIDE`)
        }

        // Method: Prompt message before proceeding the transaction
        const checkOut = () => {
            return log(`000`)
        }

        const test = async() => {
            const user = await userFind.resolve(message, args[0]);
            if(!user){
                return format.embedWrapper(palette.red, `User ID: Not Found`);
            } else {
                return format.embedWrapper(palette.red, `User ID: ${user.id}`);
            }
        }

        const test2 = async() => {
            let check = await isValidUser(args[0]);
            return format.embedWrapper(palette.red, `Valid User: ${check}`);
        }

        const run = async () => {
            test2();
        }

        run();
    }
    return pay();
}
exports.help = {
  name: "pay2",
        aliases:[]
}