//const palette = require('../colorset.json');
//const formatManager = require('../utils/formatManager');
//const clock = require("node-emoji-clock");
//const moment = require("moment-timezone");
const env = require('../.data/environment.json');
const prefix = env.prefix;


module.exports.run = async (_bot, _command, message, args) => {

/*
if(env.dev && !env.administrator_id.includes(message.author.id))return;

const format = new formatManager(message);
return ["bot", "bot-games", "cmds"].includes(message.channel.name) ? initTime()
: format.embedWrapper(palette.darkmatte, `Please use the command in ${message.guild.channels.get('485922866689474571').toString()}.`)


async function initTime() {
    message.delete(5000);


            var cet = moment().tz("Europe/Copenhagen");
            var est = moment().tz("America/New_York");
            var pst = moment().tz("America/Los_Angeles");
            var mst = moment().tz("America/Boise");
            var cst = moment().tz("America/Monterrey");
            var hst = moment().tz("America/Adak");
            var msk = moment().tz("Europe/Simferopol");
            var gmt = moment().tz("Atlantic/Reykjavik");
            var gmt07 = moment().tz("Asia/Barnaul");
            var gmt08 = moment().tz("Asia/Kuala_Lumpur");


      if ( args.length === 0){
          message.channel.send("All avaiable individual Timezones are cet, est, pst, mst, cst, hst, msk, gmt, gmt07 (gmt+07), and gmt08 (gmt+08) \n"+
                               "Just type >time <timezone>\n"+
                               "or you can type >all to see all the availble Timezones.");
      }else if (args[0].toUpperCase() === "ALL"){
            var times = 
                clock.timeToEmoji(cet) + "\`" + cet.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(est) + "\`" + est.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(pst) + "\`" + pst.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(mst) + "\`" + mst.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(cst) + "\`" + cst.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(hst) + "\`" + hst.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(msk) + "\`" + msk.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(gmt) + "\`" + gmt.format("h:mm A z") + "\`\n" +
                clock.timeToEmoji(gmt07) + "\`" + gmt07.format("hh:mm A") + " GMT+07\`\n" +
                clock.timeToEmoji(gmt08) + "\`" + gmt08.format("hh:mm A") + " GMT+08\`";

            message.channel.send(times);
      }else if (args[0].toUpperCase() === "EST"|| args[0].toUpperCase() === "KITO"|| args[0].toUpperCase() === "PAN"){

            var time = clock.timeToEmoji(est) + " \`" + est.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "PST"){

            var time = clock.timeToEmoji(pst) + " \`" + pst.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "MST"){

            var time = clock.timeToEmoji(mst) + " \`" + mst.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "CST"){

            var time = clock.timeToEmoji(cst) + " \`" + cst.format("hh:mm A z") + "\`";
            message.channel.send(time);

      }else if (args[0].toUpperCase() === "CET"){

            var time = clock.timeToEmoji(cet) + " \`" + cet.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "HST"){

            var time = clock.timeToEmoji(hst) + " \`" + hst.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "MSK"){

            var time = clock.timeToEmoji(msk) + " \`" + msk.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "GMT"){

            var time = clock.timeToEmoji(gmt) + " \`" + gmt.format("hh:mm A z") + "\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "GMT07"|| args[0].toUpperCase() === "NAPH"|| args[0].toUpperCase() === "NAPHY"){

            var time = clock.timeToEmoji(gmt07) + " \`" + gmt07.format("hh:mm A z") + " {GMT+07}\`";
            message.channel.send(time);

      } else if (args[0].toUpperCase() === "GMT08"){

            var time = clock.timeToEmoji(gmt08) + " \`" + gmt08.format("hh:mm A z") + " {GMT+08}\`";
            message.channel.send(time);

      }else {
            return "I only respond to \`time\` for now.";
      }

    }
  
}//end of the module

*/
}
module.exports.help = {
      name:"time",
      aliases: [],
      description: `Get the time for various spots around the world`,
      usage: `${prefix}time`,
      group: "Fun",
      public: true,
}