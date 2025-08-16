module.exports = function shardResume(annie, shardId, replayedEvents) {
    annie.logger.info(`Shard ${shardId} has resumed!`)
    annie.logger.info(`Replayed events: ${replayedEvents}`)
}