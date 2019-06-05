const env = require('../.data/environment.json');
const sql = require("sqlite");

module.exports = bot => {


    startup();
    roleChange();
    
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

}