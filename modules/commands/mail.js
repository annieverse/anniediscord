
/**
*   Main module
*   @Mail Anonymous-administrator direct message through annie.
*/
class Mail {
    constructor(Stacks) {
        this.stacks = Stacks;
    }

    /**
     *  Initializer method
     */
    async execute() {
        const { isAdmin, code, reply, args, palette, collector, name, meta: {author} } = this.stacks;

        //  Returns if user doesn't have admin authority
        if (!isAdmin) return reply(code.UNAUTHORIZED_ACCESS)
        //  Returns as guide if user doesn't specify any parameter.
        if (!args[0]) return reply(code.MAIL.SHORT_GUIDE)
        //  Returns if target user is invalid.
        if (!author) return reply(code.MAIL.INVALID_USER)

        //  Confirmation message.
        reply(code.MAIL.PROMPT, {socket: [name(author.id)]})

        collector.on(`collect`, msg => {
            //  Close connection
            collector.stop()
            try {
                //  Send message to target
                reply(msg, {field: author})
                //  Show notification if message has been successfully delivered.
                reply(code.MAIL.SUCCESSFUL, {socket: [name(author.id)], color: palette.lightgreen})
            }
            catch(e) {
                //  Handles the error caused by locked dms setting.
                reply(code.MAIL.UNSUCCESSFUL, {color: palette.red})
            }

        })
    }
}

module.exports.help = {
    start: Mail,
    name: "mail",
    aliases: [],
    description: `Send a message to a specified user`,
    usage: `${require(`../../.data/environment.json`).prefix}mail @user <message>`,
    group: "Admin",
    public: true,
    required_usermetadata: true,
    multi_user: true
}