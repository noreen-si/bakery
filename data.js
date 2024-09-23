// this package behaves just like the mysql one, but uses async await instead of callbacks.
const mysql = require(`mysql-await`); // npm install mysql-await

const INVALID_JSON_ERROR_MESSAGE = "ERROR: Invalid Json.";
const MISSING_CONTENT_TYPE_HEADER_ERROR_MESSAGE = "ERROR: Missing 'Content-Type' header.";
const INCORRECT_CONTENT_TYPE_HEADER_ERROR_MESSAGE = "ERROR: 'Content-Type' should be 'application/json'.";
const MISSING_ID_PROPERTY_ERROR_MESSAGE = "ERROR: Request is missing 'id' property.";
const MISSING_POST_TEXT_ERROR_MESSAGE = "ERROR: Request is missing 'post_text' property.";
const NO_SUCH_POST_ERROR_MESSAGE = "ERROR: Post with id could not be found.";
const INVALID_AUTH_ERROR_MESSAGE = "ERROR: Invalid authorization"
const POST_TOO_LONG_ERROR_MESSAGE = "ERROR: Post must be below 100 characters";

// first -- I want a connection pool: https://www.npmjs.com/package/mysql#pooling-connections
// this is used a bit differently, but I think it's just better -- especially if server is doing heavy work.
var connPool = mysql.createPool({
  connectionLimit: 5, // it's a shared resource, let's not go nuts.
  host: "127.0.0.1",// this will work
  user: "C4131F23U194",
  database: "C4131F23U194",
  password: "37686", // we really shouldn't be saving this here long-term -- and I probably shouldn't be sharing it with you...
});

// For catching errors
connPool.on('error', () => {});

// Helper function to check if the user is authorized to 
// Edit or delete a post. Takes in post id and user id
async function userIsAuth(post_id, user_id) {
  let matchingUser = await connPool.awaitQuery("SELECT * FROM post WHERE id = ? AND user_id = ?", [post_id, user_id]);
  console.log("in userIsAuth")
  console.log("matchingUser: " + matchingUser[0])
  return matchingUser.length > 0;
}

// helper function to see if username already exists
async function usernameExists(username) {
  let matchingUser = await connPool.awaitQuery("SELECT * FROM user WHERE username = ?", [username]);
  return matchingUser.length > 0;
}

// Signs up the user
// also checks to make sure username is unique
// true on success, false otherwise
async function signupUser(username, password) {
  if (await usernameExists(username)) {
    return false;
  }
  await connPool.awaitQuery("INSERT INTO user SET ?",
  { username: username, user_password: password});
  console.log("inserted")
  return true;
}

async function userCanLogin(username, password) {
  let matchingUser = await connPool.awaitQuery("SELECT * FROM user WHERE username = ? AND user_password = ?", [username, password]);
  return matchingUser;
}
// Returns a list of posts by like count
async function getPostsByLikeCount() {
  return await connPool.awaitQuery("SELECT * FROM post ORDER BY like_count DESC");
}

// Increments the like count of a post.
// Takes in post id
async function incrementLike(id) {
  return await connPool.awaitQuery("UPDATE post SET like_count = like_count + 1 WHERE id = ?", [id]);
}

// returns the like count of a post
async function getLikeCount(id) {
  return await connPool.awaitQuery("UPDATE post SET like_count = like_count + 1 WHERE id = ?", [id]);
}

async function getLikeCountHandler(req) {
  if (!req.body) {
    return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if ( typeof req.body != 'object') {
      return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if (!req.header('Content-Type')) {
      return [400, MISSING_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }
  if (req.header('Content-Type') != "application/json") {
      return [400, INCORRECT_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }

  let post_id = req.body.post_id;
  if (post_id== null) {
    return [400, MISSING_ID_PROPERTY_ERROR_MESSAGE];
  }

  let postExists = postExistsChecker(post_id);
  if (!postExists) {
    return [404, NO_SUCH_POST_ERROR_MESSAGE]
  }

  // get like count
  let likeCount;
  try {
    likeCount = await likePost(post_id);
    console.log("Added post");
  }
  catch(error) {
    console.log("error making post");
    return [400, "error making post"];
  }
  
  return [200, likeCount];
}

// helper function to see if post exists
// takes in a post id
async function postExistsChecker(id) {
  post = await connPool.awaitQuery("SELECT * FROM post WHERE id = ?", [id])
  return post.length > 0;
}

// Handler for incrementing like count of a post
// Takes in post id
async function incrementLikeHandler(req) {
  if (!req.body) {
    return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if ( typeof req.body != 'object') {
      return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if (!req.header('Content-Type')) {
      return [400, MISSING_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }
  if (req.header('Content-Type') != "application/json") {
      return [400, INCORRECT_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }

  let post_id = req.body.post_id;
  if (post_id== null) {
    return [400, MISSING_ID_PROPERTY_ERROR_MESSAGE];
  }

  let postExists = postExistsChecker(post_id);
  if (!postExists) {
    return [404, NO_SUCH_POST_ERROR_MESSAGE]
  }
  try {
    console.log("post_id is: " + post_id)
    await incrementLike(parseInt(post_id));
    console.log("liked post");
  }
  catch(error) {
    console.log("error liking post");
    return [400, "error liking post"];
  }
  
  return [200, "liked post"];
}

// Returns a list of posts, unordered.
async function getPosts() {
  return await connPool.awaitQuery("SELECT * from post ORDER BY time_created DESC");
}

// Updates a post. Takes in post id and the new post text
// Assumes user has already been authenticated
async function editPost(id, post_text) {
  return await connPool.awaitQuery("UPDATE post SET post_text = ? WHERE id = ?", [post_text, id]);
}

async function editPostHandler(req) {
  if (!req.body) {
    return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if ( typeof req.body != 'object') {
      return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if (!req.header('Content-Type')) {
      return [400, MISSING_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }
  if (req.header('Content-Type') != "application/json") {
      return [400, INCORRECT_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }

  let post_id = req.body.post_id;
  if (post_id== null) {
    return [400, MISSING_ID_PROPERTY_ERROR_MESSAGE];
  }

  let post_text = req.body.post_text;
  if (post_text == null) {
      return [400, MISSING_POST_TEXT_ERROR_MESSAGE];
  }
  // already checked if the user was authorized
  if (post_text.length > 100) {
    return [400, POST_TOO_LONG_ERROR_MESSAGE]
  }

  try {
    await editPost(post_id, post_text);
    console.log("Edited post");
  }
  catch(error) {
    console.log("error editing post");
    return [400, "error editing post"];
  }
  
  return [200, "editing post"];
}

// Makes a new post. Adds it to the post table.
async function makePost(user_id, username, post_text) {
  return await connPool.awaitQuery("INSERT INTO post SET ?",
    { user_id: user_id, username: username, post_text: post_text});
}

// Handler for making post
// Takes in JSON object with one field, "post_text", which is the post's text
async function makePostHandler(user_id, username, req) {
  if (!req.body) {
    return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if ( typeof req.body != 'object') {
      return [400, INVALID_JSON_ERROR_MESSAGE];
  }
  if (!req.header('Content-Type')) {
      return [400, MISSING_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }
  if (req.header('Content-Type') != "application/json") {
      return [400, INCORRECT_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
  }

  let post_text = req.body.post_text;
  if (post_text == null) {
      return [400, MISSING_POST_TEXT_ERROR_MESSAGE];
  }

  if (post_text.length > 100) {
      return [400, POST_TOO_LONG_ERROR_MESSAGE]
  }

  try {
    console.log("in data.js")
    console.log("user_id is: " + user_id)
    console.log("username is: " + username)
    await makePost(user_id, username, post_text);
    console.log("Added post");
  }
  catch(error) {
    console.log("error making post: " + error);
    return [400, "error making post"];
  }
  
  return [200, "made post"];
}

// Deletes a post. Takes in the id of a post.
// returns true or false if it worked (post found) or not.
// Assumes user has already been authenticated
async function deletePost(user_id, id) {
  return await connPool.awaitQuery("DELETE FROM post WHERE user_id = ? AND id = ?", [user_id, id], function (error, results) {
      if (error) {
        return false;
      } else {
        const rowsDeleted = results.affectedRows;
    
        if (rowsDeleted > 0) {
          return true;
        } else {
          return false;
        }
      }
  });
}

// The exposed handler for deleting posts.
// Takes in a request, performs validation,
// and calls deletePost() to delete the post.
async function deletePostHandler(user_id, req) {
    if (!req.body) {
        return [400, INVALID_JSON_ERROR_MESSAGE];
    }
    if ( typeof req.body != 'object') {
        return [400, INVALID_JSON_ERROR_MESSAGE];
    }
    if (!req.header('Content-Type')) {
        return [400, MISSING_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
    }
    if (req.header('Content-Type') != "application/json") {
        return [400, INCORRECT_CONTENT_TYPE_HEADER_ERROR_MESSAGE];
    }
    // id is post id
    let id = req.body.post_id;
    if (id == null) {
        return [400, MISSING_ID_PROPERTY_ERROR_MESSAGE];
    }

    let userIsAuthorized = await userIsAuth(id, user_id)

    if (!userIsAuthorized) {
      return [403, INVALID_AUTH_ERROR_MESSAGE];
    }

    try {
      let response = await deletePost(user_id, id);
      console.log("response was: " + response[0]);
      // todo: maybe response.length
      if (!response) {
          return [404, NO_SUCH_POST_ERROR_MESSAGE];
        }
        else {
          return [200, "Successful deletion of post with id " + id]; 
        }
    }
    catch(error) {
      console.log("Error: " + error);
      return [404, NO_SUCH_POST_ERROR_MESSAGE];
    }
}


module.exports = { postExistsChecker, userIsAuth, userCanLogin, signupUser, getPostsByLikeCount, incrementLike, incrementLikeHandler, getLikeCountHandler, getPosts, editPost, editPostHandler, makePost, makePostHandler, deletePostHandler }