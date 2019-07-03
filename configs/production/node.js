module.exports = {
    appName: process.env.APP_NAME || 'cp-measurement',
    port: process.env.PORT || 8080,
    dataSourceTargets: [
        {
            name: 'telegram',
            file: './db/telegram-session.json'
        },
        {
            name: 'viber',
            file: './db/viber-session.json'
        }
    ],
    logLevel: process.env.LOG_LEVEL || 'info'
}
