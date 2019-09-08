`use-strict`
const { readdirSync } = require(`fs`)

/**
 *  Handling log request
 *  @logsManager
 */
class LogsManager {

    constructor(data) {
        this.data = data
    }


	/**
	 * 	Get all files in logs directory
	 */
	get fetchSource() {
		return readdirSync(`./logs/`)
	}


	/**
	 * 	Pull log file based on date. If not specified, pull the recent one.
	 */
    pull(date = `today`) {
        try {
            //	Get all the .log files
            let resArray = this.fetchSource
                .filter(f => f
                    .split(`.`)
                    .pop() === `log`)
            let ref = {
                "today": resArray.length - 1,
                "yesterday": resArray.length - 2
            }
            return resArray[ref[date] || resArray.length - 1]
        }
        catch (e) {
            this.data.bot.logger.error(`Failed to retrieve log file. > ${e.stack}`)
        }
    }
}


module.exports = LogsManager