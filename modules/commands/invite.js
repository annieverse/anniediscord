class invite {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    async execute() {
        return this.stacks.message.channel.send(`Hey **${this.stacks.message.author.username}**, here's the link.
	https://discord.gg/YFaCQVn`)
    }
}

module.exports.help={
    start: invite,
    name:"invite",
    aliases: ["serverinvite", "serverlink", "linkserver", "invitelink", "link"],
    description: `gives a server invite link`,
    usage: `${require(`../../.data/environment.json`).prefix}invite`,
    group: "Server",
    public: true,
    require_usermetadata: false,
    multi_user: false
}