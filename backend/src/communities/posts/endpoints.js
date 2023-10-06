import mongoose from 'mongoose';
import { Community } from '../schemas.js';
import { Post } from './schemas.js';

//Needs to be given post content, tags (if there are any), and the Object IDs for the community and user.
export async function post_in_community(req, res) {
  const post = req.body.post;
  const post_comm = req.body.community;
  const post_user = req.body.user;

  const created_date = Date.now();

  if (!post) {
    res.status(400).send({ error: 'No post data' });
    return;
  }

  if (!post.content) {
    res.status(400).send({ error: 'There is no content in the post' });
    return;
  }

  if (!post_comm) {
    res.status(400).send({ error: 'A post must exist in a community' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(post_comm)) {
    res.status(400).send({ error: 'Invalid community ID' });
    return;
  }

  if (!post_user) {
    res.status(400).send({ error: 'A user must make a post' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(post_user)) {
    res.status(400).send({ error: 'Invalid User ID' });
    return;
  }

  const new_post = new Post({
    content: post.content,
    created_by: post_user,
    created_date: created_date,
    tags: post.tags,
    liked_by: [],
    comments: [],
  });

  //Creates new post in database
  const posted = await new_post.save();

  //Updates the community with the new post ID.
  const community = await Community.findOne({ _id: post_comm });

  community.posts.push(posted._id);
  await community.save();

  res.status(200).json(posted);
}

//Given a community ID, in req.body.community, get all by recency.
export async function get_posts_by_community(req, res) {
  const comm = req.query.community;

  if (!comm) {
    res.status(400).send({ error: 'A community is required' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(comm)) {
    res.status(400).send({ error: 'Invalid Community ID' });
    return;
  }

  Community.findById(comm)
    .populate({
      path: 'posts',
      options: { sort: { created_date: -1 } },
    })
    .exec((err, community) => {
      if (err) {
        res.status(500).send({ error: 'Internal Server Error' });
        return;
      }

      const posts = community.posts;
      res.status(200).json(posts);
    });
}

//Likes a post given a user ID and post ID. Only if the like doesn't already exist.
export async function like_post(req, res) {
  const post_id = req.body.post;
  const user_id = req.body.user;

  if (!post_id) {
    res.status(400).send({ error: 'No post ID provided' });
    return;
  }

  if (!user_id) {
    res.status(400).send({ error: 'No user ID provided' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    res.status(400).send({ error: 'Invalid post ID' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    res.status(400).send({ error: 'Invalid user ID' });
    return;
  }

  const post = await Post.findById(post_id);
  if (!post) {
    res.status(400).send({ error: 'Post not found' });
    return;
  }

  //Add the like to the post's array of likes and return the post to the caller.
  if (post.liked_by.indexOf(user_id) == -1) {
    post.liked_by.push(user_id);
    post.save();
    res.status(200).json(post);

    return;
  }

  res.status(409).send({ error: 'User has already liked this post' });
}

//Given a user ID and post ID, will remove a like from a post provided it was already there.
export async function remove_like_post(req, res) {
  const post_id = req.body.post;
  const user_id = req.body.user;

  if (!post_id) {
    res.status(400).send({ erro: 'No post ID provided' });
    return;
  }

  if (!user_id) {
    res.status(400).send({ error: 'No user ID provided' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    res.status(400).send({ error: 'Invalid post ID' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    res.status(400).send({ error: 'Invalid user ID' });
    return;
  }

  const post = await Post.findById(post_id);
  if (!post) {
    res.status(400).send({ error: 'Post not found, or internal server error' });
    return;
  }

  const index = post.liked_by.indexOf(user_id);
  if (index !== -1) {
    post.liked_by.splice(index, 1);
    post.save();
    res.status(200).json(post);

    return;
  }

  res.status(409).send({ error: 'User did not already like this post' });
}

//Given a post ID, will return an array of users who have liked the post.
export async function get_likes(req, res) {
  const post_id = req.query.post;

  if (!post_id) {
    res.status(400).send({ error: 'No post ID provided' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    res.status(400).send({ error: 'Invalid post ID' });
    return;
  }

  Post.findById(post_id)
    .populate({
      path: 'liked_by',
    })
    .exec((err, post) => {
      if (err) {
        res.status(500).send({ error: 'Internal Server Error' });
        return;
      }

      const users = post.liked_by;
      res.status(200).json(users);
    });
}

//Not sure if this is needed, but it might be useful. Given a user ID and a post ID, it returns 0 or 1 depending on whether the like exists.
export async function user_post_like(req, res) {
  const post_id = req.query.post;
  const user_id = req.query.user;

  if (!post_id) {
    res.status(400).send({ error: 'No post ID provided' });
    return;
  }

  if (!user_id) {
    res.status(400).send({ error: 'No user ID provided' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    res.status(400).send({ error: 'Invalid post ID' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    res.status(400).send({ error: 'Invalid user ID' });
    return;
  }

  const post = await Post.findById(post_id);
  if (!post) {
    res.status(400).send({ error: 'Post not found' });
    return;
  }
  const index = post.liked_by.indexOf(user_id);

  if (index == -1) {
    res.status(200).json(0);
    return;
  }

  res.status(200).json(1);
}