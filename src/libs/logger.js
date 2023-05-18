const pino = require(`pino`)

const logger = pino({
    transport: {
        targets: [
          { target: 'pino-pretty' },
        ]
      }
})

module.exports = logger