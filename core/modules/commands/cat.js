const superagent = require(`superagent`)

class cat {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async cat() {
        const { reply } = this.stacks
        let { body } = await superagent.get(`https://some-random-api.ml/img/cat`)
        return reply(``, {
            image: body.link,
            prebuffer: true,
            deleteIn: 5000
        })
    }

    async execute() {
        const { message } = this.stacks
        message.delete()
        this.cat()
    }
}

module.exports.help = {
    start: cat,
    name: `cat`,
    aliases: [],
    description: `Displays a random picture of a cat.`,
    usage: `hug`,
    group: `Fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}