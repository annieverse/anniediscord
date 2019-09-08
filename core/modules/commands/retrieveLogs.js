const LogsManager = require(`../../utils/logsManager`)
/**
 * Main module
 * @Logs retrieve system log.
 */
class Logs {
	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
     *	Initializer method
     */
	async execute() {
		const { isDev, code, reply, args, name, meta:{author} } = this.stacks

		//  Returns if user has no dev authority
        if (!isDev) return reply(code.GETLOG.UNAUTHORIZED)
        
        //  Target date
        let parseRef = args[0] || `today`

        //  Get log file
        let file = new LogsManager(this.stacks).pull(parseRef)

        //  Output attachment
        return reply(code.GETLOG.RETURNING, {
            socket: [name(author.id)],
            simplified: true,
            image: `./logs/${file}`,
            prebuffer: true
        })
	}
}

module.exports.help = {
	start: Logs,
	name:`retrieveLogs`,
	aliases: [`getlog`, `log`, `logs`],
	description: `Retrieve log by date`,
	usage: `>getlog`,
	group: `Admin`,
	public: true,
	required_usermetadata: true,
	multi_user: false
}