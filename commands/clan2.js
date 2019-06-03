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
    sql.open('.data/database.sqlite');

    function User(name) {
        this.name = name;

        let metadata = {
            id: null,
            nickname: null,
            tag: null,
            level: null,
            balance: null
        }


        this.addClanTag = () => {

        }
        this.removeClanTag = () => {

        }

        const getUser = async(user) => await userFind.resolve(message, user)
        const isValidUser = async(user) => (await userFind.resolve(message, user) ? true : false)
        const hasClanTag = (nickname) => (nickname.includes('『') && nickname.includes('』'))
        const getClanTag = (nickname) => nickname.substring(nickname.indexOf('『') + 1,nickname.indexOf('』'))
        const getInventory = async(user_id) => await sql.get(`SELECT * FROM userinventories WHERE userID = "${user_id}"`)
        const getUserData = async(user_id) => await sql.get(`SELECT * FROM userdata WHERE userID = "${user_id}"`)
        const getUserCheck = async(user_id) => await sql.get(`SELECT * FROM usercheck WHERE userID = "${user_id}"`)

        const init = async() => {
            if (await isValidUser(this.name)) {
                let user = await getUser(this.name);
                metadata.id = user.id;
                let userdata = await getUserData(metadata.id)
                metadata.level = userdata.level
                if(user.nickname) {
                    metadata.nickname = user.nickname;
                    if(hasClanTag(metadata.nickname))
                        metadata.tag = getClanTag(metadata.nickname);
                }
                let inventory = await getInventory(metadata.id);
                metadata.balance = inventory.artcoins;
            }
        }

        Object.defineProperties(this,{
            'id': {
                get: async() => {
                    await init();
                    return metadata.id;
                }
            },
            'nickname': {
                get: async() => {
                    await init();
                    return metadata.nickname;
                },
                set: async(new_nickname) => {

                }
            },
            'tag': {
                get: async() => {
                    await init();
                    return metadata.tag;
                }
            },
            'balance': {
                get: async() => {
                    await init();
                    return metadata.balance;
                },
                set: async(new_nickname) => {

                }
            },
            'level': {
                get: async() => {
                    await init();
                    return metadata.level;
                }
            },
        });
    }

    function Clan(name) {
        this.name = name;
        let metadata = {
            tag: null,
            id: null,
            motto: null,
            leader_id: null,
            max_members: 0,

        }
        let roledata = {
            name: `『 ${this.name} 』`,
            color: null,
            hoist: true,
            position: message.guild.roles.array().length - 27,
            permission: 0x0,
            mention: true
        }

        const init = async() => {

        }

        this.createClan = async() => {
            new_role = await (message.guild.createRole(roledata, "test"));
            metadata.id = new_role.id;
            metadata.leader_id = message.author.id;
            sql.run(`INSERT INTO clandata (id, name, tag, motto, leader, maxmember, color, foundingdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            [new_role.id, this.name, metadata.tag, metadata.motto, metadata.leader_id, metadata.max_members, roledata.color, Date.now()])
        }

        this.addMember = async(user_id) => {
            let target = message.guild.members.array().find(x => x.id === user_id)
            await addClanRole(target)
            format.embedWrapper(palette.green, `**You have been assigned a new role!**`)
            await addClanTag(target)
            return format.embedWrapper(palette.green, `**You have been given a new clan tag!**`)
        }

        const addClanRole = async(target) => await target.addRole(metadata.id)

        const addClanTag = async(target) => {
            if (await hasNicknamePerms(bot.user.id)) {
                let old_nickname = target.nickname
                message.guild.members.get(target.id).setNickname(`『${metadata.tag}』${old_nickname}`)
            } else return format.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`);
        }

        const hasNicknamePerms = async(id) => (message.guild.members.get(id).hasPermission("MANAGE_NICKNAMES") 
                                            || message.guild.members.get(id).hasPermission("CHANGE_NICKNAME"))

        const isValidClan = async(clan) => {
            sql.get(SELECT)
        }

        Object.defineProperties(this,{
            'tag' : {
                get: async() => {
                    await init();
                    return metadata.tag;
                },
                set: (new_tag) => {
                    if(new_tag.length >= 10) return log(`GREET_APOLOGY INVALID_TAG_LENGTH`);
                    return metadata.tag = new_tag;
                }
            },
            'color' : {
                get: async() => {
                    await init();
                    return roledata.color;
                },
                set: (new_color) => {
                    //Validation
                    return roledata.color = new_color
                }
            },
            'id' : {
                get: async() => {
                    await init();
                    return metadata.id;
                }
            },
            'motto' : {
                get: async() => {
                    await init();
                    return metadata.motto;
                },
                set: (new_motto) => {
                    //Validation
                    return metadata.motto = new_motto
                }
            },
            'leader_id' : {
                get: async() => {
                    await init();
                    return metadata.leader_id;
                }
            }
        });
    }
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
                msg: `I have run into an error... ${emoji(`aauWallSlam`)}`
            },
            "INVALID_TAG_LENGTH" : {
                color: palette.red,
                msg: `The tag must be 10 characters or less... ${emoji(`aauWallSlam`)}`
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
  
    const getUser = async(user) => await userFind.resolve(message, user)
    /*  Parsing emoji by its name.
     *  @emoji
     */
    const emoji = (name) => bot.emojis.find(e => e.name === name)
    
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
    const test1 = async() => {
        if(args.length >= 2){
            const hasNicknamePerms = async(id) => (message.guild.members.get(id).hasPermission("MANAGE_NICKNAMES") 
            || message.guild.members.get(id).hasPermission("CHANGE_NICKNAME"))
            if (await hasNicknamePerms(bot.user.id)) {
                let target = await getUser(args[0])
                let target_old_nickname = message.guild.members.get(target.id).nickname
                args.shift()
                message.guild.members.get(target.id).setNickname(args.join(" "))
                return format.embedWrapper(palette.green, `- Previous Nickname: ${target_old_nickname}
                                                           - New Nickname: ${args.join(" ")}`);
            } else return format.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`);
        } return format.embedWrapper(palette.golden, `Nickname Change: \`${global_data.prefix}${global_data.command} <Target User> <New Name>\``);
    }

    const test2 = async() => {
        form = args[0]
        return
    }

    /***************************************************************************************************
     * EXECUTION: CLAN TRIAGE
     ***************************************************************************************************/
    const clanTriage = async() => {

        if(args[0] === 'find') {
            args.shift()
            let user = new User(args[0])
            return format.embedWrapper(palette.green, `**User ID:** ${await user.id}
                                                       **Nickname:** ${await user.nickname}
                                                       **Clan Tag:** ${await user.tag}
                                                       **Level:** ${await user.level}
                                                       **Balance:** ${format.threeDigitsComa(await user.balance)}`)            
        }
        if(args[0] === 'create') {
            args.shift()
            let user = new User(global_data.user.username)
            let clan = new Clan(args[0])
            args.shift()
            clan.tag = args[0]
            args.shift()
            clan.color = args[0]
            args.shift()
            clan.motto = args.join(" ")

            await clan.createClan();
            
            format.embedWrapper(palette.green, `**Clan Created! (ID: ${await clan.id})**
                                                **Clan Name:** ${await clan.name}
                                                **Clan Tag:** ${await clan.tag}
                                                **Color:** #${(await clan.color).toString(16)}
                                                **Motto:** ${await clan.motto}
                                                **Leader ID:** ${await clan.leader_id}`) 

            await clan.addMember(await user.id)

        }
        if(args[0] === 'namechange') {
            args.shift()
            return test1()
        }
        if(args[0] === 'test') {
            args.shift()
            format.embedWrapper(palette.green,  `__**Clan Creation Form**__
                                                ★ Please respond with the following format:
                                                ★ *You may use* \`[shift] + [enter]\` *for a new line!*
                                                \`\`\`Name: <clan name here>\nTag: <clan tag here>\nMotto: <clan description/motto here>\`\`\`
                                                __Example__
                                                \`\`\`Name: Debauchery Tea Party\nTag: Tea Party\nMotto: We love tea~ ♡\`\`\``) 
            format.embedWrapper(palette.golden, `★ \`CANCEL\`, \`EXIT\`, \`QUIT\` will terminate this session!
            *${global_data.user.username}, I'll be waiting for your response~* ${emoji(`aauinlove`)}`)
            return test2()
        }
        return

        if(!args[0]) return log(`GREET_NEUTRAL LB LB TRIAGE_HELP`)
        if(!args[1]) {
            if(await isValidSubCommand(args[0])) return toSubCommandFunc(args[0])
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
  