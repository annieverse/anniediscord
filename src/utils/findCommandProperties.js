/**
 * Fetch command from registered commands in client properties.
 * @since 6.0.0
 * @param {object} [client={}] Current client's instance.
 * @param {string} [commandName=``] Target command name.
 * @returns {object|null}
 */
module.exports = (client={}, commandName=``) => {
 	const normalizedCommandName = commandName.toLowerCase()
    const res = client.commands.names.get(normalizedCommandName) || client.commands.names.get(client.commands.aliases.get(normalizedCommandName))
    if (!res) return null
    return res.help
}