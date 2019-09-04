/* eslint-disable  */
const { expect } = require(`chai`)

/**
 *  Test method should be independent
 *  Not depending to other factors
 */
describe(`Initial check`, () => {


    describe(`modulesLoader`, () => {
        testLoadingCommands()
    })
    describe(`Module (Buy.js)`, () => {
        userParameters()
    })






    /**
     *  Test whether the app able to load commands correctly or not
     *  @testCommandsLoading
     */
    async function testLoadingCommands() {
        const { readdirSync } = require(`fs`)
        const { Collection } = require(`discord.js`)
        const commandsPath = `./core/modules/commands/`

    
        class mockModulesLoader {

            /**
             * 	Get all files in commands directory
             */
            get fetchSource() {
                return readdirSync(commandsPath)
            }


            /**
             * 	Assigning fetchSource() result to @Client
             */
            register(Client) {

                //	Initialize new collection in the client
                Client.commands = new Collection()
                Client.aliases = new Collection()

                try {

                    //	Get all the .js files
                    let jsfile = this.fetchSource.filter(f => f.split(`.`).pop() === `js`)


                    //	Recursively registering commands
                    jsfile.forEach((f) => {
                        let props = require(`../core/modules/commands/${f}`)
                        Client.commands.set(props.help.name, props)
                        props.help.aliases.forEach(alias => {
                            Client.aliases.set(alias, props.help.name)
                        })
                    })


                    //	Log & Return the updated client
                    return Client

                }
                catch (e) {

                    //	Log & return the old client
                    return Client

                }
            }
        }


        const Loader = new mockModulesLoader()
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
        it(`Verify all the available commands have been properly loaded`, async () => {
            const MockClient = await Loader.register({})
            expect(MockClient.commands.size).to.equal(commandsArray.length)
        })
    }


    /**
     *  Double checking user input
     *  @userParameters
     */
    function userParameters() {
        describe(`User Parameter`, () => {
                let msg = `>buy role baka potato`;
                let msgArray = msg.split(" ");
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
