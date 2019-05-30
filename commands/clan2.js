const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const userFind = require('../utils/userFinding');

exports.run = async (bot, command, message, args) => {
    //  Developer Mode Evnironment
    //  Command active only for developers
    const env = require(`../.data/environment.json`);
    if(env.dev && !env.administrator_id.includes(message.author.id))return;


    /***************************************************************************************************
     * GLOBAL VARIABLE INITIALIZATION
     ***************************************************************************************************/
    /*  Global General-Purpose Data
     *  Put data that will be used within any sub-command 
     */
    let global_data = {
        user: message.author,
        command: exports.help.name,
        prefix: env.prefix,
        subcommand_list: [
            "create",
            "manage",
        ]
    }
    const format = new formatManager(message);
    const sql = require('sqlite'); 


    /***************************************************************************************************
     * GLOBAL OUTPUT LOG
     ***************************************************************************************************/
    const log = (codelist) =>{
        const loglist = codelist.split(" ");
        const logtable = {
            "LB": {
                color: palette.white, 
                msg: `\n`
            },
            "GREET_NEUTRAL" : {
                color: palette.white, 
                msg: `Hey ${global_data.user.username}~ `
            },
            "GREET_APOLOGY" : {
                color: palette.white, 
                msg: `Sorry ${global_data.user.username}... `
            },
            "SHORT_GUIDE" : {
                color: palette.green,
                msg: `[Short Guide Here]`
            },
            "TRIAGE_HELP" : {
                color: palette.green, 
                msg: `Here are a list of commands to get you started:
                     **Clan Creation**
                     \`${global_data.prefix}${global_data.command} create\`
                     **Clan Management**
                     \`${global_data.prefix}${global_data.command} manage, add, remove\``
            },
            "NOT_VALID_COMMAND" : {
                color: palette.red, 
                msg: `I cannot find that sub-command... ${emoji(`aauWallSlam`)}`
            },
            "TEST" : {
                color: palette.golden, 
                msg: `I found this sub-command! ${emoji(`aauinlove`)}`
            },
            "ERROR" : {
                color: palette.red, 
                msg: `I cannot find that sub-command... ${emoji(`aauWallSlam`)}`
            }
        }
        const displist =[];
        loglist.forEach((code, i) => {
            displist[i] = logtable[code].msg;
        });
        return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
    }

    /***************************************************************************************************
     * GLOBAL MICRO-FUNCTIONS
     ***************************************************************************************************/
     
    /*  Lifesaver promise. Used pretty often when calling sql API.
     *  @pause
     */
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
    
    /*  Parsing emoji by its name.
     *  @emoji
     */
    const emoji = (name) => bot.emojis.find(e => e.name === name)


    /*  isValudUser() Information
     */
    const isValidUser = async(string) => await userFind.resolve(message, string);

    
    /*  isValidSubCommand() Information
     */
    const isValidSubCommand = async(string) => await global_data.subcommand_list.includes(string);


    /*  toSubCommandFunc() Information
     */
    const toSubCommandFunc = async(string) => {
        subcommand = string.toUpperCase()
        const function_path = {
            "CREATE" : clanCreate,
            "MANAGE" : clanManagement
        }
        return function_path[subcommand]()
    }


    /***************************************************************************************************
     * SUBCOMMAND: CLAN CREATE - clanCreate()
     ***************************************************************************************************/
    const clanCreate = async() => {
        
        /*==========================================*
         *  Clan Create - Output Log Handler        *
         *==========================================*/
        const clanCreateLog = (codelist) =>{
            const loglist = codelist.split(" ");
            const logtable = {
                "TEST": {
                    color: palette.red, 
                    msg: `TEST MESSAGE 1`
                },
            }
            const displist =[];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].msg;
            });
            return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
        }



        let metadata = {
            clan_name: "TeaParty",
            b: "Test 2",
            c: "Test 3"
        } 
        return format.embedWrapper(palette.green, `IM IN CLAN CREATE! 
                                                   HERES CLAN NAME: **${metadata.clan_name}**`);
    }


    /***************************************************************************************************
     * SUBCOMMAND: CLAN MANAGEMENT - clanManagement()
     ***************************************************************************************************/
    const clanManagement = async() => {
        /*==========================================*
         *  Clan Management - Output Log Handler    *
         *==========================================*/
        const clanManagementLog = (codelist) =>{
            const loglist = codelist.split(" ");
            const logtable = {
                "TEST": {
                    color: palette.red, 
                    msg: `TEST MESSAGE 1`
                },
            }
            const displist =[];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].msg;
            });
            return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
        }



        let metadata = {
            a: null,
            b: "Test 2",
            c: "Test 3"
        }
        return format.embedWrapper(palette.green, `IM IN CLAN MANAGEMENT! 
                                                   HERES A RANDOM VALUE: **${metadata.c}**`);  
    }


    /***************************************************************************************************
     * ♡♡♡ TESTING ♡♡♡
     ***************************************************************************************************/
    const test = async() => {
        let test = await isValidSubCommand(args[0])
        return format.embedWrapper(palette.red, `TEST 1: ${test}`); 
    }


    /***************************************************************************************************
     * EXECUTION: CLAN TRIAGE
     ***************************************************************************************************/
    const clanTriage = async() => {

        //test()
        //return

        if(!args[0]) return log(`GREET_NEUTRAL LB LB TRIAGE_HELP`)
        if(!args[1]) {
            if(await isValidSubCommand(args[0])) {
                return toSubCommandFunc(args[0])
            }
            else return log(`GREET_APOLOGY NOT_VALID_COMMAND`)
        }else return log(`SHORT_GUIDE`)
    }

    // For @Naph :)
    return clanTriage();
}
exports.help = {
    name: "clan2",
          aliases:[]
  }