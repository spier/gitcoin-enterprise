import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GithubIntegrationService } from './github-integration/github-integration.service'
import { SupportNotifierService } from './support-notifier/support-notifier.service'
import { AuthenticationMiddleware } from './authentication/authentication.middleware'
import { AuthenticationService } from './authentication/authentication.service'
import { AuthenticationController } from './authentication/authentication.controller'
import { IConfig } from './interfaces'
import { UptimeService } from './uptime/uptime.service'
import { PostgresService } from './postgres/postgres.service'
import { AuthenticationServiceDouble } from './authentication/authentication.service.double'
import { ImagesController } from './images/images.controller'
import { ImagesService } from './images/images.service'
import { Neo4jService } from './neo4j/neo4j.service'
import { LoggerService } from './logger/logger.service'
import { PersistencyService } from './persistency/persistency.service'
import * as path from 'path'
import * as fs from 'fs-sync'
const joi = require('@hapi/joi')

const config: IConfig = fs.readJSON(path.join(__dirname, '../.env.json'))

const schema = joi.object({

  port: joi.number().required(),
  backendURL: joi.string().required(),
  frontendURL: joi.string().required(),
  logLevel: joi.number().required(),
  certificateFile: joi.string().allow(''),
  certificatePrivateKeyFile: joi.string().allow(''),
  persistencyService: joi.string().required(),
  authenticationService: joi.string().required(),
  postgresPW: joi.string().required(),
  dependentOnService: joi.string().allow(''),
  telegramNotifierToken: joi.string().allow(''),
  telegramNotifierSupportChannel: joi.string().allow(''),
  oAuthProviderURL: joi.string().required(),
  gitHubOAuthClient: joi.string().required(),
  gitHubOAuthSecret: joi.string().required(),
  gitHubURL: joi.string().required(),
  gitHubTokenForPostingCommentsAndForGettingIssueData: joi.string().required(),
  gitHubPackagePublishingToken: joi.string().required(),
  proxyHostForEnterpriseGitHubInstance: joi.string().required().allow(''),
  proxyHostForEnterpriseGitHubInstancePort: joi.string().required().allow(''),

  // config: joi.string()
  //   .alphanum()
  //   .min(3)
  //   .max(30)
  //   .required()
})

const value = schema.validate(config)

if (value.error !== undefined) {
  throw new Error(value.error.details[0].message)
}

function getPersistencyService() {
  switch (config.persistencyService) {
    case 'PersistencyService': return PersistencyService
    case 'PostgresService': return PostgresService
    default: return PersistencyService
  }
}

function getAuthenticationService() {
  switch (config.authenticationService) {
    case 'AuthenticationService': return AuthenticationService
    case 'AuthenticationServiceDouble': return AuthenticationServiceDouble
    default: return AuthenticationService
  }
}

const persistencyServiceProvider = {
  provide: 'PersistencyService',
  useClass: getPersistencyService(),
}

const authenticationServiceProvider = {
  provide: 'AuthenticationService',
  useClass: getAuthenticationService(),
}
@Module({
  imports: [
    // DatabaseModule,
    // TypeOrmModule.forRoot(postgresConfig),
    // PostgresModule,
  ],
  controllers: [AppController, AuthenticationController, ImagesController],
  providers: [
    AppService,
    LoggerService,
    authenticationServiceProvider,
    GithubIntegrationService,
    SupportNotifierService,
    UptimeService,
    persistencyServiceProvider,
    ImagesService,
    Neo4jService,
  ],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude('')
      // .forRoutes({ path: '*', method: RequestMethod.ALL })
      // .forRoutes({ path: lettersRegexp, method: RequestMethod.ALL })
      .forRoutes({ path: 'post*', method: RequestMethod.ALL }, { path: 'get*', method: RequestMethod.ALL })
  }
}

    // const lettersRegexp = /^[A-Za-z]+$/
    // console.log(lettersRegexp.test('getUser')
