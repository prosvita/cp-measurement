'use strict'

const fs = require('graceful-fs')
const AdapterBase = require('lowdb/adapters/Base')

class SafeFileSync extends AdapterBase {
    read () {
        if (fs.existsSync(this.source)) {
            try {
                const data = fs.readFileSync(this.source, 'utf-8').trim()

                return data ? this.deserialize(data) : this.defaultValue
            } catch (error) {
                if (error instanceof SyntaxError) {
                    error.message = `Malformed JSON in file: ${this.source}\n${error.message}`
                }
                throw error
            }
        }

        return this.defaultValue
    }

    /* eslint class-methods-use-this: "off" */
    /* eslint no-empty-function: "off" */
    write () {}
}

module.exports = SafeFileSync
