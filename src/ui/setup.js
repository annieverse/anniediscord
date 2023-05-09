const { resolve, join } = require(`path`)
const { Canvas, loadFont } = require(`canvas-constructor/cairo`) 

loadFont(resolve(join(__dirname, `../fonts/roboto-thin.ttf`)), {"family":`roboto-thin`})
loadFont(resolve(join(__dirname, `../fonts/roboto-light.ttf`)),{"family":`roboto-light`})
loadFont(resolve(join(__dirname, `../fonts/roboto-medium.ttf`)), {"family":`roboto-medium`})
loadFont(resolve(join(__dirname, `../fonts/roboto-bold.ttf`)), {"family":`roboto-bold`})
loadFont(resolve(join(__dirname, `../fonts/roboto-black.ttf`)), {"family":`roboto-black`})

module.exports = Canvas