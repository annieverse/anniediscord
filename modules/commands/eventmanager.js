const databaseManager = require('../../utils/databaseManager.js')

class addEvent extends databaseManager {
    constructor(Stacks) {
        super();
        this.stacks = Stacks;
        this.required_roles = this.stacks.message.member.roles.find(r => Object.keys(this.stacks.roles.events).some(i => this.stacks.roles.events[i] === r.id));

    }

    addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    /**
     * adds a event to the db
     */
    addEvent() {
        const { message, multicollector, collector, reply } = this.stacks;

        let eventName;
        let date;
        let curDate = new Date();
        let curYear = curDate.getFullYear();
        // Ask how to use multi-collector
        reply("event name please?")
        collector.on('collect', async (msg) => {
            // Handle message
            eventName = msg.content;

            let parsed = await this.pullRowData('eventData', `'${eventName}'`, 'event')
            if (parsed === undefined) parsed = { event: 'placeholder' }
            if (parsed.event === eventName) return reply(`I'm sorry but that event already exists please start over and choose a different name`)
            // Next Collector
            reply("Now the date formated like this please: 1/5 or Mar 20 [month/date]", { footer: `The current date and time is: ${(new Date()).toString()}` })
            // Initialize second collector using first collector's msg object
            const secondCollector = multicollector(msg)

            secondCollector.on(`collect`, secondMsg => {
                // Handle message
                date = secondMsg.content + `/${curYear} `;
                // Next Collector
                reply("Now the time formated like this please: 12:00 [hour:minutes] [24 hour format]",{footer:`The current date and time is: ${(new Date()).toString()}`})
                // Initialize second collector using first collector's msg object
                const thirdCollector = multicollector(secondMsg)

                thirdCollector.on(`collect`, thirdMsg => {
                    date += thirdMsg.content

                    try {
                        date = new Date(date)
                    } catch (error) {
                        message.channel.send(error.message)
                    }

                    reply(`${date.toDateString()} At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}, with the name of the event being __${eventName}__. Is this correct?`, { footer: 'y / n' })
                    const forthCollector = multicollector(thirdMsg)

                    forthCollector.on(`collect`, forthMsg => {
                        if (forthMsg.content.toLowerCase() === 'y') {
                            this.addValues('eventData', `event, start_time, status`, `'${eventName}', ${date.valueOf()}, 'waiting'`);
                            reply(`The event __${eventName}__ has been added and will display when the time is close.`)
                        } else {
                            reply('Please start over, this event has not been added.')
                        }

                        forthCollector.stop();
                        thirdCollector.stop();
                        secondCollector.stop();
                        collector.stop();
                    })
                })
            })
        })
    }

    /**
     * set the status to ended
     * @param {string} event 
     */
    async endEvent(event) {
        const { reply } = this.stacks;
        // Make sure an event exists
        let parsed = await this.pullRowData('eventData', `'${event}'`, 'event')
        if (parsed === undefined) return reply('There are no events currently cataloged.');
        if (parsed.event !== event) return reply('There are no events currently cataloged.');
        try {
            this.updateValue('eventData', 'status', `ended`, 'event', `${event}`)
        } catch (error) {
            reply(error.message)
        }
        reply(`The event, __${event}__ has had it's status changed to ended`)

    }

    /**
     * remove the selected event
     * @param {string} event 
     */
    async removeEvent(event) {
        const { reply } = this.stacks;
        // Make sure an event exists
        let parsed = await this.pullRowData('eventData', `'${event}'`, 'event')
        if (parsed === undefined) return reply('There are no events currently cataloged.');
        if (parsed.event !== event) return reply('There are no events currently cataloged.');

        try {
            this.removeRowData('eventData', `'${event}'`, 'event')
        } catch (error) {
            reply(error.message)
        }
        reply(`The event, __${event}__ has been removed`)
    }

    /**
     * Look up data on any event if it exists
     * @param {string} event 
     */
    async eventLookUp(event) {
        const { reply } = this.stacks;
        // Make sure an event exists
        let parsed = await this.pullRowData('eventData', `'${event}'`, 'event')
        if (parsed === undefined) return reply('There are no events currently cataloged.');
        if (parsed.event !== event) return reply('There are no events currently cataloged with that event name.');

        let date = new Date(parsed.start_time)
        reply(`The event you found from your search is:\n${parsed.event}\n${date.toDateString()} At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}`)
    }

    /**
     * shows all the cataloged events
     */
    async showAllEvents() {
        const { reply } = this.stacks;
        let data = await this.pullData('eventData')
        // Make sure an event exists
        if (data[0] === undefined) return reply('There are no events currently cataloged.');
        let res = '';
        data.forEach(element => {
            let date = new Date(element.start_time)
            res += `Event: __${element.event}__, Date ${date.toDateString()} At ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}\n`
        });
        try {
            reply(res)
        } catch (error) {
            reply(error.message)
        };
    }

    /**
     * update the name or date/time of a event
     */
    async updateEvent() {
        const { multicollector, collector, reply } = this.stacks;
        let eventName;
        // Ask how to use multi-collector
        reply("event you would like to modify/update?")
        collector.on('collect', async (msg) => {
            // Handle message
            eventName = msg.content;

            let parsed = await this.pullRowData('eventData', `'${eventName}'`, 'event')
            if (parsed === undefined) parsed = { event: 'placeholder' }
            if (parsed.event !== eventName) return reply(`There are no events currently cataloged with that event name.`)
            // Next Collector
            reply("What would you like to modify?\n avaiable editable fields are: name, date, time")
            // Initialize second collector using first collector's msg object
            const secondCollector = multicollector(msg)

            secondCollector.on(`collect`, secondMsg => {
                // Handle message
                let field;
                switch (secondMsg.content.toLowerCase()) {
                    case 'name':
                        console.log('hmm')
                        field = 'event'
                        reply("Please Give the name you would like to change the event to.")
                        break;
                    case 'date':
                        field = 'date'
                        reply("Please give the date formated like this please: 1/5 or Mar 20 [month/date]")
                        break;
                    case 'time':
                        field = 'time'
                        reply("Please give the time formated like this please: 12:00 [hour:minutes] [24 hour format]")
                        break;
                }
                // Initialize second collector using first collector's msg object
                const thirdCollector = multicollector(secondMsg)

                thirdCollector.on(`collect`, thirdMsg => {

                    const forthCollector = multicollector(thirdMsg)
                    let eventDate, newDate, newMonth, newDay, newHours, newMinutes, newStart_time;
                    switch (field) {
                        case 'event':
                            reply(`Is this the correct new name:\n${thirdMsg.content}`, { footer: 'y / n' })
                            break;
                        case 'date':

                            eventDate = new Date(parsed.start_time)
                            newDate = new Date(thirdMsg.content)
                            newMonth = newDate.getMonth();
                            newDay = newDate.getDate();
                            eventDate.setMonth(newMonth)
                            eventDate.setDate(newDay)
                            newStart_time = eventDate.valueOf();
                            reply(`Is this correct for the new time?\n${eventDate.toDateString()} At ${this.addZero(eventDate.getHours())}:${this.addZero(eventDate.getMinutes())}`, { footer: 'y / n' })
                            break;
                        case 'time':
                            eventDate = new Date(parsed.start_time)
                            let parts = thirdMsg.content.split(':')
                            newHours = parts[0]
                            newMinutes = parts[1]
                            eventDate.setHours(newHours)
                            eventDate.setMinutes(newMinutes)
                            newStart_time = eventDate.valueOf();
                            reply(`Is this correct for the new time?\n${eventDate.toDateString()} At ${this.addZero(eventDate.getHours())}:${this.addZero(eventDate.getMinutes())}`, { footer: 'y / n' })
                            break;
                    }
                    forthCollector.on(`collect`, forthMsg => {
                        if (forthMsg.content.toLowerCase() === 'y') {
                            switch (field) {
                                case 'event':
                                    try {
                                        this.updateValue('eventData', 'event', `${thirdMsg.content}`, 'event', `${parsed.event}`)
                                    } catch (error) {
                                        reply(error.message)
                                    }
                                    reply(`The event Name has been changed to: __${thirdMsg.content}__`)
                                    break;
                                case 'date':
                                    try {
                                        this.updateValue('eventData', 'start_time', `${newStart_time}`, 'event', `${parsed.event}`)
                                    } catch (error) {
                                        reply(error.message)
                                    }
                                    reply(`The new date and time for the event: __${parsed.event}__ is ${eventDate.toDateString()} At ${this.addZero(eventDate.getHours())}:${this.addZero(eventDate.getMinutes())}`)
                                    break;
                                case 'time':
                                    try {
                                        this.updateValue('eventData', 'start_time', `${newStart_time}`, 'event', `${parsed.event}`)
                                    } catch (error) {
                                        reply(error.message)
                                    }
                                    reply(`The new date and time for the event: __${parsed.event}__ is ${eventDate.toDateString()} At ${this.addZero(eventDate.getHours())}:${this.addZero(eventDate.getMinutes())}`)
                                    break;
                            }
                        } else {
                            reply('Please start over, this event has not been edited.')
                        }
                        forthCollector.stop();
                        thirdCollector.stop();
                        secondCollector.stop();
                        collector.stop();
                    })
                })
            })
        })
    }

    helpCenter() {
        const { args, reply } = this.stacks;
        if (args[0] === 'add') {
            return this.addEvent();
        } else if (args[0] === 'remove') {
            return this.removeEvent(args.slice(1).join(' '))
        } else if (args[0] === 'lookup') {
            return this.eventLookUp(args.slice(1).join(' '))
        } else if (args[0] === 'end') {
            return this.endEvent(args[1])
        } else if (args[0] === 'lookup-all') {
            return this.showAllEvents()
        } else if (args[0] === 'update') {
            return this.updateEvent()
        } else {
            return reply(this.stacks.code.EVENT_MANAGER.SHORT_GUIDE, {
                footer: '<required>|[optional]'
            })
        }
    }

    async makeSureTableExists(){
        try {
            await this.registerTable('eventData', 'event', 'TEXT');
            await this.registerColumn('eventData', 'start_time', 'INTEGER');
            await this.registerColumn('eventData', 'status', 'TEXT');
        } catch (error) {
            console.log(error.message)
        }
    }

    async execute() {
        const { reply } = this.stacks;
        //await this.makeSureTableExists();
        if (!this.required_roles) return reply("I'm sorry but you do not have permission to use this command")
        return this.helpCenter();
    }
}

module.exports.help = {
    start: addEvent,
    name: "eventmanager", // This MUST equal the filename
    aliases: ["event", "e"], // More or less this is what the user will input on discord to call the command
    description: `Add a event with a time to display :)`,
    usage: `${require(`../../.data/environment.json`).prefix}event`,
    group: "Admin",
    public: false,
    require_usermetadata: false,
    multi_user: false
}