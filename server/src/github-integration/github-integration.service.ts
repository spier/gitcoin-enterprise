import { Injectable } from '@nestjs/common'
import { IFunding, IssueInfo } from '../interfaces'
import { ELogLevel, LoggerService } from '../logger/logger.service'
import { config } from '../app.module'
import * as fs from 'fs-sync'
import * as path from 'path'

const { Octokit } = require('@octokit/rest')

@Injectable()
export class GithubIntegrationService {
    private octokit = new Octokit({
        auth: config.token,
    })

    public constructor(private readonly loggerService: LoggerService) { }

    public async getIssue(org: any, repo: any, issueId: any): Promise<IssueInfo> {
        this.loggerService.log(ELogLevel.Info, `getting Issue data for owner: ${org}, repo: ${repo}, issueId: ${issueId}`)
        const issueInfo = {} as IssueInfo
        try {
            const response = await this.octokit.issues.get({
                owner: org,
                repo,
                issue_number: issueId,
            })
            issueInfo.title = response.data.title
            issueInfo.description = response.data.body
        } catch (error) {
            this.loggerService.log(ELogLevel.Error, `the github call to get the issue failed ${error}`)
            issueInfo.title = 'Just a demo Title'
            issueInfo.description = 'Just a demo Description'
        }

        return issueInfo
    }

    public async postCommentAboutSuccessfullFunding(linkToIssue: string, funding: IFunding) {
        const templateFileId = path.join(__dirname, './comment-on-funding.md')
        const body = fs.read(templateFileId).toString().replace('{{{amount}}}', funding.amount)

        const owner = linkToIssue.split('/')[3]
        const repoName = linkToIssue.split('/')[4]
        const issueNo = linkToIssue.split('/')[6]

        try {
            await this.octokit.issues.createComment({
                owner,
                repo: repoName,
                issue_number: issueNo,
                body,
            })

        } catch (error) {
            this.loggerService.log(ELogLevel.Error, `the github call to create a comment for  the issue failed ${error}`)

        }

        this.loggerService.log(ELogLevel.Info, linkToIssue)
        this.loggerService.log(ELogLevel.Info, JSON.stringify(funding))
    }

    public async postCommentAboutApplication(profileLink: string, taskLink: string, plan: string) {
        const templateFileId = path.join(__dirname, './comment-on-application.md')
        const body = fs.read(templateFileId).toString().replace('{{{applicant}}}', profileLink).replace('{{{plan}}}', plan)

        const owner = taskLink.split('/')[3]
        const repoName = taskLink.split('/')[4]
        const issueNo = taskLink.split('/')[6]
        try {
            await this.octokit.issues.createComment({
                owner,
                repo: repoName,
                issue_number: issueNo,
                body,
            })

        } catch (error) {
            this.loggerService.log(ELogLevel.Error, `the github call to create a comment for  the issue failed ${error}`)

        }
        this.loggerService.log(ELogLevel.Info, profileLink)
        this.loggerService.log(ELogLevel.Info, taskLink)
    }
}