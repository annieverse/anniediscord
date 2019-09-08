const fetch = require(`node-fetch`)

class animeManager {

    constructor() {
    }

    getNumOfAnime(url) {
        var userlink
        if (url.startsWith(`https://myanimelist.net/profile/`)) {
            userlink = url.split(`https://myanimelist.net/profile/`)
            return this.getMalNumOfAnime(userlink[1].split(`/`)[0], 1, 0)
        }
        if (url.startsWith(`https://kitsu.io/users/`)) {
            userlink = url.split(`https://kitsu.io/users/`)
            return this.getKitsuNumOfAnime(userlink[1].split(`/`)[0])
        }

        return 0
    }

    async getMalNumOfAnime(user, startIndex, animes) {
        var response = await fetch(`https://api.jikan.moe/v3/user/`+user+`/animelist/completed?page=`+startIndex)
        var responsejson = await response.json()
        if (responsejson && responsejson.anime) {
            var numOfAnime = animes + responsejson.anime.length
            if (responsejson.anime.length == 300) {
                numOfAnime = await this.getMalNumOfAnime(user, startIndex+1, animes + responsejson.anime.length)
            }
            return numOfAnime
        }
        return animes
    }

    async getKitsuNumOfAnime(user) {
        var response = await fetch(`https://kitsu.io/api/edge/users/`+user+`/stats`)
        var responsejson = await response.json()
        var data = responsejson.data.find(d => d.attributes.kind==`anime-amount-consumed`)
        return data.attributes.statsData.media
    }

}

module.exports = animeManager