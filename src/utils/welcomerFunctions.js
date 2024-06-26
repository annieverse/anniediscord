/**
 * Parsing welcomer text's sockets.
 * @param {string} [text=``] target string to be parsed from
 * @param {object} guild Discord guild object
 * @param {object} member Discord guildmember object
 * @returns {string}
 */
const parseWelcomerText = (text=``, guild, member) => {
    // Replace new line character in case it doesnt make the new line
    text = text.replace(/\\n/g, `\n`)
    text = text.replace(/{{guild}}/gi, `**${guild.name}**`)
    text = text.replace(/{{user}}/gi, member)
    return text
}

module.exports = {parseWelcomerText}