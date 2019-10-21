const superagent = require(`superagent`)

class hug {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async hug() {
        const { reply } = this.stacks
        let { body } = await superagent.get(`https://some-random-api.ml/animu/hug`)
        return reply(``, {
            imageGif: body.link,
            prebuffer: true,
            deleteIn: 5000
        })
    }

    async execute() {
        const { message } = this.stacks
        message.delete()
        this.hug()
    }
}

module.exports.help = {
    start: hug,
    name: `hug`,
    aliases: [],
    description: `Displays a random gif of a hug.`,
    usage: `hug`,
    group: `Fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}