const shardName = require(`../config/shardName.json`)
/**
 *  Parse shard name for given shard id.
 *  @param {number} id
 *  @return {string}
 */
module.exports = (id) => {
	return `${id}/${shardName[id]}`
}