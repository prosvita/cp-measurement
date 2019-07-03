'use strict'

const conf = require('./lib/config')

const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const DataSources = require('./lib/data-sources')
const Controller = require('./lib/controller')
const logger = require('loglevel') // https://github.com/pimterry/loglevel
    .getLogger(conf.appName)

logger.setLevel(conf.logLevel)

const app = new Koa()
const router = new Router()
const ds = new DataSources(conf.dataSourceTargets)
const c = new Controller(ds)

router
    .get('/', c.getPingHandle())
    .post('/search', c.postSearchHandle())
    .post('/query', c.postQueryHandle())
    .post('/annotations', c.postDumbHandle())
    .post('/tag-keys', c.postDumbHandle())
    .post('/tag-values', c.postDumbHandle())

app.use(bodyParser())
    .use(async (ctx, next) => {
        logger.debug(ctx.request.method, ctx.request.url, JSON.stringify(ctx.request.query), ctx.request.body)
        await next() /* eslint callback-return: "off" */
    })
    .use(router.middleware())
    .listen(parseInt(conf.port, 10),
        () => logger.info(`Start 0.0.0.0:${conf.port}`, '[', router.stack.map((i) => `"${i.methods.join(',')} ${i.path}"`).join(', '), ']'))
