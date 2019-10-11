class Coffee {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply } = this.stacks
        reply(`[Frank Sinatra - The Coffee Song](https://www.youtube.com/watch?v=H3MqmV47Lq8)\n
        [Coffee - Jack Stauber (Extended Fan Edit)](https://www.youtube.com/watch?v=slgEYXJ1sZQ)`)
    }
}

module.exports.help = {
    start: Coffee,
    name: `coffee`, // This MUST equal the filename
    aliases: [`hugo`], // More or less this is what the user will input on discord to call the command
    description: `How do you describe @hugonun#0422 well by this video, thats all`,
    usage: `hugo`,
    group: `fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}