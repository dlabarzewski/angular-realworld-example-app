import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';
import { AsyncPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-follow-button',
  template: `
    <button
      class="btn btn-sm action-btn"
      [ngClass]="{
        disabled: isSubmitting$ | async,
        'btn-outline-secondary': !profile.following,
        'btn-secondary': profile.following,
      }"
      (click)="toggleFollowing()"
    >
      <i class="ion-plus-round"></i>
      &nbsp;
      {{ profile.following ? 'Unfollow' : 'Follow' }} {{ profile.username }}
    </button>
  `,
  imports: [NgClass, AsyncPipe],
})
export class FollowButtonComponent {
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  @Input() profile!: Profile;
  @Output() toggle = new EventEmitter<Profile>();

  private readonly isSubmittingSubject = new BehaviorSubject<boolean>(false);
  protected readonly isSubmitting$ = this.isSubmittingSubject.asObservable();

  toggleFollowing(): void {
    this.isSubmittingSubject.next(true);

    this.userService.isAuthenticated
      .pipe(
        switchMap((isAuthenticated: boolean) => {
          if (!isAuthenticated) {
            void this.router.navigate(['/login']);
            return EMPTY;
          }

          if (!this.profile.following) {
            return this.profileService.follow(this.profile.username);
          } else {
            return this.profileService.unfollow(this.profile.username);
          }
        }),
        take(1),
      )
      .subscribe({
        next: profile => {
          this.isSubmittingSubject.next(false);
          this.toggle.emit(profile);
        },
        error: () => this.isSubmittingSubject.next(false),
      });
  }
}
