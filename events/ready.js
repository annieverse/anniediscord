const clock = require("node-emoji-clock");
const momentTime = require("moment-timezone");
const formatManager = require('../utils/formatManager');
const palette = require('../colorset.json');
const env = require('../.data/environment.json');
const sql = require("sqlite");

module.exports = bot => {


    startup();

    //roleChange();

    
    /**
     * secret thingy, change color of role
     */
    function roleChange(){
        if(!env.dev)return;

        // Bot color #2fc9b6 ORIGINAL
        // Smol Bean #ff79ac ORIGNIAL
        // Tomato Fox #bfa8e0 ORIGNIAL
        /**
         * The Varible "x" is in terms of minutes
         * for example:
         * 1 = 1 minute
         * 2 = 2 minutes
         * 6 = 6 minutes
         * etc.
         */
        let x = 5;

        /**
         * The roleSelector is a list of every role you want to change.
         */
        let roleSelector=[
            'Creators Council',
            'Smol Bean',
            'Tomato Fox'
        ]

        /**
         * The setInterval controls how long it takes before the color changes.
         * The setTimeout makes sure new values are assigned each time.
         */
        setInterval(() => {
            setTimeout(() => {
                autoRoleColorChange(roleSelector);
            }, null);
        }, 60000*x);

        /**
         * Random color for each role selected right off the bat when bot starts - initializes the changing sequence
         */
        autoRoleColorChange(roleSelector);

        /**
         * Pass through a array of role names and they will automically be processed and change each one to a new color.
         * @function grabRole() 
         * @function randomColor()
         * @function main()
         * @function run()
         * @param {array} roleNameInput Array of string elements
         */
        function autoRoleColorChange(roleNameInput){

            /**
             * Pass through the role's name and it will return the role object
             * @param {string} role 
             * @returns {object} Role Object
             */
            async function grabRole(role){
                return bot.guilds.get(`459891664182312980`).roles.find(n => n.name === role);
            }

            /**
             * @returns {string} A(n) random color in hex format
             */
            async function randomColor(){
                // storing all letter and digit combinations 
                // for hex color code 
                var letters = "0123456789ABCDEF";

                // color code starts with # 
                var color = '#';

                // generating 6 times as color code consist 
                // of 6 letter or digits 
                for (var i = 0; i < 6; i++) {
                    color += letters[(Math.floor(Math.random() * 16))];
                }

                return color;
            }

            /**
             * runs the core processing of the whole function
             * @param {string} roleName Role name
             */
            async function main(roleName) {
                let color = await randomColor();
                let role = await grabRole(roleName);
                console.log(`The color for "${role.name}" has been changed to "${color}" from "${role.hexColor}"`);
                role.setColor(color);
            }

            /**
             * Initilizes the whole function to run, by separating the array of role names and calls the main() to process them.
             * @param {string} role Role name
             */
            function run(role) {
                for (let index = 0; index < role.length; index++) {
                    main(role[index]);
                }
            }

            // Call the run function and start the process
            run(roleNameInput);
        }
    }

    /**
     * 
     * Fired processes on startup.
     * @startup
     */
    function startup() {

        sql.open(`.data/database.sqlite`);
        sql.run(`UPDATE usercheck SET expcooldown = "False"`);

        if (env.dev) {
            console.log(`${bot.user.username}[dev-mode] is alive.`)
            bot.user.setStatus('dnd');
            bot.user.setActivity(`maintenance.`, {
                type: "LISTENING"
            });

        } else {
            console.log(`${bot.user.username} is up.`)
            bot.user.setStatus('online');
            bot.user.setActivity(null);
        }
    }

    /**
     * 
     * Update Time channels in server stats
     * 
     */

    function serverTime() {

        setInterval(() => {
            let channelESTTimeUpdate = bot.channels.get(`514668748612042763`);
            let channelMSTTimeUpdate = bot.channels.get(`514673767583318037`);
            let channelGMT08TimeUpdate = bot.channels.get(`514676732247408641`);
            var est = momentTime().tz("America/New_York");
            var mst = momentTime().tz("America/Boise");
            var gmt08 = momentTime().tz("Asia/Kuala_Lumpur");
            var esttime = clock.timeToEmoji(est) + " " + est.format("h:mm A");
            var msttime = clock.timeToEmoji(mst) + " " + mst.format("h:mm A");
            var gmt08time = clock.timeToEmoji(gmt08) + " " + gmt08.format("h:mm A");

            channelESTTimeUpdate.setName(`${esttime} EST`);
            channelMSTTimeUpdate.setName(`${msttime} MST`);
            channelGMT08TimeUpdate.setName(`${gmt08time} GMT+8`);

        }, 6 * 1000);
    }


    /**
     * 
     *      Event loot boxes.
     *      12/20/18
     */
    function eventLootBoxes() {
        let num = 6;
        let num2 = 8;
        const numfields = [
            '7',
            '6',
            '9',
            '11',
            '8',
            '9',
            '10',
        ];
        const num2fields = [
            '7',
            '6',
            '9',
            '11',
            '8',
            '9',
            '10',
        ];

        sql.open(".data/database.sqlite");
        const format = new formatManager();
        /** 
         * 
         *      Randomize the channels it sends to:
         *      @fields[0] : #trashcan
         *      @fields[1] : #general
         *      @fields[2] : #artistic-hall
         *      @fields[3] : #vidya-gaemz
         * 
         */
        const fields = [
            '459893209875611649',
            '459891664182312982',
            '520716400097099777',
            '459893209875611649',
            '500916948197179394',
            '459891664182312982',
        ];


        setInterval(() => {
            setTimeout(() => {
                let numfieldsArrIndex = Math.floor(Math.random() * (numfields.length - 1) + 1);
                num = numfields[numfieldsArrIndex];
                console.log(`NUM: ${num}`);
                let fieldsArrIndex = Math.floor(Math.random() * (fields.length - 1) + 1);
                let generalchat = bot.channels.get(fields[fieldsArrIndex]);
                generalchat.send(format.baseEmbedWrapper(palette.darkmatte, 'A Christmas Loot Box has appeared, react to the 🎁 to claim it!'))
                    .then(msg => {
                        msg.react('🎁')
                        console.log(`The loot box appears in ${msg.channel.name} !`)
                        let reactiondone = false;
                        const lootboxFilter = (reaction, user) => (reaction.emoji.name === '🎁') && (user.id != bot.user.id);
                        const lootbox = msg.createReactionCollector(lootboxFilter, {
                            max: 1,
                            time: 60000
                        });

                        let count = 1;
                        lootbox.on('collect', r => {
                            count--
                            if (count == 0) {
                                let user_id = r.users.last().id;
                                console.log(`user_id:
                            The box was claimed by ${user_id}.`);

                                sql.get(`SELECT * FROM usereventsdata WHERE userId ="${user_id}"`)
                                    .then(async currentdata => {
                                        sql.run(`UPDATE usereventsdata SET collectedboxes = ${currentdata.collectedboxes + 1} WHERE userId = ${user_id}`)
                                        sql.run(`UPDATE usereventsdata SET totalboxes = ${currentdata.totalboxes + 1} WHERE userId = ${user_id}`)
                                    })
                                sql.get(`SELECT * FROM messagelog`)
                                    .then(() => {
                                        sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`, [user_id, Date.now(), msg.channel.name])
                                    })

                                msg.edit(format.baseEmbedWrapper(palette.halloween, `Congratulation!! <@${user_id}>, you have received a christmas box!! :tada:!`))
                                    .then(msg.clearReactions())
                                    .then(reactiondone = true)
                                    .then(msg.delete(10000));

                                console.log(`REACT:
                            The box was claimed by ${r.users.last().username}.`);
                                timeout();
                            }
                        });


                        lootbox.on('end', () => {
                            if (!reactiondone) {
                                sql.get(`SELECT * FROM christmasevent_log`)
                                    .then(() => {
                                        sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`, [null, Date.now(), msg.channel.name])
                                    })
                                msg.edit(format.baseEmbedWrapper(palette.darkmatte,
                                        `Hmm, so quiet ..`))
                                    .then(msg.clearReactions())
                                    .then(msg.delete(5000));
                            } else {
                                reactiondone = false;
                            }
                        });

                        function timeout() {
                            setTimeout(() => {
                                count++;
                            }, 1000 * 3)
                        }
                    })
            }, 60000);
        }, (1000 * 60 * num)); //controls how long between each box spawn: 1000*60 = base minute the last number is how long: 15mins = 1000*60*14



        setInterval(() => {
            setTimeout(() => {
                let num2fieldsArrIndex = Math.floor(Math.random() * (num2fields.length - 1) + 1);
                num2 = num2fields[num2fieldsArrIndex];
                console.log(`NUM2: ${num2}`);
                let fieldsArrIndex = Math.floor(Math.random() * (fields.length - 1) + 1);
                let general2chat = bot.channels.get(fields[fieldsArrIndex]);
                general2chat.send(format.baseEmbedWrapper(palette.darkmatte, 'A Christmas Loot Box has appeared, react to the 🎁 to claim it!'))
                    .then(msg => {
                        msg.react('🎁')
                        console.log(`The loot box appears in ${msg.channel.name} !`)
                        let reactiondone = false;
                        const lootbox2Filter = (reaction, user) => (reaction.emoji.name === '🎁') && (user.id != bot.user.id);
                        const lootbox2 = msg.createReactionCollector(lootbox2Filter, {
                            max: 1,
                            time: 60000
                        });

                        let count = 1;
                        lootbox2.on('collect', r => {
                            count--
                            if (count == 0) {
                                let user_id = r.users.last().id;
                                console.log(`user_id:
                            The box was claimed by ${user_id}.`);

                                sql.get(`SELECT * FROM usereventsdata WHERE userId ="${user_id}"`)
                                    .then(async currentdata => {
                                        sql.run(`UPDATE usereventsdata SET collectedboxes = ${currentdata.collectedboxes + 1} WHERE userId = ${user_id}`)
                                        sql.run(`UPDATE usereventsdata SET totalboxes = ${currentdata.totalboxes + 1} WHERE userId = ${user_id}`)
                                    })
                                sql.get(`SELECT * FROM messagelog`)
                                    .then(() => {
                                        sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`, [user_id, Date.now(), msg.channel.name])
                                    })

                                msg.edit(format.baseEmbedWrapper(palette.halloween, `Congratulation!! <@${user_id}>, you have received a christmas box!! :tada:!`))
                                    .then(msg.clearReactions())
                                    .then(reactiondone = true)
                                    .then(msg.delete(5000));

                                console.log(`REACT:
                            The box was claimed by ${r.users.last().username}.`);
                                timeout();
                            }
                        });


                        lootbox2.on('end', () => {
                            if (!reactiondone) {
                                sql.get(`SELECT * FROM christmasevent_log`)
                                    .then(() => {
                                        sql.run(`INSERT INTO christmasevent_log (userId, timestamp, box_location) VALUES (?, ?, ?)`, [null, Date.now(), msg.channel.name])
                                    })
                                msg.edit(format.baseEmbedWrapper(palette.darkmatte,
                                        `Hmm, so quiet ..`))
                                    .then(msg.clearReactions())
                                    .then(msg.delete(5000));
                            } else {
                                reactiondone = false;
                            }
                        });

                        function timeout() {
                            setTimeout(() => {
                                count++;
                            }, 1000 * 3)
                        }
                    })
            }, 60000);
        }, (1000 * 60 * num2)); //controls how long between each box spawn: 1000*60 = base minute the last number is how long: 15mins = 1000*60*14
    }
}