const Discord = require("discord.js");
const palette = require(`../colorset.json`);
const formatManager = require(`../utils/formatManager`);
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports.run = async (bot, command, message, args, utils) => {

    const env = require(`../.data/environment.json`);
    if (env.dev && !env.administrator_id.includes(message.author.id)) return;

    function fileAliasesCheck(file) {
        const src = require(`./${file}`)
        return src.help.name;
    };


    const format = new formatManager(message);


    //  Pre-defined messages.
    function log(props = {}) {
        const logtext = {
            "WRONG_CHANNEL": {
                msg: `You can create your clan in bot channels.`,
                color: palette.red
            },

            "SUCCESSFUL": {
                msg: `${emoji(`AnnieWot`)} | *Filler message*: Thank you for creating a clan`,
                color: palette.lightgreen
            },

            "LVL_TOO_LOW": {
                msg: `I am sorry but you are not a high enough level yet.`,
                color: palette.darkmatte,
            },

            "ALREADY_INCLAN": {
                msg: `I am sorry but you are already in a clan.`,
                color: palette.darkmatte,
            },

            "INSUFFICIENT_BALANCE": {
                msg: `I am sorry but you Dont have enough AC to create a clan.`,
                color: palette.darkmatte 
            },

            "MAX_CHARS": {
                msg: `I am sorry but that entry exceeds the character limit.`,
                color: palette.red
            }
        }

        let res = logtext[props.code];
        return format.embedWrapper(res.color, res.msg);
    }

    
    /**
     * Notes for along the adventure.
     * [1] Fix Message wording in Run()
     * [2] Fix Message wording in userlevelcheck() in filtering_data()
     * [3] In general all Filler messages*
     */


    /**
     * Global varibles:
     * @raw_object a raw container object
     * @colorCustom A boolean to allow custom color.
     * @maxMembers the max number of members allowed in a clan.
     * */
    let raw_object;
    let colorCustom = false;
    let maxMembers;

    /**
     * Returns a(n) emoji from the server based on name.
     *  @emoji a unicode emoji
     * */
    function emoji(name) {
        return bot.emojis.find(e => e.name === name)
    }

    /**
     * Requesting user data from sql API.
     * @get_userobject container object
     * */
    async function get_userobject() {
        let user = message.author;
        return sql.get(`SELECT * FROM userdata WHERE userId = "${user.id}"`)
            .then(async res => raw_object = res)
    }

    /**
     * Parse raw_object (also referenced as container)
     * @filtering_data
     * */
    async function filtering_data(container){

        /**
         * Local varibles that are used in this function
         * @userlevel the user's level from the container.
         * @userAC the user's AC from the container.
         */
        let userlevel = container.level;
        let userAC = container.artcoins;

        /**
         * Checks to see if the user is in a clan already or not.
         * @userclancheck
         * @returns Boolean true/false
         */
        async function userclancheck() {
            let clanstatus = container.clan;
            if(clanstatus == 0){
                return true;
            }else{
                return false;
            }
        }

        /**
         * Checks to see what the user can initially have when starting.
         * @userlevelcheck
         * @returns colorCustom, maxMembers
         */
        async function userlevelcheck(){
            
            // Check to make sure user is at least level 40
            if (userlevel < 40)return log({code: `LVL_TOO_LOW`});

            // Sets the max members allowed in clan
            maxMembers = 5;
            if (userlevel > 50) maxMembers = 7;
            if (userlevel > 60) maxMembers = 10;
            if (userlevel > 85) maxMembers = 15;

            // Check to see if the user can do a color customization right away
            if (userlevel > 45) colorCustom = true;

            return {colorCustom, maxMembers};
        }

        /**
         * Checks to see if the user has enough money to make a clan.
         * @useraccheck
         * @returns Boolean true/false
         */
        async function useraccheck(){
            if(userAC<45000){ //45000 is the cost to create a clan
                return false;
            }else{
                return true;
            }
        }

        // Test to see if the user is in a clan and if they are then exit the code
        if (userclancheck() === true)return log({code: `ALREADY_INCLAN`});

        // Test to see if the user level to gather data
        userlevelcheck();

        // Test to see if the user has enough in their balance to create a clan
        if (useraccheck() === false)return log({code: `INSUFFICIENT_BALANCE`});
        
    }


    async function create_clan(){

        /**
         * Local varibles that are used in this function
         * @clanname the user's level from the container.
         * @clantag a short string used to identify a clan.
         * @clanmotto a short description of clan.
         * @color custom color
         */
        let clanname;
        let clantag;
        let clanmotto;
        let color;

        /**
         * add a role to the user with the clan name as the role name
         * @addrole 
         */
        async function addrole() {
            let user = message.author;
            let clanrole = await message.guild.createRole({
                name: clanname,
                color: color,
                permissions: []
            })
            user.addrole(clanrole);
        }

        /**
         * If custom color is unlocked then the custom color will be used.
         * @param color hex-color needed
         */
        async function chooseColor(color){
            if(colorCustom){
                color = color;
            }else{
                color = `#000000`;
            }
        }

        /**
         * Character limit check
         * @param stringlength the input string
         * @param maxlength max length allowed
         */
        function charcheck(stringlength,maxlength){
            if(stringlength.length>maxlength){
                return true;
            }else{
                return false;
            }
        }

        /**
         * Update This
         * Character limit check
         * @param stringlength the input string
         * @param maxlength max length allowed
         */
        async function colorformat(input) {
            if (input.startWith('#')) {
                let x = input.slice(0);
                if (x.length > 6) {
                    return x.slice(6);
                }else{
                    return x
                }
            } else if (input.length>6){
                return input.slice(6);
            }else{
                return input
            }
        }

        message.channel.send(`Okay so to set up your clan I need a few pieces of info from you.`) // Tell the user that we need more info
        message.channel.send(`To start, Please give a name for your clan.\n**Less than 24 characters**`)

        
        const collectorForClanName = new Discord.MessageCollector(message.channel,m => m.author.id === raw_object.userId, {time: 30000});
        const collectorForClanTag = new Discord.MessageCollector(message.channel, m => m.author.id === raw_object.userId, { time: 30000 });
        const collectorForClanMotto = new Discord.MessageCollector(message.channel, m => m.author.id === raw_object.userId, { time: 30000 });
        const collectorForClanColor = new Discord.MessageCollector(message.channel, m => m.author.id === raw_object.userId, { time: 30000 });

        collectorForClanName.on(`collect`, async (msg) => {
            console.log(charcheck(msg.content, 24));

            //  Returns if characters are exceeding the limit.
            if(charcheck(msg.content, 24))return log({code: `MAX_CHARS`});

            
            const conditions = async () => {
                
                clanname = msg.content;
                
                


                message.channel.send(`Next I will need a clan tag you wish to use.\n if you type "n/a" the default tag will be the first **5** characters of your clan name.\n**5 character limit**`)
                collectorForClanTag.on(`collect`, async (msg) => {
                    if (msg.content.toLowerCase() === "n/a") {
                        clantag = msg.content;
                        message.channel.send(`Next I will need a clan motto you wish to use.\n if you type "n/a" the default motto will be "One Awsome clan".\n**165 character limit**`)
                        collectorForClanMotto.on(`collect`, async (msg) => {
                            if (msg.content.toLowerCase() === "n/a") {
                                clanmotto = "One Awsome clan";
                            } else if (charcheck(msg.content, 165) === true) {
                                return message.channel.send(`"*Filler message*: I am sorry but that entry exceeds the character limit."`)
                            } else if (charcheck(msg.content, 165) === false) {
                                clanmotto = msg.content;
                                if(colorCustom){
                                    message.channel.send(`Since you meet the level required for a custom color would you like to choose a custom color.\nPlease type n/a for default color or type the digits you would like for your color.\n**Must be a hex color 000000**`);
                                    collectorForClanColor.on(`collect`, async (msg) => {
                                        if(msg.content.toLowerCase() === "n/a"){
                                            color="#000000"
                                            message.channel.send(`Please react with checkmark to confirm or a :X: to cancel\n By hitting **Confirm** it will take 45000 AC from your balance.`)
                                                .then((msg) => {
                                                    msg.react('✅').then(msg.react(`❌`)).then(() => {

                                                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === ['❌', `✅`]) && (user.id === message.author.id);
                                                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                                                        forwards.on('collect', async (r) => {
                                                            msg.clearReactions();
                                                            msg.channel.send(`Thank you for creating a clan you can now add members.`)
                                                            //
                                                            // SQL Statements
                                                            //
                                                            sql.run(``)
                                                        });
                                                    });
                                                });
                                        }else{
                                            color= await colorformat(msg.content);   
                                            message.channel.send(`Please react with checkmark to confirm or a :X: to cancel\n By hitting **Confirm** it will take 45000 AC from your balance.`)
                                                .then((msg) => {
                                                    msg.react('✅').then(msg.react(`❌`)).then(() => {

                                                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === ['❌', `✅`]) && (user.id === message.author.id);
                                                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                                                        forwards.on('collect', async (r) => {
                                                            msg.clearReactions();
                                                            msg.channel.send(`Thank you for creating a clan you can now add members.`)
                                                            //
                                                            // SQL Statements
                                                            //
                                                            sql.run(``)
                                                        });
                                                    });
                                                });
                                        }
                                    }); // end of collectorForClanColor
                                }else{
                                    message.channel.send(`Please react with checkmark to confirm or a :X: to cancel\n By hitting **Confirm** it will take 45000 AC from your balance.`)
                                        .then((msg) => {
                                            msg.react('✅').then(msg.react(`❌`)).then(() => {

                                                const forwardsFilter = (reaction, user) => (reaction.emoji.name === ['❌', `✅`]) && (user.id === message.author.id);
                                                const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                                                forwards.on('collect', async (r) => {
                                                    msg.clearReactions();
                                                    msg.channel.send(`Thank you for creating a clan you can now add members.`)
                                                    //
                                                    // SQL Statements
                                                    //
                                                    sql.run(``)
                                                });
                                            });
                                        });
                                }
                                
                                };
                        }); // end of collectorForClanMotto
                    } else if (charcheck(msg.content, 5) === true) {
                        return message.channel.send(`"*Filler message*: I am sorry but that entry exceeds the character limit."`)
                    } else if (charcheck(msg.content, 5) === false) {
                        clantag = msg.content;
                        message.channel.send(`Next I will need a clan motto you wish to use.\n if you type "n/a" the default motto will be "One Awsome clan".\n**165 character limit**`)
                        collectorForClanMotto.on(`collect`, async (msg) => {
                            if (msg.content.toLowerCase() === "n/a") {
                                clanmotto = "One Awsome clan";
                            } else if (charcheck(msg.content, 165) === true) {
                                return message.channel.send(`"*Filler message*: I am sorry but that entry exceeds the character limit."`)
                            } else if (charcheck(msg.content, 165) === false) {
                                clanmotto = msg.content;
                                if (colorCustom) {
                                    message.channel.send(`Since you meet the level required for a custom color would you like to choose a custom color.\nPlease type n/a for default color or type the digits you would like for your color.\n**Must be a hex color 000000**`);
                                    collectorForClanColor.on(`collect`, async (msg) => {
                                        if (msg.content.toLowerCase() === "n/a") {
                                            color = "#000000"
                                            message.channel.send(`Please react with checkmark to confirm or a :X: to cancel\n By hitting **Confirm** it will take 45000 AC from your balance.`)
                                                .then((msg) => {
                                                    msg.react('✅').then(msg.react(`❌`)).then(() => {

                                                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === ['❌', `✅`]) && (user.id === message.author.id);
                                                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                                                        forwards.on('collect', async (r) => {
                                                            msg.clearReactions();
                                                            msg.channel.send(`Thank you for creating a clan you can now add members.`)
                                                            //
                                                            // SQL Statements
                                                            //
                                                            sql.run(``)
                                                        });
                                                    });
                                                });
                                        } else {
                                            color = await colorformat(msg.content);
                                            message.channel.send(`Please react with checkmark to confirm or a :X: to cancel\n By hitting **Confirm** it will take 45000 AC from your balance.`)
                                                .then((msg) => {
                                                    msg.react('✅').then(msg.react(`❌`)).then(() => {

                                                        const forwardsFilter = (reaction, user) => (reaction.emoji.name === ['❌', `✅`]) && (user.id === message.author.id);
                                                        const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                                                        forwards.on('collect', async (r) => {
                                                            msg.clearReactions();
                                                            msg.channel.send(`Thank you for creating a clan you can now add members.`)
                                                            //
                                                            // SQL Statements
                                                            //
                                                            sql.run(``)
                                                        });
                                                    });
                                                });
                                        }
                                    }); // end of collectorForClanColor
                                } else {
                                    message.channel.send(`Please react with checkmark to confirm or a :X: to cancel\n By hitting **Confirm** it will take 45000 AC from your balance.`)
                                        .then((msg) => {
                                            msg.react('✅').then(msg.react(`❌`)).then(() => {

                                                const forwardsFilter = (reaction, user) => (reaction.emoji.name === ['❌', `✅`]) && (user.id === message.author.id);
                                                const forwards = msg.createReactionCollector(forwardsFilter, { time: 30000 });

                                                forwards.on('collect', async (r) => {
                                                    msg.clearReactions();
                                                    msg.channel.send(`Thank you for creating a clan you can now add members.`)
                                                    //
                                                    // SQL Statements
                                                    //
                                                    sql.run(``)
                                                });
                                            });
                                        });
                                };

                            };
                        }); // end of collectorForClanMotto
                    };
                }); // end of collectorForClanTag
            };
        }); // end of collectorForClanName    
 
    } // end of create_clan


    //  Core process
    async function main() {

        //  Parsing required data
        const registering_data = async() => {

            //  Request userdata
            await get_userobject();
            await utils.pause(200);
            
            //  
            await filtering_data(raw_object);

            //  Proceed to clan creation
            await create_clan();
            
        }


        //  Outputing result
        return message.channel.send(`\`fetching ${message.author.username} clan-data ..\``)
            .then(async load => {
                
                await registering_data();
                log({code: `SUCCESSFUL`});
                load.delete();
            })   
    }


    //  Initializer.
    async function run(){

        // fix line below before release!!! @naph
        if (![`sandbox`].includes(message.channel.name))return log({code: `WRONG_CHANNEL`});

        main();

    }

    run();

}//end of module.exports.run

module.exports.help = {
    name: "beta-createclan",
    aliases: []
}
