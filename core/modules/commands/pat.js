const superagent = require(`superagent`)

class pat {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async pat() {
        const { reply } = this.stacks
        let { body } = await superagent.get(`https://some-random-api.ml/animu/pat`)
        return reply(``, {
            imageGif: body.link,
            prebuffer: true,
            deleteIn: 5000
        })
    }

    async execute() {
        const { message } = this.stacks
        message.delete()
        this.pat()
    }
}

module.exports.help = {
    start: pat,
    name: `pat`,
    aliases: [],
    description: `Displays a random gif of a pat.`,
    usage: `pat`,
    group: `Fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}