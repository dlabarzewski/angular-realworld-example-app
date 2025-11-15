import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../../shared/components/list-errors.component';
import { Errors } from '../../../core/models/errors.model';
import { BehaviorSubject, catchError, EMPTY, take, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { User } from 'src/app/core/auth/user.model';
import { SettingsFormComponent } from '../components/settings-form.component';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  imports: [ListErrorsComponent, AsyncPipe, SettingsFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsPage {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  private readonly errorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly errors$ = this.errorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  protected readonly user$ = this.userService.currentUser;

  logout(): void {
    this.userService.logout();
  }

  submitForm(user: Partial<User>): void {
    this.isSubmittingSubject.next(true);

    this.userService
      .update(user)
      .pipe(
        tap(({ user }) => void this.router.navigate(['/profile/', user.username])),
        catchError(err => {
          this.errorsSubject.next(err);
          this.isSubmittingSubject.next(false);
          return EMPTY;
        }),
        take(1),
      )
      .subscribe();
  }
}
