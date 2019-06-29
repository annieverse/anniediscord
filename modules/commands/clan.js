/** Notes:
 *  - refactor userFind regex
 */

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
        const Discord = require('discord.js');                      //  Temporary
        const env = require('../../.data/environment.json');        //  Temporary

        const commandname = exports.help.name;
        const prefix = env.prefix;                                  //  Temporary

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
            __update_metadata() { this._metadata = this._subcommand.metadata }

            //  REFRESH: Repull Property Containers
            _refresh_subcommand() {
                this.__get_subcommand();
                this.__update_metadata();
            }


            //  PRIVATE UTILITY METHODS
            _isValidSubCommand() { return this._findSubcommand() ? true : false }
            _normalizeSubcommand() { if (this._name) { this._name = this._name.toLowerCase() } }
            _executeSubcommand() { return this._subcommand.execute(this._metadata) }
            _findSubcommand() {
                let subcommand = null
                this._subcommandlist.forEach((element) => {
                    if (element.metadata.name === this._name 
                        || element.metadata.alias.indexOf(this._name) >= 0) { 
                        subcommand = element
                    }
                })
                return subcommand
            }

            _checkClanStatus(value) { return accessmap.clanstatus[value] }
            _checkRoles(value) {
                for (let key in accessmap.roles[value]) { if (user.roles.hasOwnProperty(key)) return true }
                return false
            }
            _accessGranted() {
                let check = {
                    "clanstatus" : this._checkClanStatus,
                    "roles" : this._checkRoles
                }
                let lock = [];
                for (let key in this._metadata.access) { lock.push(check[key](this._metadata.access[key])) }
                return lock.every(e => e === true)
            }


            //  PUBLIC METHODS
            init() {
                this._normalizeSubcommand()
                if (this._isValidSubCommand()) { 

                    this._exists = true 
                    this._refresh_subcommand()

                } else this._exists = false 
                return this
            }
            async execute() {
                if (this._accessGranted()) {
                    args.shift();
                    if (this._name.toLowerCase() !== "help") invoker = this._metadata;
                    let nextsubcommand = await new Subcommand(this._metadata).init();
                    if (nextsubcommand.exists) return await nextsubcommand.execute()
                    else return this._executeSubcommand();
                } else return msg.embedWrapper(palette.red, `Sorry ${user.name}...\nYou don't have access to this command. ${emoji(`aauSatanialaugh`,bot)}`)
            }
        }

        class User {
            constructor(username) {
                this._requestname = username;
                this._exists = false;
            }


            get exists()        { return this._exists}
            get r_name()        { return this._requestname }
            //  PUBLIC OUTPUT: User Class Data
            get client()        { return this.$userclient }
            get discriminator() { return this._discriminator }
            get name()          { return this._name }
            get pfp()           { return this._userprofileurl }
            get nickname()      { return this._usernickname }
            get id()            { return this._userid }
            get roles()         { return this._roles }
            //  PUBLIC OUTPUT: Server Database Data
            get level()         { return this._userlevel }
            get artcoins()      { return this._userbalance }
            get clantag()       { return null }
            get nametag()       { return null }
            get isLeader()      { return this._leaderStatus }
            get isMember()      { return this._memberStatus }



            //  OBTAIN: Property Container Functions
            async _get_user() { this.$userclient = await this._findUser() }
            async _get_guildMemberData() { this.$guildmember = await message.guild.members.get(this._userid) }
            async _get_userData() { this.$userdata = await sql.get(`SELECT * FROM userdata WHERE userID = "${this._userid}"`) }
            async _get_inventory() { this.$userinventories = await sql.get(`SELECT * FROM userinventories WHERE userID = "${this._userid}"`) }
            async _get_userCheck() { this.$userstatus = await sql.get(`SELECT * FROM usercheck WHERE userID = "${this._userid}"`) }
            async _get_userRoles() { 
                let allroles = await this.$guildmember.roles.array();
                let roles = {}; 
                allroles.forEach(e => roles[e.id] = e.name); 
                this._roles = roles;
            }



            //  REFRESH: Repull Property Containers
            async _refresh_user() { 
                await this._get_user();
                this._discriminator = this.$userclient.user.discriminator; 
                this._name = this.$userclient.user.username;
                this._userprofileurl = this.$userclient.user.displayAvatarURL;
                this._usernickname = this.$userclient.nickname;
                this._userid = this.$userclient.id;
                
                await this._get_guildMemberData();
                await this._get_userRoles();
            }
            async _refresh_userData() {
                await this._get_userData();
                this._userlevel = this.$userdata.level; 
            }
            async _refresh_userInventory() {
                await this._get_inventory();
                this._userbalance = this.$userinventories.artcoins;
            }
            async _refresh_userStatus() {
                await this._get_userCheck();
                this._memberStatus = false;
                this._leaderStatus = false;
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
                if (await _botHasNicknamePerms()) {
                    await this.$guildmember.setNickname(new_nickname);
                    this._requestname = new_nickname;
                    await this._refresh_user();
                } else return msg.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`);
            }



            // PUBLIC METHODS
            async addClanTag() {}
            async removeClanTag() {}

            async init() {
                if (await this._isValidUser()) {

                    this._exists = true;
                    await this._refresh_user();
                    await this._refresh_userData();
                    await this._refresh_userInventory();
                    await this._refresh_userStatus();

                } else this._exists = false
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

        class Embed extends Discord.RichEmbed {
            constructor() { super() }

            //  Private Methods
            _clearData() { for (let key in this) { typeof this[key] !== "object" ? this[key] = undefined : this[key] = [] } }
            _formatString(input) { let s = input; return input = s.replace(/(^\s+)|(\s+$)/g,"").replace(/\n\s+/g,"\n") }
            _formatAllStrings() {
                for (let key1 in this) {
                    if (typeof this[key1] === "string") this[key1] = this._formatString(this[key1])
                    if (typeof this[key1] === "object") { for (let key2 in this[key1]) { if (typeof this[key1][key2] === "string") this[key1][key2] = this._formatString(this[key1][key2]) } }
                    if (key1 === "fields") { this[key1].forEach((e) => { for (let key in e) { if (typeof e[key] === "string") e[key] = this._formatString(e[key]) } }) }
                }
            }

            //  Public Methods
            send() { 
                this._formatAllStrings(); 
                message.channel.send(this); 
                this._clearData(); 
            }
            sendTo(channel) {
                this._formatAllStrings();
                /^\d+$/.test(channel) ?
                    bot.channels.find(x => x.id === channel).send(this) :
                    bot.channels.find(x => x.name === channel.toLowerCase()).send(this);
                this._clearData();
            }
            sendDM(target) {
                this._formatAllStrings(); 
                target.client.send(this);
                this._clearData();
            }   
            sendRaw(text) { 
                message.channel.send(this._formatString(text)); 
                this._clearData(); 
            }
            sendRawTo(channel, text) {
                /^\d+$/.test(channel) ?
                bot.channels.find(x => x.id === channel).send(this._formatString(text)) :
                bot.channels.find(x => x.name === channel.toLowerCase()).send(this._formatString(text));
                this._clearData();
            }
            sendRawDM(target, text) {
                target.client.send(this._formatString(text));
                this._clearData();
            }
            
            //  Legacy Support Method
            embedWrapper(color, text) { return this.setColor(color).setDescription(text).send(); }

            //  Utility Methods
            format_Comma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
            format_Code(message, style) { return `\`\`\`${style}\n${message}\`\`\`` }
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
                msg.embedWrapper(palette.green, `**You have been assigned a new role!**`)
                await addClanTag(target)
                return msg.embedWrapper(palette.green, `**You have been given a new clan tag!**`)
            }

            const addClanRole = async(target) => await target.addRole(metadata.id)

            const addClanTag = async(target) => {
                if (await hasNicknamePerms(bot.user.id)) {
                    let old_nickname = target.nickname
                    message.guild.members.get(target.id).setNickname(`『${metadata.tag}』${old_nickname}`)
                } else return msg.embedWrapper(palette.red, `Sorry, I dont have the required permsissions to change nicknames...`);
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
                    text: `\n`
                },
                "GREET_NEUTRAL" : {
                    color: palette.white, 
                    text: `Hey ${user.name}~ `
                },
                "GREET_APOLOGY" : {
                    color: palette.white, 
                    text: `Sorry ${user.name}... `
                },
                "SHORT_GUIDE" : {
                    color: palette.green,
                    text: `[Short Guide Here]`
                },
                "TRIAGE_HELP" : {
                    color: palette.green, 
                    text: `Here are a list of commands to get you started:
                        **Clan Creation**
                        \`${prefix}${commandname} create\`
                        **Clan Management**
                        \`${prefix}${commandname} manage, add, remove\``
                },
                "NOT_VALID_COMMAND" : {
                    color: palette.red, 
                    text: `I cannot find that sub-command... ${emoji(`aauWallSlam`,bot)}`
                },
                "TEST" : {
                    color: palette.golden, 
                    text: `Hello! ${emoji(`aauinlove`,bot)}`
                },
                "ERROR" : {
                    color: palette.red, 
                    text: `I have run into an error... ${emoji(`aauWallSlam`,bot)}`
                },
                "INVALID_TAG_LENGTH" : {
                    color: palette.red,
                    text: `The tag must be 10 characters or less... ${emoji(`aauWallSlam`,bot)}`
                },
                "INVALID_USER" : {
                    color: palette.red,
                    text: `I couldn't find that user... ${emoji(`aauWallSlam`,bot)}`
                }
            }
            const displist =[];
            loglist.forEach((code, i) => {
                displist[i] = logtable[code].text;
            });
            return msg.embedWrapper(logtable[loglist[loglist.length-1]].color, `${displist.join('')}`);
        }

        
        /***************************************************************************************************
         * UTILITY COMMANDS
         ***************************************************************************************************/
        let help = {
            metadata: {
                name: "help",
                alias: [],
                commandlist: [],
                info: "Command Information Here",
                access: {
                    clanstatus: "public",
                    roles: "public"
                }
            },
            execute: async(metadata) => {
                msg.embedWrapper(palette.green, `Detailed Guide for: ${invoker.name}`)
            }
        }

        /***************************************************************************************************
         * ♡♡♡ TESTING ♡♡♡
         ***************************************************************************************************/
        let test_userNicknameChange = {
            metadata: {
                name: "namechange",
                alias: ["nickname", "change"],
                commandlist: [help]
            },
            execute: async(metadata) => {

                if (args.length >= 2) { 
                    target = await new User(args[0]).init();
                    args.shift()
                } else return msg.embedWrapper(palette.golden, `Nickname Change: \`${prefix}${commandname} namechange <Target User> <New Name>\``);
                await target._setNickname(args.join(" "))

            }
        }

        let test_userFind = {
            metadata: {
                name: "userfind",
                alias: ["userdata", "userinfo", "user", "find"],
                commandlist: [help]
            },
            execute: async(metadata) => {

                if (args.length === 0) target = user;
                else if (args.length >= 1) target = await new User(args.join(" ")).init();
                else return msg.embedWrapper(palette.golden, `User Info Find: \`${prefix}${commandname} find <Blank or Target User>\``);

                if (target.exists) {

                    const formatblock = (string) => string.replace(/(^\s+)|(\s+$)/g,"").replace(/\n\s+/g,"\n")

                    let style = `HTTP`
                    return msg
                        .setAuthor(user.name, user.pfp)
                        .setColor(palette.darkmatte)
                        .addField(`Search Input:`,      msg.format_Code(target.r_name, style))
                        .addField(`User ID:`,           msg.format_Code(target.id, style))
                        .addField(`User Name:`,         msg.format_Code(`${target.name}#${target.discriminator}`, style))
                        .addField(`Nickname:`,          msg.format_Code(target.nickname, style))
                        .addField(`Profile Image URL:`, msg.format_Code(target.pfp, style))
                        .addField(`Clan Tag:`,          msg.format_Code(target.nametag, style))
                        .addField(`Level:`,             msg.format_Code(target.level, style))
                        .addField(`Balance:`,           msg.format_Code(`${msg.format_Comma(target.artcoins)} Artcoins`, style))
                        .addField(`Roles:`,             msg.format_Code(JSON.stringify(target.roles).replace(/{|"|}/g,'').replace(/,/g,'\n').replace(/:/g,' : '), style))
                        .send()
                } else return log(`GREET_APOLOGY LB INVALID_USER`) 

            }
        }

        let test_sendMessage = {
            metadata: {
                name: "message",
                alias: ["send", "msg"],
                commandlist: [help]
            },
            execute: async(metadata) => {

                if (args.length === 0) target = user;
                else if (args.length >= 1) target = await new User(args.join(" ")).init();

                if (target.exists) {
                    msg.setDescription(`Sending DM to: ${target.client}`)
                            .setColor(palette.green)
                            .send()

                    msg.setColor(`#0099ff`)
                            .setAuthor(`Message from: ${user.name}`, user.pfp)
                            .setDescription(`   Hey there~
                                                Thanks for being my labrat!
                                                Here's a .gif for you. ♡`)
                            .setImage(`https://i.kym-cdn.com/photos/images/newsfeed/000/751/316/ede.gif`)
                            .sendDM(target)
                }
                return
            }
        }

        let test_1 = {
            metadata: {
                name: "test1",
                alias: ["1", "11", "111"],
                commandlist: [help]
            },
            execute: async(metadata) => {
                let markdown = `HTTP\n`
                msg.embedWrapper(palette.green,  
                    `__**Clan Creation Form**__
                    ★ Please respond with the following format:
                    ★ *You may use* \`[shift] + [enter]\` *for a new line!*
                    \`\`\`${markdown}Name: <clan name here>\nTag: <clan tag here>\nMotto: <clan description/motto here>\`\`\`
                    **Example:**
                    \`\`\`${markdown}Name: Debauchery Tea Party\nTag: Tea Party\nMotto: We love tea~ ♡\`\`\``) 
                msg.embedWrapper(palette.golden, 
                    `★ \`CANCEL\`, \`EXIT\`, \`QUIT\` will terminate this session!
                    *${user.name}, I'll be waiting for your msg~* ${emoji(`aauinlove`,bot)}`)
                    .then(async prompt_message => {
                        collector.on(`collect`, async (userreply) => {
                            prompt_message.delete();
                            userreply.delete();
        
                            let user_input = userreply.content;
                            msg.embedWrapper(palette.green, 
                                `Thank you for your msg!
                                **User Input:** ${user_input}`);
                            
                        });
                    })
            }
        }

        let test_2 = {
            metadata: {
                name: "test2",
                alias: ["2"],
                commandlist: [help],
                access: {
                    clanstatus: "public",
                    roles: "nobody"
                }
            },
            execute: async(metadata) => {
                msg.embedWrapper(palette.green, "Executing Test 2!")
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
                name: "create",
                alias: ["creation", "make"],
                commandlist: [help]
            },
            execute: async(metadata) => {
                return msg.embedWrapper(palette.green, `Executing Clan Create.`)

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
                    
                    msg.embedWrapper(palette.green, `**Clan Created! (ID: ${await clan.id})**
                                                        **Clan Name:** ${await clan.name}
                                                        **Clan Tag:** ${await clan.tag}
                                                        **Color:** #${(await clan.color).toString(16)}
                                                        **Motto:** ${await clan.motto}
                                                        **Leader ID:** ${await clan.leader_id}`) 
            
                    await clan.addMember(await user.id)
                } return msg.embedWrapper(palette.golden, `Clan Creation: \`${prefix}${commandname} create <Clan Name> <Tag> <Color> <Motto>\``);
            }
            
        } 

        let clanManagement = {
            metadata: {
                name: "manage",
                alias: ["management", "settings"],
                commandlist: [help]
            },
            execute: async(metadata) => {
                return msg.embedWrapper(palette.green, `Executing Clan Management!`);  
            }
        }

        /***************************************************************************************************
         * EXECUTION:
         ***************************************************************************************************/
        const triage = async() => {
            let metadata = {
                name: "triage",
                alias: [],
                info: "Command Information Here",
                help: "How to use here!",
                commandlist: [
                    help,
                    clanManagement,
                    clanCreationInterface,
                    test_userNicknameChange,
                    test_userFind,
                    test_sendMessage,
                    test_1,
                    test_2
                ]
            }
            invoker = metadata;
            let subcommand = await new Subcommand(metadata).init();
            if (subcommand.exists) return await subcommand.execute()
            else return log(`TRIAGE_HELP`)
        }


        let user = await new User(authorname).init();
        let target = null;
        let msg = new Embed();
        let invoker = null; //Required for help command!
        const accessmap = {
            clanstatus : {
                public : true,
                member : user.isMember,
                leader : user.isLeader
            },
            roles : {
                public : { 
                    "459891664182312980" : "@everyone"
                },
                developer : { 
                    "502843277041729546" : "Development Team",
                    "591050122876551180" : "AAU Creative Lead"
                },
                admin : { 
                    "459936023498063902" : "Grand Master",
                    "465587578327007233" : "Creators Council"
                },
                nobody : {
                    "999999999999999999" : "Nonexistant Test Role"
                }
            }
        }
        return triage();
    }
}

module.exports.help = {
    start: clan_wrapper,
    name: "clan",
    aliases: ["guild", "yuuni", "yunyun", "yun"],
    description: `Clans`,
    usage: `${require(`../../.data/environment.json`).prefix}clan2`,
	group: "Admin",
	public: false,
	required_usermetadata: true,
	multi_user: false
}
