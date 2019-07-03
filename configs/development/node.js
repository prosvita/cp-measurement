module.exports = {
    appName: process.env.APP_NAME || 'cp-measurement',
    port: process.env.PORT || 8080,
    dataSourceTargets: [
        {
            name: 'telegram',
            file: './db/tg-session.json'
        },
        {
            name: 'viber',
            file: './db/tg-session.json'
        }
    ],
    logLevel: process.env.LOG_LEVEL || 'debug'
}
