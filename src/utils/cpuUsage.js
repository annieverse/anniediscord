const os = require(`os`)


/**
 *  Average of used CPU rate per core by system.
 *  @cpuPercentage
 */
const cpuPercentage = () => {
    const cpus = os.cpus()
    const cpuArray = []
    for (var i = 0, len = cpus.length; i < len; i++) {
        var cpu = cpus[i],
            total = 0

        for (var type in cpu.times) {
            total += cpu.times[type]
        }
        cpuArray.push(Math.round(100 * (cpu.times.sys / total)))
    }
    return cpuArray.reduce((x, y) => x + y) / cpuArray.length
}


module.exports = cpuPercentage