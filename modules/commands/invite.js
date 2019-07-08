/**
 * Main module
 * @ServerInvitation as one-type command to server invite link.
 */
class ServerInvitation {
    constructor(Stacks) {
        this.stacks = Stacks;
        this.link = `https://discord.gg/YFaCQVn`;
    }

    /**
     *  Initializer method
     */
    async execute() {
        const { reply } = this.stacks
        return reply(this.link, {simplified: true})
    }
}

module.exports.help={
    start: ServerInvitation,
    name:"invite",
    aliases: ["serverinvite", "serverlink", "linkserver", "invitelink", "link"],
    description: `gives a server invite link`,
    usage: `${require(`../../.data/environment.json`).prefix}invite`,
    group: "Server",
    public: true,
    required_usermetadata: false,
    multi_user: false
}