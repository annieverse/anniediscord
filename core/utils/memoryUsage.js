const memoryPercentage = () => {
    return process.memoryUsage().heapTotal
}

module.exports = memoryPercentage