const { readdirSync } = require(`fs`)
/**
 * Main module
 * @Logs retrieve system log.
 */
class Logs {
	constructor(Stacks) {
		this.stacks = Stacks
		this.logPath = `./logs/`
		this.logger = Stacks.bot.logger
	}


	/**
	 * Fetch log file from disk.
	 * @param {String} date default "today".
	 */
	async pullFile(date = `today`) {
		try {
            //	Get all the .log files
            let resArray = readdirSync(this.logPath)
                .filter(f => f
                    .split(`.`)
                    .pop() === `log`)
            let ref = {
                "today": resArray.length - 1,
                "yesterday": resArray.length - 2
            }
            return resArray[ref[date] || resArray.length - 1]
        }
        catch (error) {
            this.logger.error(`Failed to retrieve log file > ${error.message}`)
        }
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
        let file = this.pullFile(parseRef)

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