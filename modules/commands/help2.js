const Discord = require('discord.js');
const formatManager = require('../../utils/formatManager.js');
const fs = require('fs');


module.exports.run = async (bot, command, message, args, utils) => {
    

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
            "groups",
        ]
    }

    const format = new formatManager(message);

    /***************************************************************************************************
     * GLOBAL OUTPUT LOG
     ****************************************************************************************************/
    const log = (codelist) => {
        const loglist = codelist.split(" ");
        const logtable = {
            "LB": {
                color: palette.white,
                msg: `\n`
            },
            "GREET_NEUTRAL": {
                color: palette.white,
                msg: `Hey ${global_data.user.username}~ `
            },
            "GREET_APOLOGY": {
                color: palette.white,
                msg: `Sorry ${global_data.user.username}... `
            },
            "SHORT_GUIDE": {
                color: palette.green,
                msg: `[Short Guide Here]`
            },
            "TRIAGE_HELP": {
                color: palette.green,
                msg: `Here are a list of commands to get you started:
                     **Overall Help**
                     \`${global_data.prefix}${global_data.command}\`
                     **Help Specific**
                     \`${global_data.prefix}${global_data.command} group_name\`
                     **Group Names**
                     \`${global_data.prefix}${global_data.command} groups\``
            },
            "NOT_VALID_COMMAND": {
                color: palette.red,
                msg: `I cannot find that sub-command... ${utils.emoji(`aauWallSlam`, bot)}`
            },
            "TEST": {
                color: palette.golden,
                msg: `I found this sub-command! ${utils.emoji(`aauinlove`, bot)}`
            },
            "ERROR": {
                color: palette.red,
                msg: `I cannot find that sub-command... ${utils.emoji(`aauWallSlam`, bot)}`
            }
        }
        const displist = [];
        loglist.forEach((code, i) => {
            displist[i] = logtable[code].msg;
        });
        return format.embedWrapper(logtable[loglist[loglist.length - 1]].color, `${displist.join('')}`);
    }

    /***************************************************************************************************
     * GLOBAL MICRO-FUNCTIONS
     ***************************************************************************************************/

    /**
     * isValudUser() Information
     */
    const isValidUser = async (string) => await utils.userFinding(message, string);
    isValidUser(`placeholder`)
    /**
     * isValidSubCommand() Information
     */
    const isValidSubCommand = async (string) => await global_data.subcommand_list.includes(string);


    /**
     * toSubCommandFunc() Information
     */
    const toSubCommandFunc = async (string) => {
        let subcommand = string.toUpperCase()
        const function_path = {
            "GROUPS": helpCommandGroups,
        }
        return function_path[subcommand]()
    }

    /**
     * Auto adds to the subcommand list based on the group names in the command files
     * @returns {Array} global_data.subcommand_list
     */
    async function populateGlobalSubcommands(){
        fs.readdir("./commands/", (err, files) => {
            if (err) console.log(err);
            const src = require(`./${files[0]}`);
            global_data.subcommand_list.push(src.help.group.toLowerCase());
            for (let file in files) {
                const src = require(`./${files[file]}`);
                if (!global_data.subcommand_list.includes(src.help.group.toLowerCase())) {
                    global_data.subcommand_list.push(src.help.group.toLowerCase());
                }
            }
        })
        await utils.pause(500)
        return global_data.subcommand_list
    }
       
    /**
     * locates all groups names
     * @returns {Array} group names
     */
    async function groupNames() {
        let file_arr = [];
        fs.readdir("./commands/", (err, files) => {
            if (err) console.log(err);
            const src = require(`./${files[0]}`);
            file_arr.push(src.help.group.toLowerCase());
            for (let file in files) {
                const src = require(`./${files[file]}`);
                if (!file_arr.includes(src.help.group.toLowerCase())) {
                    file_arr.push(src.help.group.toLowerCase());
                }
            }
        })
        await utils.pause(500)
        return file_arr
    };

    /**
     * grabs the main name for all commands
     * @returns {Array} command names
     */
    async function mainNames() {
        
        let file_arr = [];
        fs.readdir("./commands/", (err, files) => {
            if (err) console.log(err);

            for (let file in files) {
                const src = require(`./${files[file]}`);
                file_arr.push(src.help.name);
            }
        })
        await utils.pause(500)
        return file_arr
    };
    mainNames()

    /**
     * grabs the main name for a command
     * @returns {String} command name
     */
    async function mainName(file) {

        let name;
        const src = require(`./${file}`);
        name = src.help.name;
        await utils.pause(500)
        return name
    };

    /**
     * Grabs any aliases for a file if one exists
     * @param {String} file file name
     * @returns {Array} Array of aliases names 
     */
    async function aliases(file) {
        let file_arr = [];
        const src = require(`./${file}`);
        if(src.help.aliases.length===0)return file_arr="No aliases were found"
        for (let x = 0; x < src.help.aliases.length; x++) {
            file_arr.push(src.help.aliases[x]);
        }
        await utils.pause(500)
        return file_arr
    };
    aliases()

    /**
     * Grabs the description of a file
     * @param {String} file file name
     * @returns {String} description
     */
    async function description(file) {
        let description;
        const src = require(`./${file}`);
        description = src.help.description;
        await utils.pause(500)
        return description
    };
    description()
    /**
     * Grabs the usage of a file
     * @param {String} file file name
     * @returns {String} usage
     */
    async function usage(file) {
        let usage;
        const src = require(`./${file}`);
        usage = src.help.usage;
        await utils.pause(500)
        return usage
    };
    usage()
    /**
     * Grabs the group name of a file
     * @param {String} file file name
     * @returns {String} group name
     */
    async function groupName(file) {
        let groupName;
        const src = require(`./${file}`);
        groupName = src.help.group;
        await utils.pause(500)
        return groupName
    };

    /**
     * Grabs the public data for a file
     * @param {String} file file name
     * @returns {boolean} boolean
     */
    async function public(file) {
        let public;
        const src = require(`./${file}`);
        public = src.help.public;
        await utils.pause(500)
        return public
    };
    
    /***************************************************************************************************
     * SUBCOMMAND: Help Command Groups - helpCommandGroups()
     ***************************************************************************************************/
    const helpCommandGroups = async() => {
        let groups = await groupNames();
        return format.embedWrapper(palette.green,   `Hey ${global_data.user.username}. . .
                                                    Here are the Group names you can use:
                                                    **${groups.join(`\n`)}**`);
    }

    const helpCommandMain = async() => {
        const helpMainLog = (codelist) => {
            const loglist = codelist.split(" ");
            const logtable = {
                "TEST": {
                    color: palette.red,
                    msg: `TEST MESSAGE 1`
                },
            }
            const displist = [];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].msg;
            });
            return format.embedWrapper(logtable[loglist[loglist.length - 1]].color, `${displist.join('')}`)
        }
        helpMainLog()

        /**
         * Global varibles for function
         */
        const embed = new Discord.RichEmbed();
        let pages=[];
        let pageHeaderOptions = await groupNames();
        pageHeaderOptions.sort();

        for (let x = 0; x < pageHeaderOptions.length; x++) {
            pages.push(new Array(`**${pageHeaderOptions[x].toUpperCase()}**`))
        }


        return utils.pages(message,pages,embed);
    }

    /***************************************************************************************************
     * SUBCOMMAND: Help Command Groups - helpCommandGroups()
     ***************************************************************************************************/


    /***************************************************************************************************
    * EXECUTION: Main
    ***************************************************************************************************/
    async function main(){
        if (!args[0]) return helpCommandMain();
        if (args[0].toLowerCase() === 'help') return log(`GREET_NEUTRAL LB LB TRIAGE_HELP`);

        if (!args[1]) {
            if (await isValidSubCommand(args[0])) {
                return toSubCommandFunc(args[0])
            }else return log(`GREET_APOLOGY NOT_VALID_COMMAND`)
        } else return log(`SHORT_GUIDE`);
    };
    
    /***************************************************************************************************
     * ♡♡♡ TESTING ♡♡♡
     ***************************************************************************************************/
     async function test(){
        //let fileName = await fileNames();
        //let group = await groupName(fileName[0]);
         //return await format.embedWrapper(palette.red, group.toLowerCase());
        //return helpCommandGroups();
         
    }
    test()
    
    /***************************************************************************************************
    * EXECUTION: Run
    ***************************************************************************************************/
    async function run(){

        await populateGlobalSubcommands();
        //test()
        main();
    
    };

    
    return ["sandbox", `bot`].includes(message.channel.name) ? run()
        : format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`);

    }
module.exports.help = {
    name: "help2",
    aliases: [],
    description: `gives a list of current commands`,
    usage: `>help2`,
    group: "General",
    public: false,
}