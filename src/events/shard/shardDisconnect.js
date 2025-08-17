module.exports = function shardDisconnect(annie, closeEvent, shardId) {
    annie.logger.info(`Shard ${shardId} disconnected:`, closeEvent)
}