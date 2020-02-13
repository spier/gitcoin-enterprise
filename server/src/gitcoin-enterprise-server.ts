import { NestFactory } from '@nestjs/core'
import { AppModule, config } from './app.module'
import * as cors from 'cors'
import * as path from 'path'
import * as fs from 'fs-sync'
import * as express from 'express'
import { LoggerService } from './logger/logger.service'
import { SupportNotifierService } from './support-notifier/support-notifier.service'
import { ELogLevel } from './logger/logger-interface'
const compression = require('compression')

export const pathToStaticAssets = path.join(__dirname, '../docs')

async function bootstrap() {
  const lg = new LoggerService(new SupportNotifierService())

  let app

  if (config.port !== undefined && config.port === 443) {
    const keyFile = config.certificatePrivateKeyFile
    const certFile = config.certificateFile
    const privateKey = fs.read(keyFile)
    const certificate = fs.read(certFile)
    const credentials = { key: privateKey, cert: certificate }
    app = await NestFactory.create(AppModule, { httpsOptions: credentials })
    await lg.log(ELogLevel.Info, 'starting https server')
    await  lg.log(ELogLevel.Info, typeof (app))
  } else {
    app = await NestFactory.create(AppModule)
  }

  app.useStaticAssets(pathToStaticAssets)
  app.use(cors('*'))
  app.use(compression())

  lg.log(ELogLevel.Info, 'listening soon :)')
  await app.listen(config.port)

  lg.log(ELogLevel.Info, `app is listening on port: ${config.port}`)

  if (config.port === 443) {
    ensureRedirectingFromUnsafeHostToSaveHost()
  }

}
bootstrap()

function ensureRedirectingFromUnsafeHostToSaveHost() {
  const httpForwarderAPPListeningOnUnsafePort = express()

  httpForwarderAPPListeningOnUnsafePort.get('*', (req, res) => {
    let unsafeHost = req.headers.host
    if (unsafeHost.indexOf('http://') === -1) {
      unsafeHost = `http://${unsafeHost}`
    } else {
      unsafeHost = req.headers.host
    }

    const saveHost = req.headers.host.replace('http://', 'https://')

    res.send(`This page is only available via secure <a href="https:${saveHost}">https:${saveHost}</a>`)
  })

  httpForwarderAPPListeningOnUnsafePort.listen(80)
}
