import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Validators, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListErrorsComponent } from '../../shared/components/list-errors.component';
import { Errors } from '../models/errors.model';
import { UserService } from './services/user.service';
import { BehaviorSubject, map, Observable, switchMap, take, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AuthType } from './statics/auth-type.enum';

interface AuthForm {
  email: FormControl<string>;
  password: FormControl<string>;
  username?: FormControl<string>;
}

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth.component.html',
  imports: [RouterLink, ListErrorsComponent, ReactiveFormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  protected readonly AuthType = AuthType;

  protected readonly authType$: Observable<string> = this.route.data.pipe(
    map(data => data['authType']),
    tap(authType => {
      this.authForm.removeControl('username');

      if (authType === AuthType.REGISTER) {
        this.authForm.addControl(
          'username',
          new FormControl('', {
            validators: [Validators.required],
            nonNullable: true,
          }),
        );
      }
    }),
  );

  private readonly errorsSubject = new BehaviorSubject<Errors | null>(null);
  protected readonly errors$ = this.errorsSubject.asObservable();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  protected readonly authForm: FormGroup<AuthForm> = new FormGroup<AuthForm>({
    email: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  submitForm(): void {
    this.isSubmittingSubject.next(true);
    this.errorsSubject.next(null);

    const observable = this.authType$.pipe(
      switchMap(authType =>
        authType === AuthType.LOGIN
          ? this.userService.login(this.authForm.value as { email: string; password: string })
          : this.userService.register(
              this.authForm.value as {
                email: string;
                password: string;
                username: string;
              },
            ),
      ),
    );

    observable.pipe(take(1)).subscribe({
      next: () => void this.router.navigate(['/']),
      error: err => {
        this.errorsSubject.next(err);
        this.isSubmittingSubject.next(false);
      },
    });
  }
}
