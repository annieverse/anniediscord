require(`dotenv`).config()
const Annie = require(`./src/annie`)

/**
 * Feel free to change the method to .minimal() if you want to test out
 * lighter version of the app.
 * Keep in mind that majority of the features are disabled in minimalist-state
 */
new Annie().default()