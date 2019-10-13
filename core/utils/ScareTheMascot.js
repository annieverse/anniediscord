const { MessageCollector } = require(`discord.js`)
const databaseManager = require(`./databaseManager.js`)



class ScareTheMascot {
    constructor(bot) {
        this.bot = bot
        this.logger = this.bot.logger

        this.active = false // on/off switch
        this.eventchannels = [
            '614737097454125056',
            '628330270755651584'
        ]
        this.currentevent = false
        this.eventchannel = ''
        this.collectortrigger = '👻'
        this.prefix = '👻ˋˏ┋ '
        this.scaryusers = []
    }

    async eventloop() {
        await this.cleanevent()
        while(this.active) {
            try {
                //await this.delay(2*60*1000)
                await this.delay(1000) // for debugging
                await this.runevent()
                await this.delay(70*1000)
                await this.stopevent()
            } catch(e) {
                this.logger.error(`Scare The Mascot - Loop broke.`)
                this.logger.error(e)
                await this.cleanevent()
            }
        }
    }

    async runevent() {
        // This shouldnt be true, clean
        if(this.currentevent) {
            await this.cleanevent()
        }
        // Select random channel for event
        this.eventchannel = this.eventchannels[Math.floor(Math.random() * this.eventchannels.length)];
        await this.addChannelPrefix(this.eventchannel)
        // TODO Needs prettier message
        this.bot.channels.get(this.eventchannel).send('Boo!')
        this.logger.info('Scare The Mascot - Starting event on channel ' + this.eventchannel)
        this.currentevent = true

        // Collector
        const collector = new MessageCollector(this.bot.channels.get(this.eventchannel), m => m.content.includes(this.collectortrigger), { time: 60*1000 });
        collector.on('collect', message => {
            if(!message.author.bot){
                console.log(message.content)
                this.scaryusers.push(message.author.id)
            }
        })
    }

    async stopevent() {
        if(this.currentevent) {
            // Get scary users
            let winnerlist = [...new Set(this.scaryusers)]
            this.logger.info('Scare The Mascot - Users participating: ' + winnerlist)


            // Grab winner and reward
            if(this.scaryusers.length < 1) {
                this.logger.info('Scare The Mascot - No one won')
                this.bot.channels.get(this.eventchannel).send('No one won.')
            } else {
                const winner = winnerlist[Math.floor(Math.random() * winnerlist.length)];
                const db = new databaseManager(winner)
                db.storeCandies(10)
                this.logger.info('Scare The Mascot - ' + winner + ' wins <amount> candies!')
                this.bot.channels.get(this.eventchannel).send(winner + ' won!')
            }
        }
        await this.cleanevent()

    }

    // Cleans stuff for next event
    async cleanevent() {
        // Delete ghost from name of channels
        this.eventchannels.forEach((i) => {this.deleteChannelPrefix(i)})
        // Adjust vars
        this.currentevent = false
        this.eventchannel = ''
        this.scaryusers = []
    }

    async addChannelPrefix(channelid) {
        let channel = this.bot.channels.get(channelid)
        channel.setName(this.prefix + channel.name)
    }

    async deleteChannelPrefix(channelid) {
        let channel = this.bot.channels.get(channelid)
        channel.setName(channel.name.replace(new RegExp(this.prefix + "(.*)", "g"),'$1'))
    }

    async delay(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };


}

module.exports = ScareTheMascot
