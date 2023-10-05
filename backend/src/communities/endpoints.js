import { Community } from "./schemas.js";
import { User } from "../authentication/schemas.js";

// Community. Requires a name and description (for now)
export async function createCommunity(req, res) {
    const req_name = req.body.name
    const req_desc = req.body.description
  
    // Must have username and password
    if(!req_name){
        res.status(400).send('Community name required');
        return;
    }

    if(!req_desc){
        res.status(400).send('Community description required');
        return;
    }

    if(!req.body.mods || req.body.mods.length < 1){
      res.status(400).send('At least one mod is required');
      return;
    }
  
    //Determine if community name already exists
    const comm = await Community.findOne({ name: req_name });
    if (comm) {
      res.status(409).send('A community with this name already exists');
      return;
    }
  
    // Create community
    const new_comm = new Community({
      name: req_name,
      description: req_desc,
      mods: [req.mods],
    });
    await new_comm.save();
    res.status(200).json(new_comm);
}

   //Finds a community matching the queried name. May want to use a select statement in the future to change which data gets sent back.
export async function query_communities(req, res){

    const community_name = req.query.name

    Community.find({name: { $regex: new RegExp(`${community_name}.*`, 'i') } }, (err, communities) => {
      if(err){
        res.status(400).send('Internal Server Error');
        return;
      }
      res.status(200).json(communities);
    })
}

export async function query_users(req, res){

    const query_user = req.query.username;

    User.find({ username: { $regex: new RegExp(`${query_user}.*`, 'i') } }, (err, users) => {
        if (err) {
          res.status(400).send('Internal Server Error');
          return;
        }

        //Sorts users by length.
        users.sort((a, b) => a.username.length - b.username.length);
        res.status(200).json(users);
    });
  }

  export async function search_single_user(req, res){

    User.findOne({username: req.query.username}, (err, user) => {
      if(err){
        res.status(400).send('Internal Server Error');
        return;
      }
      res.status(200).json(user);
    });

  }