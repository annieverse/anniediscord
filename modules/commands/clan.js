class clan_wrapper {
    constructor(Stacks) {
        this.stacks     = Stacks;
    }

    async execute() {
        let authorname  = this.stacks.meta.author.username
        let bot         = this.stacks.bot;
        let message     = this.stacks.message;
        let args        = this.stacks.args;
        let code        = this.stacks.code;
        let palette     = this.stacks.palette;
        let emoji       = this.stacks.emoji;

        
        /***************************************************************************************************
         * GLOBAL VARIABLE INITIALIZATION
         ***************************************************************************************************/
        /*  Global General-Purpose Data
         *  Put data that will be used within any sub-command 
         */

        const commandname = exports.help.name;
        const env = require('../../.data/environment.json');        //  Temporary
        const prefix = env.prefix;                                  //  Temporary
        const formatManager = require('../../utils/formatManager'); //  Temporary
        const format = new formatManager(message);                  //  Temporary
        const sql = require('sqlite');
        const sqlpath = '.data/database.sqlite';
        sql.open(sqlpath);

        const Discord = require('discord.js');                      //  Temporary
        const collector = new Discord.MessageCollector(
            message.channel,
            m => m.author.id === message.author.id, {
                max: 1,
                time: 30000,
            }
        );

        const rolegroups = {
            "PUBLIC": { 
                everyone    : "459891664182312980"
            },
            "DEVELOPER": { 
                developer   : "502843277041729546",
            },
            "ADMIN": { 
                grandmaster : "459936023498063902",
            }
        }

        /***************************************************************************************************
         * GLOBAL CLASS / FUNCTION INITIALIZATION
         ***************************************************************************************************/
        class Subcommand {
            constructor (metadata) {
                this._name = args[0];
                this._subcommandlist = metadata.commandlist;
                this._exists = false;
            }


            //  PUBLIC OUTPUT
            get name()      { return this._name }
            get exists()    { return this._exists }


            //  OBTAIN: Property Container Functions
            __get_subcommand() { this._subcommand = this._findSubcommand() }

            //  UPDATE: Micro-Functions
            __update_exists(boolean) { this._exists = boolean }
            __update_metadata() { this._metadata = this._subcommand.metadata }

            //  REFRESH: Repull Property Containers
            _refresh_subcommand() {
                this.__get_subcommand();
                this.__update_metadata();
            }


            //  PRIVATE UTILITY METHODS
            _isValidSubCommand() { return this._findSubcommand() ? true : false }
            _normalizeSubcommand() { if(this._name) { this._name = this._name.toUpperCase() } }
            _executeSubcommand() { return this._subcommand.execute(this._metadata) }
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
            _accessGranted() {
                console.log(user.roles)
                for(let key in user.roles) {
                    console.log(key)
                }
            }


            //  PUBLIC METHODS
            init() {
                this._normalizeSubcommand()
                if (this._isValidSubCommand()) { 

                    this.__update_exists(true) 
                    this._refresh_subcommand()

                } else this.__update_exists(false) 
                return this
            }
            async execute() {
                args.shift();
                if (this._name.toUpperCase() !== "HELP") invoker = this._metadata;
                let subcommand = await new Subcommand(this._metadata).init();
                if(subcommand.exists) return await subcommand.execute()
                else return this._executeSubcommand();
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
            get clantag()       { return null }
            get nametag()       { return null }
            get level()         { return this._userlevel }
            get artcoins()      { return this._userbalance }
            get roles()         { return this._roles }


            //  OBTAIN: Property Container Functions
            async __get_user() { this._user = await this._findUser() }
            async __get_guildMemberData() { this._guildmember = await message.guild.members.get(this._userid) }
            async __get_guildRoles() { this._allroles = await this._guildmember.roles.array() }
            async __get_userData() { this._userdata = await sql.get(`SELECT * FROM userdata WHERE userID = "${this._userid}"`) }
            async __get_inventory() { this._userinventories = await sql.get(`SELECT * FROM userinventories WHERE userID = "${this._userid}"`) }
            async __get_userCheck() { this._userstatus = await sql.get(`SELECT * FROM usercheck WHERE userID = "${this._userid}"`) }
            
            // UPDATE: Micro-Functions
            __update_exists(boolean) { this._exists = boolean }
            __update_requestName(request) { this._requestname = request }
            __update_userName() { this._discriminator = this._user.user.discriminator; this._name = this._user.user.username }
            __update_userPFP() { this._userprofileurl = this._user.user.displayAvatarURL }
            __update_userNickname() { this._usernickname = this._user.nickname }
            __update_userID() { this._userid = this._user.id }
            __update_userRoles() { let roles = {}; this._allroles.forEach((e) => { roles[e.id] = e.name }); this._roles = roles }
            __update_userLevel() { this._userlevel = this._userdata.level }
            __update_userBalance() { this._userbalance = this._userinventories.artcoins }
            
            //  REFRESH: Repull Property Containers
            async _refresh_user() { 
                await this.__get_user();
                this.__update_userName();
                this.__update_userPFP();
                this.__update_userNickname();
                this.__update_userID();
                
                await this.__get_guildMemberData();
                await this.__get_guildRoles();
                this.__update_userRoles();
            }
            async _refresh_userData() {
                await this.__get_userData();
                this.__update_userLevel(); 
            }
            async _refresh_userInventory() {
                await this.__get_inventory();
                this.__update_userBalance();
            }
            async _refresh_userStatus() {
                await this.__get_userCheck();
            }

            //  PRIVATE UTILITY METHODS
            async _isValidUser() { return await this._findUser() ? true : false }
            async _findUser() {
                const userPattern = /^(?:<@!?)?([0-9]+)>?$/;
                if (userPattern.test(this._requestname)) this._requestname = this._requestname.replace(userPattern, '$1');
                let members = message.guild.members;
                const filter = member => 
                    member.user.id                      === this._requestname ||
                    member.displayName.toLowerCase()    === this._requestname.toLowerCase() ||
                    member.user.username.toLowerCase()  === this._requestname.toLowerCase() ||
                    member.user.tag.toLowerCase()       === this._requestname.toLowerCase();
                return members.filter(filter).first();
            }
            async _botHasNicknamePerms() {(
                message.guild.members.get(bot.user.id).hasPermission("MANAGE_NICKNAMES") || 
                message.guild.members.get(bot.user.id).hasPermission("CHANGE_NICKNAME"));
            }
            async _setNickname(new_nickname) {
                await this._refresh_user();
                if(await _botHasNicknamePerms()) {
                    await this._guildmember.setNickname(new_nickname);
                    await this.__update_requestName(new_nickname);
                    await this._refresh_user();
                } else return format.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`);
            }



            // PUBLIC METHODS
            async addClanTag() {}
            async removeClanTag() {}

            async init() {
                if (await this._isValidUser()) {

                    this.__update_exists(true);
                    await this._refresh_user();
                    await this._refresh_userData();
                    await this._refresh_userInventory();
                    await this._refresh_userStatus();

                } else this.__update_exists(false)
                return this
            }      
        }

        class Clan {
            constructor(clanname) {
                this._requestname = clanname;
                this._exists = false;
            }

            //  PUBLIC OUTPUT
            get something() {return "something"}

            //  PUBLIC INPUT
            set something(something) {something}

            //  OBTAIN: Property Container Functions
            async _get_clan() {}

            //  UPDATE: Micro-Functions
            async _update_clan() {} //Temp

            //  REFRESH: Repull Property Containers
            async _refresh_something() {}

            //  PRIVATE UTILITY METHODS
            async _isValidClan() {}

            //  PUBLIC METHODS
            async init() {

            }
            async create() {

            }
        }

        class Member extends User {

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

            const isValidClan = async(clan) => {
                sql.get(SELECT)
            }

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
                    msg: `I cannot find that sub-command... ${emoji(`aauWallSlam`,bot)}`
                },
                "TEST" : {
                    color: palette.golden, 
                    msg: `Hello! ${emoji(`aauinlove`,bot)}`
                },
                "ERROR" : {
                    color: palette.red, 
                    msg: `I have run into an error... ${emoji(`aauWallSlam`,bot)}`
                },
                "INVALID_TAG_LENGTH" : {
                    color: palette.red,
                    msg: `The tag must be 10 characters or less... ${emoji(`aauWallSlam`,bot)}`
                },
                "INVALID_USER" : {
                    color: palette.red,
                    msg: `I couldn't find that user... ${emoji(`aauWallSlam`,bot)}`
                }
            }
            const displist =[];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].msg;
            });
            return format.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
        }

        
        /***************************************************************************************************
         * UTILITY COMMANDS
         ***************************************************************************************************/
        let help = {
            metadata: {
                name: "HELP",
                alias: [],
                commandlist: [],
                info: "Command Information Here",
                access: {
                    status: "PUBLIC",   //  PUBLIC, MEMBER, LEADER
                    roles: "PUBLIC"     //  PUBLIC, DEVELOPER, ADMIN
                }
            },
            execute: async(metadata) => {
                metadata = invoker;
                format.embedWrapper(palette.green, `Detailed Guide For: ${metadata.name}`)
            }
        }

        /***************************************************************************************************
         * ♡♡♡ TESTING ♡♡♡
         ***************************************************************************************************/
        let test_userNicknameChange = {
            metadata: {
                name: "NAMECHANGE",
                alias: ["NICKCHANGE", "NICKNAME", "CHANGE"],
                commandlist: [help]
            },
            execute: async(metadata) => {

                if (args.length >= 2) { 
                    target = await new User(args[0]).init();
                    args.shift()
                } else return format.embedWrapper(palette.golden, `Nickname Change: \`${prefix}${commandname} namechange <Target User> <New Name>\``);
                await target._setNickname(args.join(" "))

            }
        }

        let test_userFind = {
            metadata: {
                name: "USERFIND",
                alias: ["USERDATA", "USERINFO", "USER"],
                commandlist: [help]
            },
            execute: async(metadata) => {

                if (args.length === 0) target = user;
                else if (args.length >= 1) target = await new User(args.join(" ")).init();
                else return format.embedWrapper(palette.golden, `User Info Find: \`${prefix}${commandname} find <Blank or Target User>\``);

                if (target.exists) {
                    let markdown = `HTTP\n`
                    return format.embedWrapper(palette.darkmatte, 
                        `Search Input: \`\`\`${markdown}${target.r_name}\`\`\`
                        User ID: \`\`\`${markdown}${target.id}\`\`\`
                        User Name: \`\`\`${markdown}${target.name} #${target.discriminator}\`\`\`
                        Nickname: \`\`\`${markdown}${target.nickname}\`\`\`
                        Profile Image URL: \`\`\`${markdown}${target.pfpurl}\`\`\`
                        Clan Tag: \`\`\`${markdown}${target.nametag}\`\`\`
                        Level: \`\`\`${markdown}${target.level}\`\`\`
                        Balance: \`\`\`${markdown}${format.threeDigitsComa(target.artcoins)} Artcoins\`\`\`
                        Roles: \`\`\`${markdown}${JSON.stringify(target.roles).replace(/{|"|}/g,'').replace(/,/g,'\n').replace(/:/g,' : ')}\`\`\``)
                } else return log(`GREET_APOLOGY LB INVALID_USER`) 

            }
        }

        let test_1 = {
            metadata: {
                name: "TEST1",
                alias: ["1", "11", "111"],
                commandlist: [help]
            },
            execute: async(metadata) => {
                let markdown = `HTTP\n`
                format.embedWrapper(palette.green,  
                    `__**Clan Creation Form**__
                    ★ Please respond with the following format:
                    ★ *You may use* \`[shift] + [enter]\` *for a new line!*
                    \`\`\`${markdown}Name: <clan name here>\nTag: <clan tag here>\nMotto: <clan description/motto here>\`\`\`
                    **Example:**
                    \`\`\`${markdown}Name: Debauchery Tea Party\nTag: Tea Party\nMotto: We love tea~ ♡\`\`\``) 
                format.embedWrapper(palette.golden, 
                    `★ \`CANCEL\`, \`EXIT\`, \`QUIT\` will terminate this session!
                    *${user.name}, I'll be waiting for your response~* ${emoji(`aauinlove`,bot)}`)
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

        let test_2 = {
            metadata: {
                name: "TEST2",
                alias: ["2", "22", "222"],
                commandlist: [help]
            },
            execute: async(metadata) => {

                if (args.length === 0) target = user;
                else if (args.length >= 1) target = await new User(args.join(" ")).init();
                else return format.embedWrapper(palette.golden, `Test`);
                
                console.log(await target._isValidUser(target.r_name))
                return
                if (target.exists) {
                    return format.embedWrapper(palette.green, `Nickname: ${target.nickname}`)
                } else return format.embedWrapper(palette.red, `Could not find user: **${target.name}** ${emoji(`aauWallSlam`,bot)}`)
            }
        }


        /***************************************************************************************************
         * TIER 2 COMMANDS
         ***************************************************************************************************/

        /***************************************************************************************************
         * TIER 1 COMMANDS
         ***************************************************************************************************/
        let clanCreationInterface = { 
            metadata: {
                name: "CREATE",
                alias: ["CREATION", "MAKE"],
                commandlist: [help]
            },
            execute: async(metadata) => {
                return console.log("Not a valid command. Executing Create code.")

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

        let clanManagement = {
            metadata: {
                name: "MANAGE",
                alias: ["MANAGEMENT", "SETTINGS", "SETTING"],
                commandlist: [help]
            },
            execute: async(metadata) => {
                return format.embedWrapper(palette.green, `Executing Clan Management!`);  
            }
        }

        /***************************************************************************************************
         * MAIN COMMAND
         ***************************************************************************************************/
        let clanTriage = {
            metadata: {
                name: "TRIAGE",
                alias: [],
                info: "Command Information Here",
                help: "How to use here!",
                commandlist: [
                    help,
                    clanManagement,
                    clanCreationInterface,
                    test_userNicknameChange,
                    test_userFind,
                    test_1,
                    test_2
                    
                ],
                access: {
                    status: "PUBLIC",   //  PUBLIC, MEMBER, LEADER
                    roles: "PUBLIC"     //  PUBLIC, DEVELOPER, ADMIN
                }
            },
            execute: async(metadata) => {
                if(!args[0]) return log(`GREET_NEUTRAL LB LB TRIAGE_HELP`);
            }
        }

        /***************************************************************************************************
         * EXECUTION:
         ***************************************************************************************************/
        let user = await new User(authorname).init();
        let target = null;
        let invoker = null; //Required for help command!
        let metadata = {commandlist: [clanTriage]}
        args.unshift("TRIAGE")
        let subcommand = await new Subcommand(metadata).init();
        if(subcommand.exists) return await subcommand.execute()
        else return log(`ERROR`)
    }
}

module.exports.help = {
    start: clan_wrapper,
    name: "clan",
    aliases: ["guild", "yun"],
    description: `Clans`,
    usage: `${require(`../../.data/environment.json`).prefix}clan2`,
	group: "Admin",
	public: false,
	required_usermetadata: true,
	multi_user: false
}
