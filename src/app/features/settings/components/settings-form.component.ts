import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from 'src/app/core/auth/user.model';

interface SettingsForm {
  readonly image: FormControl<string>;
  readonly username: FormControl<string>;
  readonly bio: FormControl<string>;
  readonly email: FormControl<string>;
  readonly password: FormControl<string>;
}

@Component({
  selector: 'app-settings-form',
  template: `
    <form [formGroup]="settingsForm" (ngSubmit)="submitForm()">
      <fieldset [disabled]="disabled">
        <fieldset class="form-group">
          <input class="form-control" type="text" placeholder="URL of profile picture" formControlName="image" />
        </fieldset>

        <fieldset class="form-group">
          <input class="form-control form-control-lg" type="text" placeholder="Username" formControlName="username" />
        </fieldset>

        <fieldset class="form-group">
          <textarea
            class="form-control form-control-lg"
            rows="8"
            placeholder="Short bio about you"
            formControlName="bio"
          >
          </textarea>
        </fieldset>

        <fieldset class="form-group">
          <input class="form-control form-control-lg" type="email" placeholder="Email" formControlName="email" />
        </fieldset>

        <fieldset class="form-group">
          <input
            class="form-control form-control-lg"
            type="password"
            placeholder="New Password"
            formControlName="password"
          />
        </fieldset>

        <button class="btn btn-lg btn-primary pull-xs-right" type="submit">Update Settings</button>
      </fieldset>
    </form>
  `,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsFormComponent {
  @Input() set user(value: User | null) {
    if (!value) return;

    this.settingsForm.patchValue(value);
  }
  @Output() submit = new EventEmitter<Partial<User>>();
  @Input() disabled: boolean = false;

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

  submitForm() {
    this.submit.emit(this.settingsForm.value);
  }
}
