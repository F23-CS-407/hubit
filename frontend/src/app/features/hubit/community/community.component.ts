import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunityInterface } from '../../../interfaces/community';

import { User } from '../../../../models/User';
import { Alias } from '../../../../models/Alias';
import { Post } from '../../../../models/Post';
import { Community } from '../../../../models/Community';
import { CommunityService } from '../../../services/community.service';

const options = { withCredentials: true };

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.css'],
})
export class CommunityComponent implements OnInit {
  private backend_addr: string = '/api';
  private urlParams: URLSearchParams = new URLSearchParams(
    window.location.search,
  );

  community_id: string = '';
  community_name: string = 'N/A';
  community_desc: string = 'N/A';
  community_post_ids: string[] = [];
  community_posts: Post[] = [];
  community?: CommunityInterface;
  loading: boolean = true;

  user_following: boolean = false;
  show_follow_button: boolean = false;

  constructor(
    private communityService: CommunityService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Get community query
    this.community_id = this.urlParams.get('community') as string;
    if (this.community_id == undefined || this.community_id == '') {
      // Invalid community id
      this.router.navigate(['/']);
    }

    // Get community data
    this.http
      .get<any>(
        this.backend_addr + '/community?id=' + this.community_id,
        options,
      )
      .subscribe({
        next: (get_community_response) => {
          // On success
          this.community_name = get_community_response.name;
          this.community_desc = get_community_response.description;

          // TODO: When community modification is added, check if logged in user is a mod with "response.mods"
        },
        error: (error) => {
          // On fail
          console.log(error);

          // Trying to view a community that doesn't exist
          this.router.navigate(['/']);
        },
      });

    // Get Community Posts Data
    this.http
      .get<any>(
        this.backend_addr + '/community/posts?community=' + this.community_id,
        options,
      )
      .subscribe({
        next: (get_community_posts_response) => {
          // On success
          for (let i = 0; i < get_community_posts_response.length; i++) {
            // Get post as object
            let curr_post = get_community_posts_response[i];

            // Get user_id
            let created_by_id: string = curr_post.created_by;

            // Create post object
            let new_post: Post = new Post(
              new Alias(
                new User(created_by_id),
                new Community(/* This doesn't need to be set on this page*/),
              ),
            );
            new_post.id = curr_post._id;
            new_post.content = curr_post.content;

            // Get username
            this.http
              .get<any>(
                this.backend_addr + '/user?id=' + created_by_id,
                options,
              )
              .subscribe({
                next: (get_user_response) => {
                  if (new_post.created_by) {
                    new_post.created_by.community_username =
                      get_user_response.username;
                  }
                },
              });

            // Add post to list for display
            this.community_posts.push(new_post);
          }
        },
        error: (error) => {
          // On fail
          console.log(error);
        },
      });

    // Get community follow status
    this.http
      .get<any>(
        this.backend_addr +
          `/user/is_following_community?id=${this.community_id}`,
        options,
      )
      .subscribe({
        next: (is_following_response) => {
          this.user_following = is_following_response;
          this.show_follow_button = true;
        },
        error: (error) => {
          this.show_follow_button = false;
          console.log(error);
        },
      });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.community_id = params['community'];
      if (this.community_id) {
        this.communityService.fetchCommunity(this.community_id);

        this.communityService.community.subscribe(communityData => {
          this.community = communityData;
        });
        this.communityService.loading.subscribe(isLoading => {
          if (!isLoading && (!this.community || Object.keys(this.community).length === 0)) {
            // If loading is complete and community data is empty, redirect
            this.router.navigate(['/']);
          }
        });
      } else {
        // If no communityId found in queryParams, navigate back to a safe route
        console.log('Error: No community id found')
        this.router.navigate(['/']);
      }
    });
  }
  

  followCommunityCall = () => {
    this.show_follow_button = false;
    this.http
      .post(
        this.backend_addr + '/user/follow_community',
        { id: this.community_id },
        options,
      )
      .subscribe({
        next: (response) => {
          this.user_following = true;
          this.show_follow_button = true;
        },
        error: (error) => {
          console.log(error);
          if (error.status == 409) {
            this.user_following = true;
          }
          this.user_following = false;
          this.show_follow_button = true;
        },
      });
  };

  unfollowCommunityCall = () => {
    this.show_follow_button = false;
    this.http
      .post(
        this.backend_addr + '/user/unfollow_community',
        { id: this.community_id },
        options,
      )
      .subscribe({
        next: (response) => {
          this.user_following = false;
          this.show_follow_button = true;
        },
        error: (error) => {
          console.log(error);
          if (error.status == 409) {
            this.user_following = false;
          }
          this.user_following = true;
          this.show_follow_button = true;
        },
      });
  };

  navigateToNewPost() {
    if (this.community_id) {
      this.router.navigate(['/hubit/new_post'], { queryParams: { community: this.community_id } });
    } else {
      console.log('Error: No community id found');
    }
  }

  /** 
   Given user id, returns associated account username
   **/
  private get_username(user_id: string) {
    const options = { withCredentials: true };
    this.http
      .get<any>(this.backend_addr + '/user?id=' + user_id, options)
      .subscribe({
        next: (get_user_response) => {
          // On success
          return get_user_response.username;
        },
        error: (error) => {
          // On fail
        },
      });

    return 'get_username() is broken';
  }
}
