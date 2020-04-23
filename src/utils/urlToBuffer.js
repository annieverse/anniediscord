const { get } = require(`snekfetch`)

/**
 * Parse image from url to buffer.
 * @param {string} [url=``] target url img to be parsed.
 * @param {string} [size=`?size=512`] target resolution.
 * @returns {buffer}
 */
const urlToBuffer = (url=``, size=`512`) => {
	if (!url) return null
	return get(url.replace(/\?size=2048$/g, `?size=${size}`)).then(data => data.body)
}

module.exports = urlToBuffer