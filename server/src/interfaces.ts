export interface IssueInfo {
  title: string
  description: string
}

export interface ITask {
  id: string,
  taskType: ETaskType
  name: string
  description: string
  funding: number
  currency: string
  status: ETaskStatus
  funderRatedWith: number
  solutionProviderRatedWith: number
  link: string
  dueDate: string
}

export enum ETaskStatus {
  'created' = 1,
  'inProgress' = 2,
  'completed' = 3,
  'paid' = 4,
}

export enum ETaskType {
  'GitHubIssue' = 1,
  'tbd...' = 2,
}

export interface IInvitation {
  from: string
  to: string
  date: string
}

export interface IApplication {
  profileLink: string
  taskLink: string
}

export interface IEmail {
  sender: string,
  recipient: string,
  subject: string
  content: string
}
export interface IUser {
  id: string
  firstName: string
  balance: number
  link: string
}

export interface IFunding {
  id: string
  funderId: string
  taskId: string
  amount: number
}

export interface ITaskAndFunding {
  task: ITask
  funding: IFunding
}
