const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const env = require('../.data/environment.json');
const prefix = env.prefix;

module.exports.run = async (bot, command, message, args, utils) => {
    //  Developer Mode Evnironment
    //  Command active only for developers
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
                msg: `I cannot find that sub-command... ${utils.emoji(`aauWallSlam`,bot)}`
            },
            "TEST" : {
                color: palette.golden, 
                msg: `I found this sub-command! ${utils.emoji(`aauinlove`,bot)}`
            },
            "ERROR" : {
                color: palette.red, 
                msg: `I cannot find that sub-command... ${utils.emoji(`aauWallSlam`,bot)}`
            }
        }
        const displist =[];
        loglist.forEach((code, i) => {
            displist[i] = logtable[code].msg;
        });
        return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
    }


    
    /*  isValidSubCommand() Information
     */
    const isValidSubCommand = async(string) => await global_data.subcommand_list.includes(string);


    /*  toSubCommandFunc() Information
     */
    const toSubCommandFunc = async(string) => {
        let subcommand = string.toUpperCase()
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



        let metadata = {
            a: null,
            b: "Test 2",
            c: "Test 3"
        }
        return format.embedWrapper(palette.green, `IM IN CLAN MANAGEMENT! 
                                                   HERES A RANDOM VALUE: **${metadata.c}**`);  
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
    aliases: [],
    description: `Allows you to get help with clans and how to start a clan`,
    usage: `${prefix}clan2`,
    group: "General",
    public: false,
  }