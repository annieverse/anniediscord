const { readdirSync } = require(`fs`)
const Command = require(`../../libs/commands`)

/**
 * 	Retrieving log file
 * 	@author klerikdust
 */
class Logs extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
		this.logPath = `./logs/`
    }
    
    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        
        //  Target date
        let parseRef = this.args[0] || `today`
        //  Get log file
        let file = await this._pullFile(parseRef)
        if (!file) return reply(this.locale.GETLOG.NULL, {
            color: `red`,
            socket: {
                user: name(this.user.master.id),
                emoji: await emoji(`AnnieCry`)          
            }
        })

        //  Output attachment
        return reply(this.locale.GETLOG.RETURNING, {
            socket: {
                user: name(this.user.master.id),
                emoji: await emoji(`AnnieSmile`)
            },
            simplified: true,
            image: this.logPath + file,
            prebuffer: true,
        })
    }
    
	/**
	 * Fetch log file from disk.
	 * @param {String} [date=`today`]
     * @returns {LogFile}
	 */
	async _pullFile(date = `today`) {
        const fn = `[Logs._pullfile()]`
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
            this.logger.error(`${fn} has failed to retrieve log file > ${error.stack}`)
            return null
        }
    }
    
}

module.exports.help = {
	start: Logs,
	name:`logs`,
	aliases: [`getlog`, `log`],
	description: `Retrieving log file`,
	usage: `getlog <Date>(Optional)`,
    group: `Developer`,
    permissionLevel: 4,
	multiUser: true
}