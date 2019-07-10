
/* eslint-disable  */
const assert = require(`assert`);
const { expect } = require(`chai`);

describe(`Initial check-up`, () => {

    it(`Load environment variables`, () => {
        expect(require(`dotenv`).config()).to.not.be.undefined;
    })

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

})
