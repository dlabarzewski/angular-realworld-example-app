import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/auth/user.model';
import { UserService } from '../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../shared/components/list-errors.component';
import { Errors } from '../../core/models/errors.model';
import { take } from 'rxjs';

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
  imports: [ListErrorsComponent, ReactiveFormsModule],
})
export default class SettingsComponent implements OnInit {
  user!: User;
  settingsForm = new FormGroup<SettingsForm>({
    image: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
  errors: Errors | null = null;
  isSubmitting = false;

  constructor(
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    this.settingsForm.patchValue(this.userService.getCurrentUser() as Partial<User>);
  }

  logout(): void {
    this.userService.logout();
  }

  submitForm() {
    this.isSubmitting = true;

    this.userService
      .update(this.settingsForm.value)
      .pipe(take(1))
      .subscribe({
        next: ({ user }) => void this.router.navigate(['/profile/', user.username]),
        error: err => {
          this.errors = err;
          this.isSubmitting = false;
        },
      });
  }
}
