const chai = require('chai');
const Localizer = require('../../src/libs/localizer');

describe('Localizer', () => {
  let localizer;

  beforeEach(() => {
    localizer = new Localizer();
  });

  describe('getTargetLocales()', () => {
    it('should have en as the default lang for fallback case', () => {
      const pool = localizer.getTargetLocales('fdgfdgdfs');
      chai.expect(pool.__metadata).to.have.property('fallbackLang', 'en');
    });

    it('should set isFallingback to true if non-existant lang is inputted', () => {
      const pool = localizer.getTargetLocales('asdhjashjdas');
      chai.expect(pool.__metadata).to.have.property('isFallingback', true);
    });

    it('should set targetLang and fallbackLang in the metadata', () => {
      const pool = localizer.getTargetLocales('fr');
      chai.expect(pool.__metadata).to.have.property('targetLang', 'fr');
      chai.expect(pool.__metadata).to.have.property('fallbackLang', 'en');
    });
  });

  describe('getLocalesPool()', () => {
    it('should return the pool of available locales', () => {
      const pool = localizer.getLocalesPool();
      chai.expect(pool).to.have.property('en');
    });
  });
});
