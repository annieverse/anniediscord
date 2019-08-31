/* eslint-disable  */
const { expect } = require(`chai`)
const sinon = require(`sinon`)

/**
 *  Test method should be independent
 *  Not depending to other factors
 */
describe(`Initial check`, () => {


    describe(`modulesLoader`, () => {
        testLoadingCommands()
    })
    describe(`Module (Buy.js)`, () => {
        userTransactionParameters()
    })






    /**
     *  Test whether the app able to load commands correctly or not
     *  @testCommandsLoading
     */
    function testLoadingCommands() {
        const modulesLoader = require(`../core/utils/modulesLoader`)
        const Loader = new modulesLoader()
        const MockClient = Loader.register({})
        const commandsArray = Loader.fetchSource


        /**
         *  Should atleast loaded one command.
         */
        it(`Fetch commands in ./modules/commands`, () => {
            expect(commandsArray).length.to.not.equal(0)
        })


        /**
         *  Verifying both container
         */
        it(`Verify all the available commands have been properly loaded`, () => {
            expect(MockClient.commands.size).to.equal(commandsArray.length)
        })
    }


    /**
     *  Double checking user input
     *  @userTransactionParameters
     */
    function userTransactionParameters() {
        describe(`Transaction handling`, () => {
                let msg = `>buy role baka potato`;
                let prefix = `>`
                let msgArray = msg.split(" ");
                let cmd = msgArray[0].toLowerCase();
                let args = msgArray.slice(1);

                describe(`args : [${args}]`, () => {
                    it(`message sliced into chunks of arguments`, () => {
                        expect(args).to.be.an(`array`)
                    })
                })

                //  Parsing category or item type from user message
                const type = args[0].charAt(0).toUpperCase() + args[0].slice(1) + `s`
                describe(`Type : '${type}'`, () => {
                    it(`Should be plural and capitalized`, () => {
                        expect(type.charAt(0)).to.equal(type.charAt(0).toUpperCase())
                        expect(type.substr(-1)).to.equal(`s`)
                    })
                })

                //  Parsing item name dynamically from user message
                const item_name = msg.substring(msg.indexOf(args[1]))
                describe(`Item name : '${item_name}'`, () => {
                    it(`Should get correct item name`, () => {
                        expect(item_name).to.be.a(`string`)
                    })
                })
            })
    }
})
