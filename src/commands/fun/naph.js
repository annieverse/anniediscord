class Naphy {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async execute() {
        const { reply } = this.stacks
        reply(`[shaq and cat gif](http://gph.is/S5UMDD)`)
    }
}

module.exports.help = {
    start: Naphy,
    name: `naph`,
    aliases: [`naph`],
    description: `How do you describe @naphnaphz#7790 well by this gif, thats all`,
    usage: `naph`,
    group: `fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}