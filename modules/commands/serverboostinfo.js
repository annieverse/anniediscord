class serverBoost {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    boostNum() {
        this.stacks.utils.sendEmbed(`This Server has a total of ${this.stacks.message.guild.roles.find(n => n.id === "585550404197285889").members.map(m => m.user.tag).length} boosts currently!!`)
    }

    boostMembers() {
        this.stacks.utils.sendEmbed(`These are the members currently boosting the server :D\n${this.stacks.message.guild.roles.find(n => n.id === "585550404197285889").members.map(m => m.user.tag).join('\n')}`)
    }

    boostLevel() {
        let count = this.stacks.message.guild.roles.find(n => n.id === this.stacks.roles.nitro_boost).members.map(m => m.user.tag).length;
        let message;
        if (count >= 2 && count < 10) message = "The current level this server boosts is: Level 1";
        if (count >= 10 && count < 50) message = "The current level this server boosts is: Level 2";
        if (count >= 50) message = "The current level this server for boosts is: Level 3";
        this.stacks.utils.sendEmbed(message)
    }

    async execute() {
        if (['level', 'lvl', 'l'].some(x => x.toLowerCase() === this.stacks.args[0].toLowerCase())) return this.boostLevel();
        if (['member', 'mem', 'm'].some(x => x.toLowerCase() === this.stacks.args[0].toLowerCase())) return this.boostMembers()
        if (['boost', 'boo', 'b'].some(x => x.toLowerCase() === this.stacks.args[0].toLowerCase())) return this.boostNum();
    }
}

module.exports.help = {
    start: serverBoost,
    name: "serverboostinfo",
    aliases: ["sb", "serverboost"],
    description: `Displays info about server boost level.`,
    usage: `${require(`../../.data/environment.json`).prefix}sb members | level | number`,
    group: "General",
    public: true,
    required_usermetadata: false,
    multi_user: false
}