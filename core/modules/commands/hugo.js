class Hugo {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply } = this.stacks
        reply(`[Frank Sinatra - The Coffee Song](https://www.youtube.com/watch?v=zTbJBnkRkFo)\n
        [Coffee - Jack Stauber (Extended Fan Edit)](https://www.youtube.com/watch?v=slgEYXJ1sZQ)`)
    }
}

module.exports.help = {
    start: Hugo,
    name: `hugo`, 
    aliases: [`hugo`],
    description: `How do you describe @hugonun#0422 well by this video, thats all`,
    usage: `hugo`,
    group: `fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}
