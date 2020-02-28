import { Injectable } from '@nestjs/common'
import { IFunding, IApplication, IAuthenticationData, IIssueInfo, ITask } from '../interfaces'
import { LoggerService } from '../logger/logger.service'
import { config } from '../app.module'
import * as moment from 'moment'
import { Helper } from '../helpers/helper'
import { ELogLevel } from '../logger/logger-interface'
const uuidv1 = require('uuidv1')
// tslint:disable-next-line: match-default-export-name
import axios, { AxiosInstance } from 'axios'
import * as tunnel from 'tunnel'
import { PersistencyService } from '../persistency/persistency.service'
import { CommentProvider } from './comment-provider'

@Injectable()
export class GithubIntegrationService {
    private lastGetIssueRequest = moment()
    private lastPostCommentRequest = moment()
    private readonly agent
    private readonly axiosClient: AxiosInstance

    public constructor(private readonly lg: LoggerService, private readonly persistencyService: PersistencyService) {
        if (config.gitHubURL === 'https://github.com') {
            this.axiosClient = axios.create({
                baseURL: config.gitHubURL,
                proxy: false,
            })
        } else {
            this.agent = tunnel.httpsOverHttp({
                proxy: {
                    host: config.proxyHostForEnterpriseGitHubInstance,
                    port: config.proxyHostForEnterpriseGitHubInstancePort,
                },
            })
            this.axiosClient = axios.create({
                baseURL: config.gitHubURL,
                httpsAgent: this.agent,
                proxy: false, // to be save regarding autodetection of environment variables...
            })
        }
    }

    public async getAuthenticationDataFromGitHub(token: string): Promise<IAuthenticationData> {
        let user

        try {
            const getURLToGetUser = (config.gitHubURL === 'https://github.com') ?
                `https://api.github.com/user?access_token=${token}` :
                `${config.gitHubURL}/api/v3/user?access_token=${token}`
            await this.lg.log(ELogLevel.Info, `calling to: ${getURLToGetUser}`)
            user = (await this.axiosClient.get(getURLToGetUser)).data
            await this.lg.log(ELogLevel.Info, JSON.stringify(`user: ${user}`))
            const authenticationData: IAuthenticationData = {
                avatarURL: user.avatar_url,
                login: user.login,
                token: uuidv1().replace(/-/g, '').substr(0, 10),
            }

            return authenticationData

        } catch (error) {
            const errorMessage = `The following error occurred while retrieving Login: ${error.message} for ${token}` // shall be deleted as soon as test is successful
            void this.lg.log(ELogLevel.Error, errorMessage)
            throw new Error(errorMessage)
        }
    }

    public async getIssue(org: any, repo: any, issueId: any): Promise<IIssueInfo> {

        const seconds: moment.unitOfTime.DurationConstructor = 'seconds'

        if (!Helper.isItLongerAgoThan(2, seconds, this.lastGetIssueRequest)) {
            const errorMessage = '2 getIssue requests within 2 seconds seems unlikely in demo phase - protecting the backends'
            await this.lg.log(ELogLevel.Error, errorMessage)
            throw new Error(errorMessage)
        }

        this.lastGetIssueRequest = moment()
        await this.lg.log(ELogLevel.Info, `getting Issue data for owner: ${org}, repo: ${repo}, issueId: ${issueId}`)
        // tslint:disable-next-line: no-object-literal-type-assertion
        const issueInfo = {} as IIssueInfo
        try {
            const getURLToGetIssueData = (config.gitHubURL === 'https://github.com') ?
                `https://api.github.com/repos/${org}/${repo}/issues/${issueId}` :
                `${config.gitHubURL}/api/v3/repos/${org}/${repo}/issues/${issueId}`
            const issueData = (await this.axiosClient.get(getURLToGetIssueData)).data
            void this.lg.log(ELogLevel.Info, JSON.stringify(issueData))
            issueInfo.title = issueData.title
            issueInfo.description = issueData.body
        } catch (error) {
            await this.lg.log(ELogLevel.Error, `the github call to get the issue failed ${error}`)
            issueInfo.title = 'Just a demo Title'
            issueInfo.description = 'Just a demo Description'
        }

        return issueInfo
    }

    public async postCommentAboutSuccessfullFunding(linkToIssue: string, funding: IFunding): Promise<void> {

        const seconds: moment.unitOfTime.DurationConstructor = 'seconds'

        if (!Helper.isItLongerAgoThan(2, seconds, this.lastPostCommentRequest)) {
            const errorMessage = '2 postComment requests within 2 seconds seems unlikely in demo phase - protecting the backends'
            await this.lg.log(ELogLevel.Error, errorMessage)
            throw new Error(errorMessage)
        }
        const totalAmount =
            this.persistencyService.getFundedTasks().filter((fundedTask: ITask) => fundedTask.link === funding.taskLink)[0].funding

        const body = CommentProvider.getCommentAboutSuccessfullFunding(totalAmount, funding)

        const owner = linkToIssue.split('/')[3]
        const repoName = linkToIssue.split('/')[4]
        const issueNo = linkToIssue.split('/')[6]
        this.lastPostCommentRequest = moment()
        try {
            const uRLToPostComment = (config.gitHubURL === 'https://github.com') ?
                `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNo}/comments?access_token=${config.gitHubTokenForPostingCommentsAndForGettingIssueData}` :
                `${config.gitHubURL}/api/v3/repos/${owner}/${repoName}/issues/${issueNo}/comments?access_token=${config.gitHubTokenForPostingCommentsAndForGettingIssueData}`

            void this.lg.log(ELogLevel.Info, `posting to: ${uRLToPostComment}`)
            const postingResult = (await this.axiosClient.post(uRLToPostComment, { body }))
            void this.lg.log(ELogLevel.Info, `posting a comment and getting: ${JSON.stringify(postingResult)}`)

        } catch (error) {
            await this.lg.log(ELogLevel.Error, `postCommentAboutSuccessfullFunding the github call to create a comment for  the issue failed ${error}`)

        }

        await this.lg.log(ELogLevel.Info, linkToIssue)
        await this.lg.log(ELogLevel.Info, JSON.stringify(funding))
    }

    public async postCommentAboutSuccessfullTransfer(linkToIssue: string, funding: IFunding): Promise<void> {

        const seconds: moment.unitOfTime.DurationConstructor = 'seconds'

        if (!Helper.isItLongerAgoThan(2, seconds, this.lastPostCommentRequest)) {
            const errorMessage = '2 postComment requests within 2 seconds seems unlikely in demo phase - protecting the backends'
            await this.lg.log(ELogLevel.Error, errorMessage)
            throw new Error(errorMessage)
        }

        const body = CommentProvider.getCommentAboutSuccessfullTransfer(funding)

        const owner = linkToIssue.split('/')[3]
        const repoName = linkToIssue.split('/')[4]
        const issueNo = linkToIssue.split('/')[6]
        this.lastPostCommentRequest = moment()
        try {
            const uRLToPostComment = (config.gitHubURL === 'https://github.com') ?
                `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNo}/comments?access_token=${config.gitHubTokenForPostingCommentsAndForGettingIssueData}` :
                `${config.gitHubURL}/api/v3/repos/${owner}/${repoName}/issues/${issueNo}/comments?access_token=${config.gitHubTokenForPostingCommentsAndForGettingIssueData}`
            const postingResult = (await this.axiosClient.post(uRLToPostComment, { body }))

            void this.lg.log(ELogLevel.Info, JSON.stringify(`posting an issue and getting: ${String(postingResult)}`))

        } catch (error) {
            await this.lg.log(ELogLevel.Error, `postCommentAboutSuccessfullTransfer the github call to create a comment for  the issue failed ${error}`)

        }

        await this.lg.log(ELogLevel.Info, linkToIssue)
        await this.lg.log(ELogLevel.Info, JSON.stringify(funding))
    }

    public async postCommentAboutApplication(application: IApplication): Promise<void> {

        const seconds: moment.unitOfTime.DurationConstructor = 'seconds'

        if (!Helper.isItLongerAgoThan(2, seconds, this.lastPostCommentRequest)) {
            const errorMessage = '2 postComment requests within 2 seconds seems unlikely in demo phase - protecting the backends'
            await this.lg.log(ELogLevel.Error, errorMessage)
            throw new Error(errorMessage)
        }

        const body = CommentProvider.getCommentAboutSolutionApproach(application)

        const owner = application.taskLink.split('/')[3]
        const repoName = application.taskLink.split('/')[4]
        const issueNo = application.taskLink.split('/')[6]
        try {
            const uRLToPostComment = (config.gitHubURL === 'https://github.com') ?
                `https://api.github.com/repos/${owner}/${repoName}/issues/${issueNo}/comments?access_token=${config.gitHubTokenForPostingCommentsAndForGettingIssueData}` :
                `${config.gitHubURL}/api/v3/repos/${owner}/${repoName}/issues/${issueNo}/comments?access_token=${config.gitHubTokenForPostingCommentsAndForGettingIssueData}`
            const postingResult = (await this.axiosClient.post(uRLToPostComment, { body }))

            void this.lg.log(ELogLevel.Info, JSON.stringify(`posting an issue and getting: ${String(postingResult)}`))

        } catch (error) {
            await this.lg.log(ELogLevel.Error, `postCommentAboutApplication the github call to create a comment for  the issue failed ${error}`)

        }
        await this.lg.log(ELogLevel.Info, application.profileLink)
        await this.lg.log(ELogLevel.Info, application.taskLink)
    }

}
