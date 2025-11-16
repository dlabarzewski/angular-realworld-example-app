import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, EMPTY, of } from 'rxjs';

import { JwtService } from './jwt.service';
import { map, distinctUntilChanged, tap, shareReplay, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { User } from '../user.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public readonly currentUser = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

  public readonly isAuthenticated = this.currentUser.pipe(map(user => !!user));

  constructor(
    private readonly http: HttpClient,
    private readonly jwtService: JwtService,
    private readonly router: Router,
  ) {}

  login(credentials: { email: string; password: string }): Observable<{ user: User }> {
    return this.http
      .post<{ user: User }>('/users/login', { user: credentials })
      .pipe(tap(({ user }) => this.setAuth(user)));
  }

  register(credentials: { username: string; email: string; password: string }): Observable<{ user: User }> {
    return this.http.post<{ user: User }>('/users', { user: credentials }).pipe(tap(({ user }) => this.setAuth(user)));
  }

  logout(): void {
    this.purgeAuth();
    void this.router.navigate(['/']);
  }

  getCurrentUser(): Observable<{ user: User } | null> {
    return this.http.get<{ user: User }>('/user').pipe(
      tap(({ user }) => this.setAuth(user)),
      catchError(() => {
        this.purgeAuth();
        return of(null);
      }),
      shareReplay(1),
    );
  }

  update(user: Partial<User>): Observable<{ user: User }> {
    return this.http.put<{ user: User }>('/user', { user }).pipe(
      tap(({ user }) => {
        this.currentUserSubject.next(user);
      }),
    );
  }

  setAuth(user: User): void {
    this.jwtService.saveToken(user.token);
    this.currentUserSubject.next(user);
  }

  purgeAuth(): void {
    this.jwtService.destroyToken();
    this.currentUserSubject.next(null);
  }
}
