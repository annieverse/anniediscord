const Discord = require("discord.js");
const moment = require(`moment`);
const formatManager = require('../../utils/formatManager');


const sql = require('sqlite');
sql.open('.data/database.sqlite');

module.exports.run = async (...ArrayStacks) => {
    
    const format = new formatManager(message);

    /**
     *  Auto-strike penalty such as mute, kick or ban are disabled
     *  while doing local development to avoid unexpected behaviour.
     * 
     *  1-2 points => temporary mute
     *  3 points => kick
     *  4+ points lead to permanent ban.
     * 
     *  For whoever see this message and want to change the penalties,
     *  please refer to line 145.
     *  @strikecollection
     */


    //  Centralized Object
    let metadata = {
        admin: {
            id: message.author.id,
            name: message.author.username,
            tag: message.author.tag
        },
        records_size: 0,
        current_date: 0,
    }


    //  Pre-defined messages.
    const log = (props = {}, ...opt) => {

        //  Messages collection.
        const logtext = {
            "UNAUTHORIZED": {
                color: palette.crimson,
                msg: `You aren't authorized to use the feature.`
            },

            "MUTED": {
                color: palette.lightgreen,
                msg: `Poor **${opt[0]}** got their first few strikes. I'll mute them for now.`
            },

            "KICKED": {
                color: palette.lightgreen,
                msg: `So far 3 strikes have been landed. Baibai **${opt[0]}**!`
            },

            "BANNED": {
                color: palette.lightgreen,
                msg: `Geez.. **${opt[0]}** strikes already. I've banned **${opt[1]}** out of our place.`
            },

            "INSIGHTS": {
                color: palette.crimson,
                msg: `Hey **${opt[0]}**, here's the strike data for **${opt[1]}**\n\n${opt[2]}\n\nType \`+ <reason>\` to add new strike.`
            },

            "NEW_ENTRY_SUCCESSFUL":{
                color: palette.darkmatte,
                msg: `Thankyou **${opt[0]}**! your report has been registered.`
            },

            "TOO_SHORT": {
                color: palette.darkmatte,
                msg: `The description is too short!`
            },

            "INVALID_USER": {
                color: palette.darkmatte,
                msg: `Sorry, i can't find that user.`
            },

            "NO_RECORDS_FOUND": {
                color: palette.darkmatte,
                msg: `**${opt[0]}** doesn't have any strike record yet. Type \`+ <reason>\` to add new strike.`
            },

            "SHORT_GUIDE": {
                color: palette.darkmatte,
                msg: `You are authorized to access the strike-system. Each strike point will automatically give them
                such as temporary mute, kick and ban so please use it wisely.`
            },

            "TEST": {
                color: palette.darkmatte,
                msg: `${opt[0]}[0] - ${opt[1]}[1]`
            }
        }

        const res = logtext[props.code];
        return format.embedWrapper(res.color, res.msg);
    }


    //  strike-collection utils.
    class Query {


        constructor(member) {
            this.member = member
        }


        //  Display user's strike history.
        get view() {
            return sql.all(`SELECT * FROM strike_list WHERE userId = "${metadata.target.id}" ORDER BY timestamp DESC`)
        }


        //  Mute user temporarily.
        get mute() {
            if(!env.dev) this.member.addRole(`467171602048745472`);
            return log({code: `MUTED`}, metadata.target.user.username);
        }


        //  Kick user temporarily.
        get kick() {
            if(!env.dev) this.member.kick();
            return log({code: `KICKED`}, metadata.target.user.username);
        }


        //  Ban user permanently.
        get ban() {
            if(!env.dev) this.member.ban();
            return log({code: `BANNED`}, metadata.records_size, metadata.target.user.username);
        }


        //  Penalties will be given after new strike being added.
        get penalty() {
            const v = metadata.records_size;
            return v == 1 ? this.mute : v == 2 ? this.mute : v == 3 ? this.kick : this.ban;
        }


        //  Add new user's strike record
        get register() {
            console.log(`${metadata.admin.name} has reported ${metadata.target.id}.`)
            return sql.run(`INSERT INTO strike_list(timestamp, assigned_by, userId, reason)
                    VALUES (${metadata.current_date}, "${metadata.admin.id}", "${metadata.target.id}", "${metadata.reason}")`)
        }
        
    }


    //  Core proccesses.
    const main = async () => {

        let query = new Query(message.guild.members.get(metadata.target.id));
        let res_view = await query.view
        metadata.records_size = res_view.length;


        //  Display parsed result from available user's strike record.
        const insights = () => {
            let str = `Total **${metadata.records_size}** records were found
            The recent one was reported by **${bot.users.get(res_view[0].assigned_by).username}**
            At ${moment(res_view[0].timestamp).format("dddd, MMMM Do YYYY, h:mm:ss a")}
            \nLook below for detailed logs.`

            for(let index in res_view) {
                str += `\n[${moment(res_view[index].timestamp).format("MMMM Do YYYY, h:mm:ss a")}](https://discord.gg/Tjsck8F) - ${bot.users.get(res_view[index].assigned_by).username} "${res_view[index].reason}"`
            }
            return str;
        }


        // Check if there's any report that able to show.
        metadata.records_size < 1 
        ? log(
            {code: `NO_RECORDS_FOUND`},
            metadata.target.user.username
        )
        : log(
            {code: `INSIGHTS`},
            metadata.admin.name,
            metadata.target.user.username,
            insights()
        );


        //  Listening to second response.
        const collector = new Discord.MessageCollector(message.channel,
            m => m.author.id === message.author.id, {
                max: 1,
                time: 60000,
            });


        collector.on(`collect`, async (msg) => {
            let input = msg.content;
            

            //  Register new strike record
            if(input.startsWith(`+`)) {
                metadata.reason = input.substring(2);
                metadata.current_date = Date.now();
                metadata.records_size = res_view.length + 1;

                // Store new record.
                query.register;

                //  Give penalty to the user based on their total records.
                query.penalty;
                collector.stop();
            }
            else {
                collector.stop();
            }
        
        })
        
    }


    //  Initial process
    const run = async () => {
  
        //  Returns when the message comes from non-staff channel.
        if(![`sandbox`, `naph-little-house`, `staff-hq`].includes(message.channel.name))return log({code: `UNAUTHORIZED`});


        //  Returns tutorial
        if(message.content.length <= command.length+1)return log({code: `SHORT_GUIDE`})
        

        //  Returns if target is not valid member.
        metadata.target = await utils.userFinding(message, message.content.substring(command.length+2))
        if(!metadata.target)return log({code: `INVALID_USER`});


        return main();
    }

    run();

}


module.exports.help = {
    name: "strike",
    aliases: ["strikes", "strikez"],
    description: `Give a strike to a user`,
    usage: `>strike @user`,
    group: "Admin",
    public: true,
}