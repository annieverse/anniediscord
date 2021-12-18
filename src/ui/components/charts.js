const { CanvasRenderService } = require(`chartjs-node-canvas`)
const Color = require(`color`)
const themePresets = require(`../colors/themes`)
const palette = require(`../colors/default`)

class Chart {


    /**
	 * Global presets for current chart instance.
	 * @param {*} Object
	 */
    constructor({
        width=700, 
        height=400, 
        labels=[], 
        datasets=[], 
        primaryColor=themePresets[`dark`].text, 
        theme=`dark`
        }) {
        this.width = width
        this.height = height
        this.chart = new CanvasRenderService(width, height)
        this.labels = labels
        this.datasets = datasets
        this.primaryColor = primaryColor
        this.color = themePresets[theme]
    }


    /**
	 * 	Fallback handler for component's color property.
	 * 	@param {String} prop color's name reference.
	 *	@param {String} defaultOpt fallback color when given prop is not exists in the available palette pool.
	 * 	@private	
	 * 	@_resolveColor
	 */
	_resolveColor(prop, defaultOpt) {
		//	Check for color availability in standard colorset
		if (palette[prop]) return palette[prop]

		//	If color is inherited, this will use the defined primary color in the global preset.
		if (palette[this.primaryColor]) return palette[this.primaryColor] 
		if (this.color[this.primaryColor]) return this.color[this.primaryColor] 
		if (prop === `inherit`) return this.primaryColor

		return defaultOpt
    }
    

    /**
     *  For configuration consistency.
     *  @chartConfigurations
     */
    get chartConfigurations() {
        const extractedRgbValuesFromPrimaryColor = (Color(this._resolveColor(this.primaryColor, palette.white)).rgb().array()).join(`, `)
        return {
            type: `line`,
            data: {
                labels: this.labels,
                datasets: [{
                    backgroundColor: `rgba(${extractedRgbValuesFromPrimaryColor}, 0.1)`,
                    borderColor: this._resolveColor(this.primaryColor, palette.white),
                    data: this.datasets
                }]
            },
            options: {
                legend: {
                    display: false
                },
                elements: {
                    point: {
                        radius: 0
                    }
                },
                scales: {
                    gridLines: {
                        zeroLineColor: this.color.separator,
                        color: this.color.separator
                    },
                    yAxes: [{
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 3,
                            fontColor: this.color.text,
                            fontFamily: `Roboto`,
                            fontSize: 8,
                            stepSize: 100,
                            beginAtZero: true
                        },
                    }],
                    xAxes: [{
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 2,
                            maxRotation: 0,
                            minRotation: 0,
                            fontColor: this.color.text,
                            fontFamily: `Roboto`,
                            fontSize: 8,
                            beginAtZero: true,
                            reverse: true
                        }
                    }]
                }
            }
        }
    }


    /**
     *  Render chart into buffer.
     *  @render
     */
    async render() {
        return await this.chart.renderToBuffer(this.chartConfigurations)
    }


}


module.exports = Chart