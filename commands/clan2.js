const Discord = require('discord.js');
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const env = require('../.data/environment.json');

module.exports.run = async (bot, command, message, args, utils) => {
    //  Developer Mode Environment
    //  Command active only for developers
    if(env.dev && !env.administrator_id.includes(message.author.id))return;


    /***************************************************************************************************
     * GLOBAL VARIABLE INITIALIZATION
     ***************************************************************************************************/
    /*  Global General-Purpose Data
     *  Put data that will be used within any sub-command 
     */

    const authorname = message.author.username;
    const commandname = exports.help.name;
    const prefix = env.prefix; 
    const format = new formatManager(message);
    const sql = require('sqlite');
    const sqlpath = '.data/database.sqlite';
    sql.open(sqlpath);

    const collector = new Discord.MessageCollector(
        message.channel,
        m => m.author.id === message.author.id, {
            max: 1,
            time: 30000,
        }
    );

    const permissionslist = {
        "PUBLIC": { 
            ID: ["",
                 ""] },
        "MEMBER": { 
            ID: ["",
                 ""] },
        "LEADER": { 
            ID: ["",
                 ""] },
        "DEVELOPER": { 
            ID: ["",
                 ""] },
        "ADMIN": { 
            ID: ["",
                 ""] },
    }

    /***************************************************************************************************
     * GLOBAL CLASS / FUNCTION INITIALIZATION
     ***************************************************************************************************/
    class Subcommand {
        constructor (metadata = null) {
            this._name = metadata.subcommand;
            this._subcommandlist = metadata.commandlist;
            this._exists = false;
        }

        //  PUBLIC OUTPUT
        get name()      { return this._name }
        get exists()    { return this._exists }

        //  PUBLIC INPUT
        set name(subcommand) {
            this._name = subcommand
            this.init()
        }

        //  PRIVATE UTILITY METHODS
        _isValidSubCommand() { return this._findSubcommand() ? true : false }
        _normalizeSubcommand() { if(this._name) { this._name = this._name.toUpperCase() } }
        _executeSubcommand() { this._pull_Subcommand(); return this._subcommand.execute() }
        _findSubcommand() {
            let subcommand = null
            this._subcommandlist.forEach((element) => {
                if(element.metadata.name === this._name 
                    || element.metadata.alias.indexOf(this._name) >= 0) { 
                    subcommand = element
                }
            })
            return subcommand
        }

        //  UPDATE / REPULL: Property Container Functions
        _pull_Subcommand() { return this._subcommand = this._findSubcommand() }

        //  UPDATE: Class Property Functions
        _update_exists(boolean) { return this._exists = boolean }
        _update_metadata() { this._pull_Subcommand(); return this._metadata = this._subcommand.metadata}

        //  PUBLIC METHODS
        init() {
            this._normalizeSubcommand()
            if (this._isValidSubCommand()) { 

                this._update_exists(true) 
                this._update_metadata()

            }
            return this
        }
        async execute() {
            args.shift();
            return await this._executeSubcommand();
        }
    }

    class User {
        constructor(username) {
            this._requestname = username;
            this._exists = false;
        }


        get exists()        { return this._exists}
        //  PUBLIC OUTPUT: User Class Data
        get r_name()        { return this._requestname }
        get name()          { return this._name }
        get discriminator() { return this._discriminator }
        get pfpurl()        { return this._userprofileurl }
        //  PUBLIC OUTPUT: Discord-side Data
        get nickname()      { return this._usernickname }
        get id()            { return this._userid }
        //  PUBLIC OUTPUT: Server Database Data
        get tag()           { return null }
        get level()         { return this._userlevel }
        get artcoins()      { return this._userbalance }
        get roles()         { return this._roles }


        //  EXISTANCE CHECK
        async _isValidUser() { return (await utils.userFinding(message, this._requestname)) ? true : false }
        
        //  OBTAIN: Property Container Functions
        async _getUser() { return (await utils.userFinding(message, this._requestname)) }
        async _getUserData() { return await sql.get(`SELECT * FROM userdata WHERE userID = "${this.id}"`) }
        async _getInventory() { return await sql.get(`SELECT * FROM userinventories WHERE userID = "${this.id}"`) }
        async _getUserCheck() { return await sql.get(`SELECT * FROM usercheck WHERE userID = "${this.id}"`) }
    
        //  UPDATE / REPULL: Property Container Functions
        async _pull_user() { return this._user = await this._getUser() }
        async _pull_userData() { return this._userdata = await this._getUserData() }
        async _pull_userInventory() { return this._userinventories = await this._getInventory() }
        async _pull_userStatus() { return this._userstatus = await this._getUserCheck() }

        //  UPDATE: Class Property Functions
        _update_exists(boolean) { return this._exists = boolean }
        async _update_userName() { await this._pull_user(); this._discriminator = this._user.user.discriminator; this._name = this._user.user.username }
        async _update_userPFP() { await this._pull_user(); return this._userprofileurl = this._user.user.displayAvatarURL }
        async _update_userNickname() { await this._pull_user(); return this._usernickname = this._user.nickname }
        async _update_userID() { await this._pull_user(); return this._userid = this._user.id }
        async _update_guildMemberData() { await this._pull_user(); return this._guildmember = await message.guild.members.get(this.id) }
        async _update_userLevel() { await this._pull_userData(); return this._userlevel = this._userdata.level }
        async _update_userBalance() { await this._pull_userInventory(); return this._userbalance = this._userinventories.artcoins }
        async _update_userRoles() { 
            await this._pull_user();
            await this._update_guildMemberData();
            let roles = {}
            await this._guildmember.roles.array().forEach((element) => { roles[element.id] = element.name })
            return this._roles = roles
        }
        
        //  Force re-initialize all data
        async _refresh() { await init() }


        //  PRIVATE UTILITY METHODS
        async _setNickname(new_nickname) {
            await this._update_guildMemberData();
            await this._guildmember.setNickname(new_nickname);
            await this._update_guildMemberData();
            await this._update_userNickname();
        }


        // PUBLIC METHODS
        async addClanTag() {}
        async removeClanTag() {}

        async init() {
            if (await this._isValidUser()) {

                //  User Class Data
                this._update_exists(true)
                //  Discord-side
                await this._update_userName();
                await this._update_userNickname();
                await this._update_userPFP();
                await this._update_userID();
                await this._update_guildMemberData();
                await this._update_userRoles();
                //  Server Database
                await this._update_userLevel();
                await this._update_userBalance();
            }
            return this
        }      
    }

    class Clan {
        constructor(clanname) {
            this._requestname = clanname;
            this._exists = false;
        }

        //  EXISTANCE CHECK
        async _isValidClan() {}


        //  PUBLIC METHODS
        async init() {

        }
        async create() {

        }
    }

    /*
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
    */

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
                msg: `Hey ${user.name}~ `
            },
            "GREET_APOLOGY" : {
                color: palette.white, 
                msg: `Sorry ${user.name}... `
            },
            "SHORT_GUIDE" : {
                color: palette.green,
                msg: `[Short Guide Here]`
            },
            "TRIAGE_HELP" : {
                color: palette.green, 
                msg: `Here are a list of commands to get you started:
                     **Clan Creation**
                     \`${prefix}${commandname} create\`
                     **Clan Management**
                     \`${prefix}${commandname} manage, add, remove\``
            },
            "NOT_VALID_COMMAND" : {
                color: palette.red, 
                msg: `I cannot find that sub-command... ${utils.emoji(`aauWallSlam`,bot)}`
            },
            "TEST" : {
                color: palette.golden, 
                msg: `Hello! ${utils.emoji(`aauinlove`,bot)}`
            },
            "ERROR" : {
                color: palette.red, 
                msg: `I have run into an error... ${utils.emoji(`aauWallSlam`,bot)}`
            },
            "INVALID_TAG_LENGTH" : {
                color: palette.red,
                msg: `The tag must be 10 characters or less... ${utils.emoji(`aauWallSlam`,bot)}`
            },
            "INVALID_USER" : {
                color: palette.red,
                msg: `I couldn't find that user... ${utils.emoji(`aauWallSlam`,bot)}`
            }
        }
        const displist =[];
        loglist.forEach((code, i) => {
            displist[i] = logtable[code].msg;
        });
        return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
    }

    /***************************************************************************************************
     * SUBCOMMANDS
     ***************************************************************************************************/

    clanCreationInterface = { 
        metadata: {
            name: "CREATE",
            alias: ["CREATION", "MAKE"]
        },
        execute: async() => {
            if (args.length >= 4) {
                //let user = new User(global_data.user.username)
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
            } return format.embedWrapper(palette.golden, `Clan Creation: \`${prefix}${commandname} create <Clan Name> <Tag> <Color> <Motto>\``);
        }
        
    } 

    clanManagement = {
        metadata: {
            name: "MANAGE",
            alias: ["MANAGEMENT", "SETTINGS", "SETTING"]
        },
        execute: async() => {
            return format.embedWrapper(palette.green, `Executing Clan Management!`);  
        }
    }

    /***************************************************************************************************
     * ♡♡♡ TESTING ♡♡♡
     ***************************************************************************************************/
    userNicknameChange = {
        metadata: {
            name: "NAMECHANGE",
            alias: ["NICKCHANGE", "NICKNAME", "CHANGE", "NC"]
        },
        execute: async() => {
            if (args.length >= 2) { 
                target = await new User(args[0]).init();
                args.shift()
            } else return format.embedWrapper(palette.golden, `Nickname Change: \`${prefix}${commandname} namechange <Target User> <New Name>\``);
            
    
            const hasNicknamePerms = async(id) => (message.guild.members.get(id).hasPermission("MANAGE_NICKNAMES") 
                                                || message.guild.members.get(id).hasPermission("CHANGE_NICKNAME"));
    
            
            if (await hasNicknamePerms(bot.user.id)) {
                let oldnickname = target.nickname
                await target._setNickname(args.join(" "))
    
                format.embedWrapper(palette.green, 
                    `- Previous Nickname: **${oldnickname}**
                    - New Nickname: **${target.nickname}**`);
            } else return format.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`);
        }
    }

    userFind = {
        metadata: {
            name: "USERFIND",
            alias: ["FIND", "USERDATA", "USERINFO", "USER"]
        },
        execute: async() => {
            if (args.length === 0) target = user;
            else if (args.length >= 1) target = await new User(args.join(" ")).init();
            else return format.embedWrapper(palette.golden, `User Info Find: \`${prefix}${commandname} find <Blank or Target User>\``);

            if (target.exists) {
                markdown = `HTTP\n`
                return format.embedWrapper(palette.darkmatte, 
                    `**Search Input:** \`\`\`${markdown}${target.r_name}\`\`\`
                    **User ID:** \`\`\`${markdown}${target.id}\`\`\`
                    **User Name:** \`\`\`${markdown}${target.name} #${target.discriminator}\`\`\`
                    **Nickname:** \`\`\`${markdown}${target.nickname}\`\`\`
                    **Profile Image URL:** \`\`\`${markdown}${target.pfpurl}\`\`\`
                    **Clan Tag:** \`\`\`${markdown}${target.tag}\`\`\`
                    **Level:** \`\`\`${markdown}${target.level}\`\`\`
                    **Balance:** \`\`\`${markdown}${format.threeDigitsComa(target.artcoins)} Art Coins\`\`\`
                    **Roles:** \`\`\`${markdown}${JSON.stringify(target.roles).replace(/{|"|}/g,'').replace(/,/g,'\n').replace(/:/g,' : ')}\`\`\``)
            } else return log(`GREET_APOLOGY LB INVALID_USER`) 
        }
    }

    test1 = {
        metadata: {
            name: "TEST1",
            alias: ["1", "11", "111"]
        },
        execute: async() => {
            markdown = `HTTP\n`
            format.embedWrapper(palette.green,  
                `__**Clan Creation Form**__
                ★ Please respond with the following format:
                ★ *You may use* \`[shift] + [enter]\` *for a new line!*
                \`\`\`${markdown}Name: <clan name here>\nTag: <clan tag here>\nMotto: <clan description/motto here>\`\`\`
                **Example:**
                \`\`\`${markdown}Name: Debauchery Tea Party\nTag: Tea Party\nMotto: We love tea~ ♡\`\`\``) 
            format.embedWrapper(palette.golden, 
                `★ \`CANCEL\`, \`EXIT\`, \`QUIT\` will terminate this session!
                *${user.name}, I'll be waiting for your response~* ${utils.emoji(`aauinlove`,bot)}`)
                .then(async prompt_msg => {
                    collector.on(`collect`, async (msg) => {
                        prompt_msg.delete();
                        msg.delete();
    
                        let user_input = msg.content;
                        format.embedWrapper(palette.green, 
                            `Thank you for your response!
                            **User Input:** ${user_input}`);
                        
                    });
                })
        }
    }

    test2 = {
        metadata: {
            name: "TEST2",
            alias: ["2", "22", "222"]
        },
        execute: async() => {
            if(args.length >= 1)
            {
                let target = await new User(args[0]).init();
                if (target.exists) {
                    return format.embedWrapper(palette.green, `Nickname: ${target.nickname}`)
                } else return format.embedWrapper(palette.red, `Could not find user: **${target.name}** ${utils.emoji(`aauWallSlam`,bot)}`)
            }
        }
    }

    test3 = {
        metadata: {
            name: "TEST3",
            alias: ["3", "33", "333"]
        },
        execute: () => {
            return format.embedWrapper(palette.golden, `Execute TEST 3`)
        }
    },

    test4 = {
        metadata: {
            name: "TEST4",
            alias: ["4", "44", "444"]
        },
        execute: () => {
            return format.embedWrapper(palette.golden, `Execute TEST 4`)
        }
    }

    /***************************************************************************************************
     * EXECUTION: CLAN TRIAGE
     ***************************************************************************************************/
    const clanTriage = async() => {

        let metadata = {
            subcommand: null,
            info: "Command Information Here",
            commandlist: [
                clanManagement,
                clanCreationInterface,
                userNicknameChange,
                userFind,
                test1,
                test2,
                test3,
                test4
            ]
        }

        //  GLOBAL OBJECTS
        user = await new User(authorname).init();               //  Initializes "user" as message author
        subcommand = await new Subcommand(metadata).init();     //  Initializes "subcommand" as blank Subcommand
        
        if(!args[0]) return log(`GREET_NEUTRAL LB LB TRIAGE_HELP`);
        else {
            console.log(user._user.user.displayAvatarURL)
            subcommand.name = args[0]
            if(subcommand.exists) return await subcommand.execute()
            else return log(`NOT_VALID_COMMAND`)
        }
    }

    try { clanTriage() } 
    catch (e) { console.log(`Command: ${prefix}${commandname} Error.`) }
}
exports.help = {
    name: "clan",
    aliases: ["guild", "yunyun", "yuuni", "yun"],
    description: `Complete clan module.`,
    usage: `${env.prefix}clan`,
    group: "General",
    public: false,
  }  