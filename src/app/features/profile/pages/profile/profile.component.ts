import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { combineLatest, merge, Observable, Subject, throwError } from 'rxjs';
import { UserService } from '../../../../core/auth/services/user.service';
import { Profile } from '../../models/profile.model';
import { ProfileService } from '../../services/profile.service';
import { FollowButtonComponent } from '../../components/follow-button.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.component.html',
  imports: [FollowButtonComponent, RouterLink, RouterLinkActive, RouterOutlet, FollowButtonComponent, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);

  private readonly profileSubject = new Subject<Profile>();
  private readonly profileData$: Observable<Profile> = this.route.params.pipe(
    switchMap(params => this.profileService.get(params['username'])),
    catchError(error => {
      void this.router.navigate(['/']);
      return throwError(() => error);
    }),
    shareReplay(1),
  );
  protected readonly profile$ = merge(this.profileData$, this.profileSubject.asObservable());

  protected readonly isUser$: Observable<boolean> = combineLatest([this.profile$, this.userService.currentUser]).pipe(
    map(([profile, user]) => profile.username === user?.username),
  );

  onToggleFollowing(profile: Profile) {
    this.profileSubject.next(profile);
  }
}
