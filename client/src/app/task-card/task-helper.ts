import {  ETaskStatus } from '../backend.service'
import { ETaskType, ITask } from '../interfaces'

export class TaskHelper {
  public static getInitialTask(): ITask {
    return {
      link: 'https://github.com/gitcoin-enterprise/gitcoin-enterprise/issues/16',
      taskType: ETaskType.GitHubIssue,
      funding: 0,
      title: '',
      description: '',
      status: ETaskStatus.created,
      funderRatedWith: 5,
      solutionProviderRatedWith: 5,
      dueDate: ''
    }
  }

}
