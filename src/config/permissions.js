module.exports = {
    developer: {
        name: `Developer`,
        level: 4,
        description: `Super user.`,
        accounts: [`230034968515051520`, `277266191540551680`],
        permissionString: `ADMINISTRATOR`
    },
    administrator: {
        name: `Administrator`,
        level: 3,
        description: `The highest permission in a server.`,
        permissionString: `ADMINISTRATOR`
    },
    moderator: {
        name: `Moderator`,
        level: 2,
        description: `Server staff with minimal access to admin privileges.`,
        permissionString: `MANAGE_MESSAGES`
    },
    beta: {
        name: `Beta`,
        level: 1,
        description: `Regular user with given access to unreleased feature.`,
        permissionString: `MANAGE_NICKNAMES`,
    },
    user: {
        name: `User`,
        level: 0,
        description: `Regular user.`,
        permissionString: `SEND_MESSAGES`,
    }
}