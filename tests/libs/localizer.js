const { expect } = require(`chai`)
const sinon = require(`sinon`)
const fs = require(`fs`)
// Mock locale content
const mockLocales = {
  'en.json': {
    "LOCALE_NOT_FOUND": "**i'm sorry !!** there seems to be an issue with the availability of my localized message. kindly help reporting this to my developers [in the support server.](https://discord.gg/HjPHCyG346) ; ;",
    "REQUEST_PING": `**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`,
    "SAY": {
      "SHORT_GUIDE": `Please include the message that you want me to read! {{emoji}}`
    },
    "EN_EXCLUSIVE": `This is an exclusive message for English only!`
  },
  'fr.json': {
    "REQUEST_PING": `**Pong !** {{emoji}}\n╰ reçu en {{ping}} ms !`,
    "SAY": {
      "SHORT_GUIDE": `Veuillez inclure le message que vous souhaitez que je lise ! {{emoji}}`
    }
  }
}
const Module = require(`module`)
const originalRequire = Module.prototype.require
Module.prototype.require = function(...args) {
  // Handle locale JSON files
  if (args[0].endsWith(`en.json`)) {
    return mockLocales[`en.json`]
  }
  if (args[0].endsWith(`fr.json`)) {
    return mockLocales[`fr.json`]
  }
  
  return originalRequire.apply(this, args)
}

const { Localization } = require(`../../src/libs/localizer`)
describe(`Localizer Library`, () => {
  let sandbox
  let requireStub
  let readdirStub

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(fs, `readdirSync`).returns([`en.json`, `fr.json`])
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe(`Localization Class`, () => {
    let localizer

    beforeEach(() => 
      localizer = new Localization()
    )

    it(`should initialize with correct available locales ids`, () => {
      expect(localizer.availableLocales).to.deep.equal({
        "english": `en`,
        "french": `fr`
      })
    })

    it(`should allow setting and getting language`, () => {
      localizer.lang = `fr`
      expect(localizer.lang).to.equal(`fr`)
    })

    it(`should prevent non-string locale key as the lookup parameter, return placeholder fallback`, () => {
      localizer.lang = `en`
      const nonStringKey = localizer.findLocale(null)
      expect(nonStringKey).to.equal(mockLocales[`en.json`]['LOCALE_NOT_FOUND'])
    })

    it(`should find locale by key (1-level deep) with current language`, () => {
      localizer.lang = `en`
      const msg = localizer.findLocale(`REQUEST_PING`)
      expect(msg).to.equal(`**Pong!** {{emoji}}\n╰ received in {{ping}} ms!`)
    })

    it(`should find locale by key (2-level deep) with current language`, () => {
      localizer.lang = `en`
      const msg = localizer.findLocale(`SAY.SHORT_GUIDE`)
      expect(msg).to.equal(`Please include the message that you want me to read! {{emoji}}`)
    })

    it(`should fallback to 'en' version when key not found in other language`, () => {
      localizer.lang = `fr`
      const msg = localizer.findLocale(`EN_EXCLUSIVE`)
      expect(msg).to.equal(`This is an exclusive message for English only!`)
    })
  })
})