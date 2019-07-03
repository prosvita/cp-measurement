'use strict'

const low = require('lowdb')
const lodashId = require('lodash-id')
const SafeFileSync = require('./safe-file-sync')

class DataSources {
    constructor (sources) {
        this.sources = {}

        for (const source of sources) {
            const adapter = new SafeFileSync(source.file)
            const db = low(adapter)
            this.sources[source.name] = {
                db: db,
                targets: [
                    `${source.name}.count`,
                    `${source.name}.count.enabled`,
                    `${source.name}.count.disabled`,
                    `${source.name}.cumulative`
                ]
            }

            if (isPromise(db)) {
                db.then((_db) => {
                    this.sources[source.name].db = _db
                })
            }
            this.sources[source.name].db._.mixin(lodashId)
        }
    }

    getTargets (query) {
        const result = []
        const re = new RegExp(query === '' ? '.' : query, 'u')

        for (const name in this.sources) {
            if (this.sources[name] && this.sources[name].targets) {
                for (const target of this.sources[name].targets) {
                    if (re.test(target)) {
                        result.push(target)
                    }
                }
            }
        }

        return result
    }

    /* eslint class-methods-use-this: "off" */
    filters (name) {
        const f = {
            default: () => true,
            enabled: (item) => !item.data.disable,
            disabled: (item) => item.data.disable
        }

        return f[name]
    }

    /* eslint class-methods-use-this: "off" */
    counter (from, to, interval, t, datapoints, inc = true) {
        if (t > (from - interval) && t <= to) {
            const i = Math.trunc((t - (from - interval)) / interval)
            if (inc) {
                datapoints[i][0]++
            } else {
                datapoints[i][0]--
            }
        }
    }

    getDatapoints (from, to, interval, target) { /* eslint max-statements: "off" */
        const elements = target.split('.')
        const name = elements.shift()
        const func = elements.shift()
        const filter = elements.shift() || 'default'
        const datapoints = []

        for (let t = from; t <= to; t += interval) {
            datapoints.push([0, t])
        }

        const cumulative = [[0, 0]]
        this.sources[name].db.get('sessions')
            .filter(this.filters(filter))
            .value()
            .forEach((item) => {
                const start = item.data.time_start * 1000

                if (func === 'count') {
                    this.counter(from, to, interval, start, datapoints)
                }

                if (func === 'cumulative') {
                    this.counter(from, to, interval, start, datapoints)
                    this.counter(from - interval, from - interval, from, start, cumulative)
                    if (item.data.disable) {
                        this.counter(from, to, interval, item.data.time_last * 1000, datapoints, false)
                        this.counter(from - interval, from - interval, from, item.data.time_last * 1000, cumulative, false)
                    }
                }
            })

        if (func === 'cumulative') {
            let count = cumulative[0][0]
            for (const i in datapoints) {
                if (datapoints[i].length) {
                    datapoints[i][0] += count
                    count = datapoints[i][0]
                }
            }
        }

        return datapoints
    }

    getTimeserie (from, to, interval, query) {
        const result = []
        const targets = this.getTargets(`^${query}$`)

        for (const target of targets) {
            result.push({
                target: target,
                datapoints: this.getDatapoints(from, to, interval, target)
            })
        }

        return result
    }

    getTable (from, to, interval, query) {
        const targets = this.getTargets(`^${query}$`)
        const result = {
            columns: [
                {
                    text: 'Time',
                    type: 'time'
                }
            ],
            rows: [],
            type: 'table'
        }

        for (let t = from; t <= to; t += interval) {
            result.rows.push([t])
        }

        for (const target of targets) {
            result.columns.push({
                text: target,
                type: 'number'
            })

            this.getDatapoints(from, to, interval, target)
                .forEach((item, index) => {
                    result.rows[index].push(item[0])
                })
        }

        return result
    }
}

/**
 * @param {object} obj - Test object
 * @returns {boolean} Return true if obj is Promise
 */
function isPromise (obj) {
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

module.exports = DataSources
