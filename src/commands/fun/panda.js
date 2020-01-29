const superagent = require(`superagent`)

class panda {
    constructor(Stacks) {
        this.stacks = Stacks
    }

    async panda() {
        const { reply } = this.stacks
        let { body } = await superagent.get(`https://some-random-api.ml/img/panda`)
        return reply(``, {
            image: body.link,
            prebuffer: true,
            deleteIn: 5000
        })
    }
    async redPanda() {
        const { reply } = this.stacks
        let { body } = await superagent.get(`https://some-random-api.ml/img/red_panda`)
        return reply(``, {
            image: body.link,
            prebuffer: true,
            deleteIn: 5000
        })
    }

    async execute() {
        let randomNum = Math.random() > 0.5
        switch (randomNum) {
            case true:
                this.panda()
                break
            default:
                this.redPanda()
                break
        }
    }
}

module.exports.help = {
    start: panda,
    name: `panda`,
    aliases: [],
    description: `Displays a random picture of a panda or a red.`,
    usage: `panda`,
    group: `Fun`,
    public: true,
    require_usermetadata: false,
    multi_user: false
}