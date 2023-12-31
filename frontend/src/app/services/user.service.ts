import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { UserInterface } from '../interfaces/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public userSubject = new BehaviorSubject<UserInterface>({} as UserInterface);
  public user = this.userSubject.asObservable();
  private backend_addr: string = '/api';
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading = this.loadingSubject.asObservable();
  private savedPostsSubject = new BehaviorSubject<string[]>([]);
  public savedPosts = this.savedPostsSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  fetchUserProfile(): void {
    this.loadingSubject.next(true); // Indicate that loading has started
    this.http
      .get<UserInterface>(`${this.backend_addr}/user_info`, {
        withCredentials: true,
      })
      .subscribe({
        next: (userData) => {
          if (userData) {
            this.updateUser(userData);
          } else {
            this.userSubject.next({} as UserInterface);
          }
          this.loadingSubject.next(false); // Indicate that loading has finished
        },
        error: (error) => {
          console.error('Error fetching user profile:', error);
          this.userSubject.next({} as UserInterface);
          this.loadingSubject.next(false); // Indicate that loading has finished
        },
      });
  }

  updateUser(userData: Partial<UserInterface>): void {
    const currentUserData = this.userSubject.getValue();
    const updatedUserData = { ...currentUserData, ...userData };
    this.userSubject.next(updatedUserData);
  }

  logoutUser(): void {
    this.http
      .delete(`${this.backend_addr}/logout`)
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (confirmation) => {
          this.userSubject.next({} as UserInterface); // Reset user
          console.log(confirmation);
          this.router.navigate(['/intro']);
        },
        error: (error) => console.error('Logout failed:', error),
      });
  }

  changeUsername(newUsername: string): void {
    console.log(newUsername);
    this.http
      .post<UserInterface>(`${this.backend_addr}/change_username`, {
        new_username: newUsername,
      })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (updatedUser) => this.updateUser(updatedUser),
        error: (error) => console.error('Change username failed:', error),
      });
  }

  changeDescription(newDescription: string): void {
    this.http
      .post<UserInterface>(`${this.backend_addr}/change_description`, {
        new_description: newDescription,
      })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (updatedUser) => this.updateUser(updatedUser),
        error: (error) => console.error('Change description failed:', error),
      });
  }

  changePassword(newPassword: string, oldPassword: string): void {
    this.http
      .post<UserInterface>(`${this.backend_addr}/change_password`, {
        new_password: newPassword,
        old_password: oldPassword,
      })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (updatedUser) => this.updateUser(updatedUser),
        error: (error) => console.error('Change password failed:', error),
      });
  }

  createPost(content: string, tags: string[], communityId: string, media?: string): Observable<any> {
    const postBody = {
      post: {
        content: content,
        tags: tags,
        ...(media && { media: media }), // Include media only if it's provided
      },
      community: communityId,
    };

    const options = { withCredentials: true };
    return this.http.post<any>(`${this.backend_addr}/create_post`, postBody, options).pipe(
      catchError(this.handleError)
    );
  }


  deleteUser(password: string): void {
    this.http
      .delete(`${this.backend_addr}/delete_user`, { body: { password } })
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (confirmation) => {
          this.userSubject.next({} as UserInterface); // Reset user
          console.log(confirmation);
          this.router.navigate(['/intro']);
        },
        error: (error) => console.error('Delete account failed:', error),
      });
  }

  savePost(postId: string): Observable<any> {
    const body = { postId: postId };
    const options = { withCredentials: true };
    return this.http.post(`${this.backend_addr}/user/save_post`, body, options)
      .pipe(
        catchError(this.handleError),
        tap(() => {
          // Update the saved posts after successful API call
          this.updateSavedPosts([...this.savedPostsSubject.getValue(), postId]);
        })
      );
  }

  unsavePost(postId: string): Observable<any> {
    const body = { postId: postId };
    const options = { withCredentials: true };
    return this.http.post(`${this.backend_addr}/user/unsave_post`, body, options)
      .pipe(
        catchError(this.handleError),
        tap(() => {
          // Update the saved posts after successful API call
          const updatedSavedPosts = this.savedPostsSubject.getValue().filter(id => id !== postId);
          this.updateSavedPosts(updatedSavedPosts);
        })
      );
  }

  updateSavedPosts(savedPosts: string[]): void {
    this.savedPostsSubject.next(savedPosts);
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`,
      );
    }
    // Return an observable with a user-facing error message.
    return throwError('Something bad happened; please try again later.');
  }
}
