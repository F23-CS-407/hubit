import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FileUploadService } from '../../services/file-upload.service';
@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.css'],
})
export class IntroComponent {
  // Declaraions
  private backend_addr: string = '/api';

  loginForm: FormGroup;
  registerForm: FormGroup;

  visible: boolean = false;
  hasUpper = false;
  hasLower = false;
  hasNumber = false;
  hasMinLength = false;
  match = false;

  showLoginForm = true;
  errorMessage: string = ''; // To hold error messages
  self_id: string = '';
  self_username?: string = undefined;
  logged_in: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
  ) {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      loginKey: ['', Validators.required],
    });

    this.registerForm = this.fb.group(
      {
        newUser: ['', Validators.required],
        newKey: ['', [Validators.required, this.keyValidator()]],
        keyMatch: ['', Validators.required],
      },
      { validators: this.keyMatchValidator() },
    );
  }

  // VALIDATOR --> key requirements
  keyValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasMinLength = value.length >= 8;

      if (hasUppercase && hasLowercase && hasNumber && hasMinLength) {
        return null;
      }

      return { passwordInvalid: true };
    };
  }

  // VALIDATOR --> key match
  keyMatchValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const password = group.get('newKey')?.value;
      const confirmPassword = group.get('keyMatch')?.value;

      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordsMismatch: true };
      }
      return null;
    };
  }

  // PASSWORD VALIDATION
  onPasswordChange() {
    const value = this.registerForm.get('newKey')?.value;
    this.hasUpper = /[A-Z]/.test(value);
    this.hasLower = /[a-z]/.test(value);
    this.hasNumber = /\d/.test(value);
    this.hasMinLength = value.length >= 8;
    this.match =
      this.registerForm.get('newKey')?.value ===
      this.registerForm.get('keyMatch')?.value;
  }

  toggleVisible() {
    this.visible = !this.visible;
  }

  // FORMS DISPLAY

  showRegistrationForm() {
    this.showLoginForm = false;
  }

  showLoginFormAgain() {
    this.showLoginForm = true;
  }

  // Backend Integration

  loginUser(event: Event) {
    event.preventDefault();
    const user = {
      username: this.loginForm.get('login')?.value,
      password: this.loginForm.get('loginKey')?.value,
    };
    const options = { withCredentials: true };

    this.http.post(this.backend_addr + '/login', user, options).subscribe(
      (response: any) => {
        console.log('Login successful:', response);
        localStorage.setItem('token', response.token);
        this.router.navigate(['/hubit']); // Redirect to 'hubit' route
      },
      (error: any) => {
        console.error('Login failed:', error);
        this.errorMessage =
          'Login failed. Please check your credentials and try again.'; // Set error message
      },
    );
  }

  registerUser(event: Event) {
    event.preventDefault();

    const user = {
      username: this.registerForm.get('newUser')?.value,
      password: this.registerForm.get('newKey')?.value,
    };
    const options = { withCredentials: true };

    this.http
      .post<any>(this.backend_addr + '/create_user', user, options)
      .subscribe({
        next: (create_response) => {
          // Log the user in
          this.http
            .post<any>(this.backend_addr + '/login', user, options)
            .subscribe({
              next: (login_response) => {
                console.log('login successful');
                this.setProfilePic(login_response._id);
                this.router.navigate(['/hubit']); // Redirect to 'hubit' route
              },
              error: (error) => {
                console.log(
                  "Created account, but couldn't log in. This should never happen.",
                );
                this.errorMessage =
                  'Account created, but login failed. Please try logging in.'; // Set error message
              },
            });
        },
        error: (error) => {
          console.log('Create Account Error: ' + error.toString());
          this.errorMessage = 'Account creation failed. Please try again.'; // Set error message
        },
      });
  }

  setProfilePic(userId: string) {
    // Fetch the default profile as a blob from your assets
    fetch('assets/default-profile.png')
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'default-profile.png', { type: 'image/png' });
        this.fileUploadService.uploadProfilePic(file).subscribe({
          next: (response) => {
            console.log('Default profile picture set successfully', response);
          },
          error: (error) => {
            console.error('Failed to set default profile picture', error);
          }
        }); 
      });
  }
}
