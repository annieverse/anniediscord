
/**
 * Parent/Master module for social feeds.
 * @since 6.0.0
 */
class Post {
    /**
     * @param {Object} message current <Message> instance
     * @param {Object} client current <AnnieClient> instance
     */
    constructor(message={}, client={}) {
        this.message = message
        this.client = client
    }


    /**
     * Check if the emoji equal to heart icon
     * @param {String} emoji Emoji name 
     */
    isHeartReaction(emoji=``) {
        return emoji == this.main_emoji
    }

    get inFeedChannel() {

    }


}