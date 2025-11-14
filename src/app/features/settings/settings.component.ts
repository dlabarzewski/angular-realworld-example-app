import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/auth/user.model';
import { UserService } from '../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../shared/components/list-errors.component';
import { Errors } from '../../core/models/errors.model';
import { BehaviorSubject, take, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SettingsForm {
  image: FormControl<string>;
  username: FormControl<string>;
  bio: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.component.html',
  imports: [ListErrorsComponent, ReactiveFormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly settingsForm = new FormGroup<SettingsForm>({
    image: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  private readonly errorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly errors$ = this.errorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  ngOnInit(): void {
    this.userService
      .getCurrentUser()
      .pipe(
        tap(({ user }) => this.settingsForm.patchValue(user)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  logout(): void {
    this.userService.logout();
  }

  submitForm() {
    this.isSubmittingSubject.next(true);

    this.userService
      .update(this.settingsForm.value)
      .pipe(take(1))
      .subscribe({
        next: ({ user }) => void this.router.navigate(['/profile/', user.username]),
        error: err => {
          this.errorsSubject.next(err);
          this.isSubmittingSubject.next(false);
        },
      });
  }
}
