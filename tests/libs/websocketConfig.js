const { describe, it } = require(`mocha`)
const { expect } = require(`chai`)
const Discord = require(`discord.js`)
const fs = require(`fs`)
const path = require(`path`)

describe(`WebSocket Configuration`, () => {
    describe(`Discord Client WebSocket Options`, () => {
        it(`should have WebSocket configuration in Annie class constructor`, () => {
            // Read the annie.js file and check for WebSocket configuration
            const annieFilePath = path.join(__dirname, `../../src/annie.js`)
            const annieFileContent = fs.readFileSync(annieFilePath, `utf8`)
            
            // Check if WebSocket options are configured
            expect(annieFileContent).to.include(`ws: {`)
            expect(annieFileContent).to.include(`timeout: 60000`)
            expect(annieFileContent).to.include(`handshakeTimeout: 30000`)
            expect(annieFileContent).to.include(`compress: false`)
            expect(annieFileContent).to.include(`large_threshold: 1000`)
        })

        it(`should have attemptLogin method defined`, () => {
            const annieFilePath = path.join(__dirname, `../../src/annie.js`)
            const annieFileContent = fs.readFileSync(annieFilePath, `utf8`)
            
            // Check if attemptLogin method exists
            expect(annieFileContent).to.include(`async attemptLogin(retryCount = 0)`)
            expect(annieFileContent).to.include(`handshake has timed out`)
        })

        it(`should validate Discord.js WebSocket options structure`, () => {
            // Test that we can create a client with our WebSocket options
            const testOptions = {
                intents: [Discord.GatewayIntentBits.Guilds],
                ws: {
                    timeout: 60000,
                    handshakeTimeout: 30000,
                    compress: false,
                    large_threshold: 1000
                }
            }

            // This should not throw an error
            expect(() => {
                const client = new Discord.Client(testOptions)
                client.destroy() // Clean up immediately
            }).to.not.throw()
        })

        it(`should have WebSocket error handling in error.js`, () => {
            const errorFilePath = path.join(__dirname, `../../src/events/error.js`)
            const errorFileContent = fs.readFileSync(errorFilePath, `utf8`)
            
            // Check if WebSocket timeout handling exists
            expect(errorFileContent).to.include(`handshake has timed out`)
            expect(errorFileContent).to.include(`WebSocket handshake timeout`)
        })
    })
})