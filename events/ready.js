const env = require('../.data/environment.json');
const sql = require("sqlite");

module.exports = bot => {

    startup();
    databasePreparation();
    if(!env.dev) roleChange();


    /**
     * secret thingy, change color of role
     */
    function roleChange(){
        //if(!env.dev)return;

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
        let x = 15;

        /**
         * The roleSelector is a list of every role you want to change.
         */
        let roleSelector=[
            'Ruling Star'
        ]
        /**
         * The colorArray is a list of every color you want to change.
         */
        let colorArray=[
            'FF9AA2',
            'FFB7B2',
            'FFDAC1',
            'E2F0CB',
            'b5EAD7',
            'C7CEEA',
            'F8B195',
            'F67280',
            '79fa72',
            'd3fa7f',
            'ca8ae4',
            'fff177'
        ]

        /**
         * Count is used to run through the colorArray in order.
         */
        let count = 0;

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
             * @returns {string} A(n) color in hex format from the colorArray
             */
            async function setColor(){
                

                // color code starts with # 
                var color = '#';

                //assigns the color using the colorArray values
                color += colorArray[count];
                
                // Increase the count by one
                count++;
                if (count === colorArray.length) count = 0;
                return color;
            }

            /**
             * runs the core processing of the whole function
             * @param {string} roleName Role name
             */
            async function main(roleName) {

                // For random color
                //let color = await randomColor();
                // Use colorArray
                let color = await setColor();
                
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


    function autoStatus(){
        let x = 1; // number of minutes
        setInterval(data,60000*x);
        sql.open(`.data/database.sqlite`);
        
        function data(){
            sql.get(`SELECT * FROM eventData ORDER BY start_time`).then(data=>{
                if (!data) {
                    if (env.dev) {
                        return bot.user.setActivity(`maintenance.`, {
                            type: "LISTENING"
                        });

                    } else {
                        return bot.user.setActivity(null);
                    }
                }
                let event = data.event
                let time = data.start_time
                let status = data.status
                let currentTime = (new Date());
                let bufferTime = {
                    before: time - 1.8e+7,
                    after: time + 1.8e+7,
                    start: time
                }
                let eventDateObject = new Date(time);
                // watching = type 3
                // playing = type 0


                //sql.run(`DELETE FROM eventData WHERE event = '${event}'`);
                if (status === 'ended') {
                    sql.run(`DELETE FROM eventData WHERE status = 'ended' AND event = '${event}' AND start_time = ${time}`).then(() => {
                        return console.log(`Event: ${event} with start time of: ${time} has been deleted from the database.`)
                    })
                }
                
                if (bufferTime.after > currentTime.getTime()) {
                    if (env.dev) {
                        bot.user.setStatus('dnd');
                        bot.user.setActivity(`maintenance.`, {
                            type: "LISTENING"
                        });

                    } else {
                        bot.user.setStatus('online');
                        bot.user.setActivity(null);
                    }
                    sql.run(`UPDATE eventData SET status = 'ended' WHERE event = '${event}' and start_time = ${time}`).then(() => {
                        sql.run(`DELETE FROM eventData WHERE status = 'ended' AND event = '${event}' AND start_time = ${time}`).then(() => {
                            console.log(`Event: ${event} with start time of: ${time} has been deleted from the database.`)
                        })
                    })
                    return console.log(`[STATUS CHANGE] ${bot.user.username} is now set to null`)
                } else if (bot.user.presence.game.name === `[EVENT] ${event}` && bot.user.presence.game.type === 0) return;

                // Find the distance between now and the count down date
                var distance = bufferTime.start-currentTime.getTime()
                // Time calculations for days, hours, minutes and seconds
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                
                if (bufferTime.before < currentTime.getTime() && bufferTime.start > currentTime.getTime() ){
                    
                    let countDown = `${hours}h ${minutes}m`
                    bot.user.setActivity(`[EVENT] ${event} in ${countDown}`, {
                        type: "WATCHING"
                    });
                    return console.log(`[STATUS CHANGE] ${bot.user.username} is now WATCHING ${event}`)
                } else if (bufferTime.start < currentTime.getTime() && bufferTime.after > currentTime.getTime()) {
                    bot.user.setActivity(`[EVENT] ${event}`, {
                        type: "PLAYING"
                    });
                    return console.log(`[STATUS CHANGE] ${bot.user.username} is now PLAYING ${event}`)
                }     
            })
        }
    }


    /**
     *  
     * Database table check
     * @databasePreparation
     */
    function databasePreparation() {

        sql.open(`.data/database.sqlite`);

        //  Register iteminventory if not exist.
        sql.run(`
            CREATE TABLE IF NOT EXISTS item_inventory (
                itemid INTEGER NOT NULL DEFAULT 0,
                userid TEXT NOT NULL DEFAULT 0,
                quantity INTEGER NOT NULL DEFAULT 0
            )
        `)
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
            console.clear()
            console.log(`Codename: ${bot.user.username}`)
            console.timeEnd(`Initialized In`)
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

}