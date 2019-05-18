const Discord = require("discord.js");
const palette = require("../colorset.json");
const formatManager = require('../utils/formatManager');
const userFinding = require('../utils/userFinding');
const userRecently = new Set();

exports.run = async (bot, command, message, args) => {

const env = require(`../utils/environment.json`);
if(env.dev && !env.administrator_id.includes(message.author.id))return;

    /**
     *  Lifesaver promise. Used pretty often when calling sql API.
     *  @pause
     */
    function pause(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    /**
     *   Parsing emoji by its name.
     *   @emoji
     */
    function emoji(name) {
        return bot.emojis.find(e => e.name === name)
    }
  
    async function pay() {
      
        const format = new formatManager(message);
        const user = message.author;
        const sql = require('sqlite');
        sql.open('.data/database.sqlite');
      
         
        //  Logging result from current transaction
        const log = (code) => {
            const logtext = {
                "000": {color: palette.red, msg: `Can't proceed. Insufficient balance.`},
            }
            return format.embedWrapper(logtext[code].color, logtext[code].msg);
        }
        
        
        
        const run = async () => {
            const target_user = await userFinding.resolve(message, message.content.substring(command.length+2))

        }
        run();
    }
    return pay();
}
exports.help = {
  name: "pay2",
        aliases:[]
}