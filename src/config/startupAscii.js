const {
    version,
    engines
} = require(`../../package`)
let ascii = {}

ascii.default = `
                     
,---.          o     
|---|,---.,---..,---.
|   ||   ||   |||---'
\`   '\`   '\`   '\`\`---'
                             
@v${version}		Made with ♥
`

ascii.minimalist = `
                     
,---.          o     
|---|,---.,---..,---.
|   ||   ||   |||---'
\`   '\`   '\`   '\`\`---'
                             
@v${version}		Made with ♥
@minimalist
--------------------------------
Major features are disabled in this state
--------------------------------
`

ascii.developer = `
                     
,---.          o     
|---|,---.,---..,---.
|   ||   ||   |||---'
\`   '\`   '\`   '\`\`---'
                             
@v${version}		Made with ♥
@developer-mode
--------------------------------
Instance ran with node ${engines.node}
--------------------------------
`


module.exports = ascii