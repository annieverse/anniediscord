const databaseManager = require('../../utils/databaseManager.js')

class addEvent extends databaseManager{
    constructor(Stacks) {
        super();
        this.stacks = Stacks;

    }
    /**
     * 
     */
    addEvent() {
        const { message, multicollector, collector} = this.stacks;

        // Ask how to use multi-collector
    
        
    }

    /**
     * 
     */
    endEvent(event){

    }

    /**
     * 
     */
    removeEvent(event) {

    }

    /**
     * 
     */
    updateEvent(event, field, value) {

    }

    /**
     * 
     */
    duplicateEvent(event) {

    }

    helpCenter(){
        const {args} = this.stacks;
        if (args[0]==='add'){
            this.addEvent();
        } else if (args[0] === 'remove') {
            this.removeEvent(args[1])
        } else if (args[0] === 'end') {
            this.removeEvent(args[1])
        } else if (args[0] === 'update') {
            this.removeEvent(args[1], args[2], args[3])
        } else {
            this.stacks.reply(this.stacks.code.EVENT_MANAGER.SHORT_GUIDE, {
                footer:'<required>[optional]'
            })
        }
    }

    async execute() {
        this.helpCenter();
        //this.addValues('eventData', `event, start_time`, `'testDevingOne',${(new Date()).getTime()}`)
        //this.addValues(`eventData`, `event, start_time`, `'testDevingTwo',${(new Date()).getTime()}`)
        //this.addValues(`eventData`, `event, start_time, status`, `'testDevingThree',${(new Date()).getTime()}, 'ended'`)
    }
}

module.exports.help = {
    start: addEvent,
    name: "eventmanager", // This MUST equal the filename
    aliases: ["addevent", "ae"], // More or less this is what the user will input on discord to call the command
    description: `add a event with a time ti display :)`,
    usage: `${require(`../../.data/environment.json`).prefix}TemplateCommand`,
    group: "Admin",
    public: false,
    require_usermetadata: false,
    multi_user: false
}