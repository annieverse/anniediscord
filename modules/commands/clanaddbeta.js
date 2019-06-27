const Discord = require("discord.js");
const formatManager = require(`../../utils/formatManager`);
const sql = require("sqlite");
sql.open(".data/database.sqlite");

class clanaddbeta {
    constructor(Stacks) {
        this.author = Stacks.meta.author;
        this.data = Stacks.meta.data;
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.stacks = Stacks;
    }

    async execute() {
        // Add these three lines so u dont have to go through and put this./this.stacks infront of everything
        // might have to go through if another varible is called
        let message = this.message;
        let bot = this.stacks.bot;
        let palette = this.stacks.palette;
        


        const format = new formatManager(message);


        //  Pre-defined messages.
        function log(props = {}) {
            const logtext = {
                "WRONG_CHANNEL": {
                    msg: `You can create your clan in bot channels.`,
                    color: palette.red
                },

                "SUCCESSFUL": {
                    msg: `${utils.emoji(`AnnieWot`, bot)} | *Filler message*: Thank you for creating a clan`,
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
        async function filtering_data(container) {

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
                if (clanstatus == 0) {
                    return true;
                } else {
                    return false;
                }
            }

            /**
             * Checks to see what the user can initially have when starting.
             * @userlevelcheck
             * @returns colorCustom, maxMembers
             */
            async function userlevelcheck() {

                // Check to make sure user is at least level 40
                if (userlevel < 40) return log({ code: `LVL_TOO_LOW` });

                // Sets the max members allowed in clan
                maxMembers = 5;
                if (userlevel > 50) maxMembers = 7;
                if (userlevel > 60) maxMembers = 10;
                if (userlevel > 85) maxMembers = 15;

                // Check to see if the user can do a color customization right away
                if (userlevel > 45) colorCustom = true;

                return { colorCustom, maxMembers };
            }

            /**
             * Checks to see if the user has enough money to make a clan.
             * @useraccheck
             * @returns Boolean true/false
             */
            async function useraccheck() {
                if (userAC < 45000) { //45000 is the cost to create a clan
                    return false;
                } else {
                    return true;
                }
            }

            // Test to see if the user is in a clan and if they are then exit the code
            if (userclancheck() === true) return log({ code: `ALREADY_INCLAN` });

            // Test to see if the user level to gather data
            userlevelcheck();

            // Test to see if the user has enough in their balance to create a clan
            if (useraccheck() === false) return log({ code: `INSUFFICIENT_BALANCE` });

        }


        async function create_clan() {




            /**
             * Character limit check
             * @param stringlength the input string
             * @param maxlength max length allowed
             */
            function charcheck(stringlength, maxlength) {
                if (stringlength.length > maxlength) {
                    return true;
                } else {
                    return false;
                }
            }


            message.channel.send(`Okay so to set up your clan I need a few pieces of info from you.`) // Tell the user that we need more info
            message.channel.send(`To start, Please give a name for your clan.\n**Less than 24 characters**`)


            const collectorForClanName = new Discord.MessageCollector(message.channel, m => m.author.id === raw_object.userId, { time: 30000 });

            collectorForClanName.on(`collect`, async (msg) => {
                console.log(charcheck(msg.content, 24));

                //  Returns if characters are exceeding the limit.
                if (charcheck(msg.content, 24)) return log({ code: `MAX_CHARS` });


            }); // end of collectorForClanName    

        } // end of create_clan


        //  Core process
        async function main() {

            //  Parsing required data
            const registering_data = async () => {

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
                    log({ code: `SUCCESSFUL` });
                    load.delete();
                })
        }


        //  Initializer.
        async function run() {

            // fix line below before release!!! @naph
            if (![`sandbox`].includes(message.channel.name)) return log({ code: `WRONG_CHANNEL` });

            main();

        }

        run();

    }
}

module.exports.help = {
    start: clanaddbeta,
    name: "clanaddbeta",
    aliases: [],
    description: `create a clan`,
    usage: `${require(`../../.data/environment.json`).prefix}beta-createclan`,
    group: "General",
    public: false,
    require_usermetadata: true,
    multi_user: true
}
