const Discord = require("discord.js");
const clock = require("node-emoji-clock");
const momentTime = require("moment-timezone");
const sql = require("sqlite");
sql.open(".data/database.sqlite");

module.exports = bot => {

  let activityArr = [

    "you. The talented artist. <3",
    "Need something? ping all the available admin/staff.",
    "Naphz so sleepy",
    "Frying Pan's homework",
    "Hey it's me, Annie!",
    "Your Highness, PokiPanda.",
    "Skeletal Kito",
    "I'm alive!",
    "Shoooo",
    "Poof Poof Panda!",
    "Floofy Foxie!",

    ];
  
        console.log(`${bot.user.username} is up.`)

        bot.user.setStatus('online');
        sql.get(`SELECT * FROM usercheck`).then(async usercheckrow => {
        sql.run(`UPDATE usercheck SET expcooldown = "False"`);
    })

        setInterval(() => {
            let activityArrIndex = Math.floor(Math.random() * (activityArr.length - 1) + 1);
            bot.user.setActivity(activityArr[activityArrIndex],{type:"WATCHING"})
        }, 300000 );
  
        //
        //Update Time channels in server stats
        //
        // "I've tweaked the interface for server time. -naphnaphz / 12.01.18"
        let channelESTTimeUpdate = bot.channels.get(`514668748612042763`);
        let channelMSTTimeUpdate = bot.channels.get(`514673767583318037`);
        let channelGMT08TimeUpdate = bot.channels.get(`514676732247408641`);

        setInterval(() => {
            var est = momentTime().tz("America/New_York");
            var mst = momentTime().tz("America/Boise");
            var gmt08 = momentTime().tz("Asia/Kuala_Lumpur");
            var esttime = clock.timeToEmoji(est) + " " + est.format("h:mm A");
            var msttime = clock.timeToEmoji(mst) + " " + mst.format("h:mm A");
            var gmt08time = clock.timeToEmoji(gmt08) + " " + gmt08.format("h:mm A");

            channelESTTimeUpdate.setName(`${esttime} EST`);
            channelMSTTimeUpdate.setName(`${msttime} MST`);
            channelGMT08TimeUpdate.setName(`${gmt08time} GMT+8`);
          
        }, 6*1000);


}
