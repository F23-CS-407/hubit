import mongoose from 'mongoose';
import { Community } from './schemas.js';
import { User } from '../authentication/schemas.js';

// Community, requires community name, description, and at least one valid mod
// The mod array  must comprise of correct Object IDs for User objects, the creator must be in the mod array.
export async function createCommunity(req, res) {
  const req_name = req.body.name;
  const req_desc = req.body.description;
  const req_mods = req.body.mods;

  if (!req.isAuthenticated()) {
    res.status(401).send({ error: 'not logged in' });
    return;
  }

  // Must have username and password
  if (!req_name) {
    res.status(400).send({ error: 'Community name required' });
    return;
  }

  if (!req_desc) {
    res.status(400).send({ error: 'Community description required' });
    return;
  }

  if (!req.body.mods || req.body.mods.length < 1) {
    res.status(400).send({ error: 'At least one mod is required' });
    return;
  }

  // Validate ObjectId values in the mods array
  const isValidMods = req_mods.every((modId) => mongoose.Types.ObjectId.isValid(modId));

  if (!isValidMods) {
    res.status(400).send({ error: 'Invalid ObjectId in mods array' });
    return;
  }

  // Mods list must include creator
  if (!req.body.mods.includes(req.user._id)) {
    res.status(400).send({ error: 'Creator must be a mod' });
  }

  //Determine if community name already exists
  const comm = await Community.findOne({ name: req_name });
  if (comm) {
    res.status(409).send({ error: 'A community with this name already exists' });
    return;
  }

  // Create community
  try {
    const new_comm = new Community({
      name: req_name,
      description: req_desc,
      mods: req_mods,
    });
    await new_comm.save();

    // add community to each mods mod_for list
    for (const mod of req_mods) {
      const thisMod = await User.findById(mod);
      thisMod.mod_for.push(new_comm._id);
      await thisMod.save();
    }

    res.status(200).json(new_comm);
  } catch (err) {}
}

export async function deleteCommunity(req, res, next) {
  const comm_id = req.body.community;
  if (!comm_id) {
    res.status(400).send('Community missing');
    return;
  }

  if (!req.isAuthenticated()) {
    res.status(401).send('Not logged in');
    return;
  }
  const user = await User.findById(req.user._id);

  if (!mongoose.Types.ObjectId.isValid(comm_id)) {
    res.status(404).send({ error: 'Community not found' });
    return;
  }
  const community = await Community.findById(comm_id);

  if (!community.mods.includes(user._id)) {
    res.status(403).send('Not mod of community');
    return;
  }

  await community.deleteRecursive();
  res.status(200).send('Deleted');
}

//Finds a community matching the queried name. May want to use a select statement in the future to change which data gets sent back.
export async function query_communities(req, res) {
  const community_name = req.query.name;

  Community.find({ name: { $regex: new RegExp(`${community_name}.*`, 'i') } }, (err, communities) => {
    if (err) {
      res.status(500).send({ error: 'Internal Server Error' });
      return;
    }
    res.status(200).json(communities);
  });
}

export async function query_users(req, res) {
  const query_user = req.query.username;

  User.find({ username: { $regex: new RegExp(`${query_user}.*`, 'i') } }, (err, users) => {
    if (err) {
      res.status(500).send({ error: 'Internal Server Error' });
      return;
    }

    //Sorts users by length.
    users.sort((a, b) => a.username.length - b.username.length);
    res.status(200).json(users);
  });
}

export async function search_single_user(req, res) {
  User.findOne({ username: req.query.username }, (err, user) => {
    if (err) {
      res.status(500).send({ error: 'Internal Server Error' });
      return;
    }
    res.status(200).json(user);
  });
}

export async function search_community_by_post_id(req, res) {
  if (!req.query.post_id) {
    res.status(400).send({ error: 'post_id missing' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(req.query.post_id)) {
    res.status(404).send({ error: 'Invalid post id' });
    return;
  }

  const thisComm = await Community.findOne({ posts: { $elemMatch: { $eq: req.query.post_id } } }).populate('banner');
  res.status(200).json(thisComm);
}

export async function getCommunity(req, res, next) {
  const id = req.query.id;
  if (!id) {
    res.status(400).send({ error: 'id param missing' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).send({ error: 'Invalid community id' });
    return;
  }

  const thisCommunity = await Community.findById(id).populate('banner');
  res.status(200).json(thisCommunity);
}
