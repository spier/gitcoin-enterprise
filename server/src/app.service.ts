import { Injectable } from '@nestjs/common'

import { ITask, IFunding, ITaskAndFunding, IApplication, IAuthenticationData, IBountyReceiver } from './interfaces'
import { LoggerService } from './logger/logger.service'
import { LedgerConnector } from './ledger-connector/ledger-connector-file-system.service'
import { GithubIntegrationService } from './github-integration/github-integration.service'
import { ILedgerEntry } from './ledger-connector/ledger-connector.interface'
import { ELogLevel } from './logger/logger-interface'
import { AuthenticationService } from './authentication/authentication.service'
import { config } from './app.module'
import { PersistencyService } from './persistency/persistency.service'

@Injectable()
export class AppService {
  public getLoginFromToken(token: string) {
    return this.getAuthenticationData(token).login
  }

  // Interface would be cool for LedgerConnector... The reason why I could not use interface polymorphism here is interfaces are design-time only in the current context :)
  public constructor(private readonly lg: LoggerService, private readonly ledgerConnector: LedgerConnector, private readonly gitHubIntegration: GithubIntegrationService, private readonly authenticationService: AuthenticationService, private readonly persistencyService: PersistencyService) {
  }

  public getAuthenticationData(michaelsfriendskey: string): IAuthenticationData {
    return this.authenticationService.getAuthenticationDataFromMainMemory(michaelsfriendskey)
  }

  public async postSolutionApproach(application: IApplication, userAccessToken: string): Promise<void> {
    const authenticationData = await this.authenticationService.getAuthenticationDataFromMainMemory(userAccessToken)
    if (authenticationData === undefined) {
      throw new Error('Authentication data not found for this token')
    }
    this.gitHubIntegration.postCommentAboutApplication(application)
  }

  public getGitHubToken(): string {
    return config.gitHubTokenForPostingCommentsAndForGettingIssueData
  }

  public saveFundedTasks(fundedTasks: ITask[]): void {
    this.persistencyService.saveFundedTasks(fundedTasks)
  }

  public authorizeInstallation(): void {
    const userId = '123'
    this.lg.log(ELogLevel.Info, `User: ${userId} authorized installation.`)
  }

  public getFundedTasks(): ITask[] {
    return this.persistencyService.getFundedTasks()
  }

  public getLedgerEntries(): ILedgerEntry[] {
    return this.ledgerConnector.getLedgerEntries()
  }

  public async saveFunding(taskAndFunding: ITaskAndFunding, userAccessToken: string): Promise<ILedgerEntry> {

    const authenticationData = await this.authenticationService.getAuthenticationDataFromMainMemory(userAccessToken)
    if (authenticationData === undefined) {
      throw new Error(`I could not find authentication Data for this token: ${userAccessToken}`)
    }

    const newLedgerEntry: ILedgerEntry = this.createLedgerEntryFromFunding(taskAndFunding.funding)

    const tasks = this.persistencyService.getFundedTasks()
    const existingTask = tasks.filter((entry: ITask) => entry.link === taskAndFunding.task.link)[0]

    let task: ITask
    if (existingTask === undefined) {
      task = taskAndFunding.task
    } else {
      task = existingTask
      task.funding = task.funding + taskAndFunding.funding.amount
      const indexOfExistingTasks = tasks.indexOf(existingTask)
      tasks.splice(indexOfExistingTasks, 1)
    }

    tasks.push(task)

    this.persistencyService.saveFundedTasks(tasks)

    this.gitHubIntegration.postCommentAboutSuccessfullFunding(taskAndFunding.task.link, taskAndFunding.funding)
    this.lg.log(ELogLevel.Notification, `I received a funding of ${taskAndFunding.funding.amount} EIC for the following task: ${task.link}`)
    return newLedgerEntry

  }


  public async postTransfer(receivers: IBountyReceiver[], userAccessToken: string): Promise<ILedgerEntry[]> {

    const authenticationData = await this.authenticationService.getAuthenticationDataFromMainMemory(userAccessToken)
    if (authenticationData === undefined) {
      throw new Error(`I could not find authentication Data for this token: ${userAccessToken}`)
    }

    const newLedgerEntries: ILedgerEntry[] = this.createLedgerEntriesFromBountyPayment(receivers)
    this.lg.log(ELogLevel.Info, `I created the following ledger entries: ${JSON.stringify(newLedgerEntries)} `)

    // this.gitHubIntegration.postCommentAboutSuccessfullTransfer(taskAndFunding.task.link, taskAndFunding.funding)
    // this.lg.log(ELogLevel.Notification, `I received a funding of ${taskAndFunding.funding.amount} EIC for the following task: ${task.link}`)
    return newLedgerEntries

  }

  private createLedgerEntryFromFunding(funding: IFunding): ILedgerEntry {
    const entries: ILedgerEntry[] = this.ledgerConnector.getLedgerEntries()
    let entry: ILedgerEntry
    entry = {
      id: `tr-${Date.now().toString()}`,
      date: new Date().toISOString(),
      amount: funding.amount,
      sender: funding.funderId,
      receiver: funding.taskLink,
    }

    entries.push(entry)

    this.ledgerConnector.saveLedgerEntries(entries)

    return entry
  }

  private createLedgerEntriesFromBountyPayment(receivers: IBountyReceiver[]): ILedgerEntry[] {
    let entry: ILedgerEntry
    const newEntries: ILedgerEntry[] = []
    for (const receiver of receivers) {
      entry = {
        id: `tr-${Date.now().toString()}`,
        date: new Date().toISOString(),
        amount: receiver.amount,
        sender: receiver.bountyForTaskLink,
        receiver: receiver.login
      }
      newEntries.push(entry)
    }

    const entries: ILedgerEntry[] = this.ledgerConnector.getLedgerEntries()
    entries.push(entry)
    this.ledgerConnector.saveLedgerEntries(entries)

    return newEntries
  }

}
