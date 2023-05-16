const { expect } = require('chai');
const sinon = require('sinon');
const setlanguageCommand = require('../../../src/commands/setting/setLanguage');

describe('setlanguageCommand', () => {
  describe('execute', () => {
    it('should return guide message if no argument is provided', async () => {
      const client = {
        localizer: {
          localeCodesPool: ['en', 'es'],
          getTargetLocales: sinon.stub(),
        },
        db: {
          userUtils: {
            updateUserLocale: sinon.stub(),
          },
        },
      };
      const reply = {
        send: sinon.stub(),
      };
      const message = {
        author: {
          id: '123',
        },
        guild: {
          configs: {
            get: sinon.stub().returns({ value: '!' }),
          },
        },
      };
      const arg = null;
      const locale = {
        SETLANGUAGE: {
          GUIDE: 'Guide message',
        },
        __metadata: {
          targetLang: 'en',
        },
      };

      await setlanguageCommand.execute(client, reply, message, arg, locale);

      expect(reply.send).to.be.calledOnceWith(locale.SETLANGUAGE.GUIDE, {
        image: 'banner_setlanguage',
        socket: {
          prefix: '!',
          languages: '<en/es>',
          currentLanguage: 'en',
        },
      });
    });

    it('should update user locale and return successful message if a valid language is provided', async () => {
      const client = {
        localizer: {
          localeCodesPool: ['en', 'es'],
          getTargetLocales: sinon.stub().returns({}),
        },
        db: {
          userUtils: {
            updateUserLocale: sinon.stub(),
          },
        },
      };
      const reply = {
        send: sinon.stub(),
      };
      const message = {
        author: {
          id: '123',
        },
        guild: {
          configs: {
            get: sinon.stub().returns({ value: '!' }),
          },
        },
      };
      const arg = 'en';
      const locale = {
        SETLANGUAGE: {
          SUCCESSFUL: 'Successful message',
        },
      };

      await setlanguageCommand.execute(client, reply, message, arg, locale);

      expect(client.localizer.getTargetLocales).to.be.calledOnceWith('en');
      expect(client.db.userUtils.updateUserLocale).to.be.calledOnceWith('en', '123');
      expect(reply.send).to.be.calledOnceWith(locale.SETLANGUAGE.SUCCESSFUL, {
        status: 'success',
        socket: {
          language: 'EN',
        },
      });
    });
  });

  describe('Iexecute', () => {
    it('should return guide message if no argument is provided', async () => {
      const client = {
        localizer: {
          localeCodesPool: ['en', 'es'],
          getTargetLocales: sinon.stub(),
        },
        db: {
          userUtils: {
            updateUserLocale: sinon.stub(),
          },
        },
      };
      const reply = {
        send: sinon.stub(),
      };
      const interaction = {
        guild: {
          configs: {
            get: sinon.stub().returns({ value: '!' }),
          },
        },
        member: {
          id: '456',
        },
      };
      const options = {
        getString: sinon.stub().returns(null),
      };
      const locale = {
        SETLANGUAGE: {
          GUIDE: 'Guide message',
        },
        __metadata: {
          targetLang: 'en',
        },
      };
      await setlanguageCommand.Iexecute(client, reply, interaction, options, locale);

      expect(reply.send).to.be.calledOnceWith(locale.SETLANGUAGE.GUIDE, {
        image: 'banner_setlanguage',
        socket: {
          prefix: '!',
          languages: '<en/es>',
          currentLanguage: 'en',
        },
      });
    });

    it('should update user locale and return successful message if a valid language is provided', async () => {
      const client = {
        localizer: {
          localeCodesPool: ['en', 'es'],
          getTargetLocales: sinon.stub().returns({}),
        },
        db: {
          userUtils: {
            updateUserLocale: sinon.stub(),
          },
        },
      };
      const reply = {
        send: sinon.stub(),
      };
      const interaction = {
        member: {
          id: '456',
        },
      };
      const options = {
        getString: sinon.stub().returns('en'),
      };
      const locale = {
        SETLANGUAGE: {
          SUCCESSFUL: 'Successful message',
        },
      };

      await setlanguageCommand.Iexecute(client, reply, interaction, options, locale);

      expect(client.localizer.getTargetLocales).to.be.calledOnceWith('en');
      expect(client.db.userUtils.updateUserLocale).to.be.calledOnceWith('en', '456');
      expect(reply.send).to.be.calledOnceWith(locale.SETLANGUAGE.SUCCESSFUL, {
        status: 'success',
        socket: {
          language: 'EN',
        },
      });
    });
  });
});

