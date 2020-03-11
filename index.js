require(`dotenv`).config()
const Annie = require(`./src/annie`)
new Annie().prepareLogin(process.env.TOKEN)