import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Errors } from '../../core/models/errors.model';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-list-errors',
  templateUrl: './list-errors.component.html',
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListErrorsComponent {
  private readonly errorListSubject = new BehaviorSubject<string[]>([]);
  protected readonly errorList$ = this.errorListSubject.asObservable();

  @Input() set errors(errorList: Errors | null) {
    this.errorListSubject.next(
      errorList ? Object.keys(errorList.errors || {}).map(key => `${key} ${errorList.errors[key]}`) : [],
    );
  }
}
