'use strict'

class Controller {
    constructor (datasources) {
        this.ds = datasources
    }

    /* eslint class-methods-use-this: "off" */
    getPingHandle () {
        return (ctx) => {
            ctx.status = 200
            ctx.body = 'ok'
        }
    }

    postSearchHandle () {
        return (ctx) => {
            const {target} = ctx.request.body

            ctx.status = 200
            ctx.body = this.ds.getTargets(target)
        }
    }

    postQueryHandle () {
        return (ctx) => {
            const {range, targets, intervalMs} = ctx.request.body
            const from = (new Date(range.from)).getTime()
            const to = (new Date(range.to)).getTime()

            ctx.status = 200
            ctx.body = []

            for (const target of targets) {
                if (target.type === 'timeserie') {
                    const results = this.ds.getTimeserie(from, to, intervalMs, target.target)
                    for (const result of results) {
                        ctx.body.push(result)
                    }
                    continue
                }
                if (target.type === 'table') {
                    ctx.body.push(this.ds.getTable(from, to, intervalMs, target.target))
                }
            }
        }
    }

    /* eslint class-methods-use-this: "off" */
    postDumbHandle () {
        return (ctx) => {
            ctx.status = 200
            ctx.body = []
        }
    }
}

module.exports = Controller
