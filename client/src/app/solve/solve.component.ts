import { Component, OnInit } from '@angular/core'
import { BackendService, ITask } from '../backend.service'


@Component({
  selector: 'app-solve',
  templateUrl: './solve.component.html',
  styleUrls: ['./solve.component.css', '../app.component.css']
})
export class SolveComponent implements OnInit {

  public task: ITask
  public taskOfInterest: ITask
  public fundedTasks: ITask[] = []
  public filteredTasks: ITask[] = []
  public searchTerm = ''

  public constructor(private readonly backendService: BackendService) { }

  public ngOnInit(): void {
    this.fundedTasks = this.backendService.getFundedTasks()
    this.filteredTasks = this.fundedTasks
  }

  public searchTask() {
    this.filteredTasks = this.fundedTasks.filter((entry: ITask) => {
      if (entry.name.toLowerCase().indexOf(this.searchTerm.toLowerCase()) !== -1) {
        return true
      } else {
        return false
      }
    })
  }

  public onTaskClicked(taskOfInterest: ITask) {
    this.taskOfInterest = taskOfInterest
  }

  public backToOverview() {
    delete this.taskOfInterest
  }

}
