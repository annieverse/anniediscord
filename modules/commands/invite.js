class invite {
    constructor(Stacks) {
        this.utils = Stacks.utils;
        this.message = Stacks.message;
        this.args = Stacks.args;
        this.palette = Stacks.palette;
        this.stacks = Stacks;
    }

    async execute() {
        let message = this.message; 
        return message.channel.send(`Hey **${message.author.username}**, here's the link.
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