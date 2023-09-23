import { sha256 } from 'js-sha256';

/* 
Takes a username, a password, and a callback function
returns the result of a the call callback
if error: return cb(err)
if password fail: return cb(null, false)
if password matches: return cb(null, user object) 
*/
export function verify(username, password, cb) {
    
}

export function hash(content) {
    return sha256(content);
}