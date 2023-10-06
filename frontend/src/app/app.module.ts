import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

// For Angular Material Library - https://material.angular.io/components/categories
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';         // Here is the component being imported
import { SignupComponent } from './signup/signup.component';
import { ProfileComponent } from './profile/profile.component';
import { PostComponent } from './post/post.component';
import { PermadeleteComponent } from './permadelete/permadelete.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,                                               // Here is the componenet being delcared
    HomeComponent,
    SignupComponent,
    ProfileComponent,
    PostComponent,
    PermadeleteComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule.forRoot([
      {path: '', component: HomeComponent },
      {path: 'login', component: LoginComponent},                  // This is a new path. Can be found at localhost:port/login
      {path: 'signup', component: SignupComponent},
      {path: 'profile', component: ProfileComponent},
      {path: 'post', component: PostComponent}
    ]),
    BrowserAnimationsModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

