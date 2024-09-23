const data = require("./data")
const express = require ('express')
const session = require('express-session');
const app = express()
const port = 4132
// const basicAuth = require('express-basic-auth')

app.set("views", "templates"); // look in "templates" folder for pug templates
app.set("view engine", "pug");

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use("/css", express.static("resources/css"));
app.use("/js", express.static("resources/js"));
app.use("/images", express.static("resources/images"));

app.use(session({
  secret: 'csci4131',
  resave: false,
  saveUninitialized: true
}));

/**
 * @brief This endpoint will return true if user is logged in, false otherwise
 * 
 * @param {object} res - res sends Json object, with "loggedIn" as a field, that indicates logged in status
 * @returns 200 on success always, Json true/false based on user login status
 */
app.get("/isLoggedIn", async (req, res)=> {
  let loggedIn;
  if (req.session.user) {
    loggedIn = true;
  }
  else {
    loggedIn = false;
  }
  let loggedInBody = {
    "loggedIn": loggedIn
  };
 
  // json ify it
  res.status(200).set({
    'Content-Type': 'application/json',
  })
  .send(JSON.stringify(loggedInBody));
})

/**
 * @brief This endpoint will load the mainpage with all posts, ordered by most recent first
 * 
 * @param {object} req - req.query.page is gonna have the page number
 * @returns 200 on success always
 */
app.get("/", async (req, res)=> {
  // CREDIT: Lots of the code here is referenced from in class exercise 7
  // Link to Kluver's code: https://github.umn.edu/kluve018/Lecture-21-2023-11-15/blob/main/examples_node/server.js
  // Specifically I referenced the lines 16-29

  // 10 items per page
  let page = parseInt(req.query.page ?? 1)
  if (! page) {
      page = 1;
  }
  // -1 so that we go to 0 indexing.
  let offset = (page-1)*10
  let posts = await (await data.getPosts()).slice(offset, offset+10)

  // Let mainpage know it's not by like mode for purposes of navigating between pages
  let byLike = "no"
  res.render("mainpage.pug", {posts, page, byLike}) 
})

/**
 * @brief This endpoint will load the mainpage with all posts, ordered by likes descending
 * 
 * @param {object} req - req.query.page is gonna have the page number
 * @returns 200 on success always
 */
app.get("/bylike", async (req, res)=> {
  // CREDIT: Lots of the code here is referenced from in class exercise 7
  // Link to Kluver's code: https://github.umn.edu/kluve018/Lecture-21-2023-11-15/blob/main/examples_node/server.js
  // Specifically I referenced the lines 16-29

  // 10 items per page
  let page = parseInt(req.query.page ?? 1)
  if (! page) {
      page = 1;
  }
  // -1 so that we go to 0 indexing.
  let offset = (page-1)*10
  let posts = await (await data.getPostsByLikeCount()).slice(offset, offset+10)

  // Let mainpage know it's by like mode for purposes of navigating between pages
  let byLike = "yes"
  res.render("mainpage.pug", {posts, page, byLike}) 
})


/**
 * @brief Increments like count of a post if user clicks the like button
 * If user isn't logged in, redirect to login page (only logged in users can like posts)
 * 
 * @param {object} req - req.body is JSON with field post_id which is the id of the post
 * @returns 200 on success, or 404 if post with post_id doesn't exist
 */
app.post("/like", async (req, res)=> {
  if (!req.session.user) {
    console.log("redirecting after attempting to like a post, not logged in")
    res.redirect("/loginPage")
  }
  else {
    let response = await data.incrementLikeHandler(req);
    let status_code = response[0];
    let info = response[1];
    res.status(status_code).send(info);
  }
})

/**
 * @brief For the purpose of checking the like count of a post
 * @param {object} req - req.body is JSON with field post_id which is the id of the post
 * @returns 200 on success, or 404 if post with post_id doesn't exist, returns a JSON object
 */
app.post("/likeCount", async (req, res)=> {
  let response = await data.getLikeCountHandler(req);
  let status_code = response[0];
  let content = response[1];

  let likeBody = {
    "id": content
  };
 
  // json ify it
  res.status(status_code).set({
    'Content-Type': 'application/json',
  })
  .send(JSON.stringify(likeBody));
})


/**
 * @brief Renders the login page with the form for logging in
 * Accessed by clicking the login button from the navbar on any page
 * 
 * @param {object} res - Will send back the login page OR main page if user's already logged in
 * @returns 200 always
 */
app.get("/loginPage", async (req, res)=> {
  if (!req.session.user) {
    console.log("1")
    res.render("login.pug")
  }
  else {
    console.log("2")
    // redirect to main page if the user's already logged in
    res.redirect('/');
  }
})

/**
 * @brief Renders the signup page with the form for logging in
 * Accessed by clicking the login button from the navbar on any page
 * 
 * @param {object} res - Will send back the signup page OR main page if user's already logged in
 * @returns 200 always
 */
app.get("/signupPage", async (req, res)=> {
  if (!req.session.user) {
    console.log("signup1")
    res.render("signup.pug")
  }
  else {
    console.log("signup2")
    // redirect to main page if the user's already logged in
    res.redirect('/');
  }
})

/**
 * @brief Logs the user in, this endpoint is hit up when the user submits login form with info
 * If the user's already logged in then this should just redirect to home page
 * After the user is successfully loggged in, they're redirected to the home page anyway
 * If username/password incorrect, user is redirected to the login page again
 * 
 * @param {object} req - JSON object with two fields: "username" and "password" in plain text
 * @returns 200 on success, 401 if user's credentials are missing, 403 if incorrect authentication
 * or user has not signed up yet
 */
app.post("/login", async (req, res)=> {
  if (req.session.user) {
    res.redirect('/');
  }

  if (!req.body || (req.body != null && typeof req.body != "object")) {
      res.status(400).send("Error in request format");
  }

  const username = req.body.username; 
  const password = req.body.password;
  if (!username || !password) {
    res.status(401).send("You need to send your username and / or password");
  }

  let matchingUser  = await data.userCanLogin(username, password);
  if (matchingUser.length > 0) {
    console.log("setting user")
    req.session.user = {
      userId: matchingUser[0].user_id,
      username: matchingUser[0].username
    };
    console.log("user_id is: " + req.session.user.userId)
    console.log("username is: " + req.session.user.username)
    res.status(200).redirect("/");
  } else {
    res.status(403).redirect("/loginPage");
  }
})

/**
 * @brief Signs up the user, this endpoint is hit up when the user submits signup form with info
 * If the user's already logged in then this should just redirect to home page
 * After the user is successfully loggged in, they're redirected to the home page anyway
 * 
 * @param {object} req - JSON object with two fields: "username" and "password" in plain text
 * @returns 200 on success, 400 if username already exists, 401 if user's credentials are missing,
 * 403 if incorrect authentication
 */
app.post("/signup", async (req, res)=> {
  try {
    if (req.session.user) {
      return res.redirect('/');
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).send("Error in request format");
    }

    let username = req.body.username;
    let password = req.body.password;
    
    if (!username || !password) {
      return res.status(401).send("You need to send your username and/or password");
    }

    let signedUpUser = await data.signupUser(username, password);
    if (!signedUpUser) {
      return res.status(400).send("Username already exists! Enter a unique username.");
    }

    let signupUserCredentials = await data.userCanLogin(username, password);
    console.log("got to here after signing up")
    console.log("username was: " + username)
    console.log("password was: " + password)
    req.session.user = {
      userId: signupUserCredentials[0].user_id,
      username: signupUserCredentials[0].username
    };
    console.log("signup user user_id: " + req.session.user.user_id)
    console.log("signup user username: " + req.session.user.username)

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).send("error: " + error);
  }
})

/**
 * @brief Renders the logged out page. User logs out by clicking a button
 *
 * @param res - will render the "logout.pug" page and send it back 
 * @returns 200 on success, 400 if user is already logged out
 */
app.get("/logout", async (req, res)=> {
  if (!req.session.user) {
    res.status(400).send("You're already logged out!!!! stop it!")
  }
  else {
    req.session.destroy();
    res.status(200).render("logout.pug")
  }
})
 
/**
 * @brief Makes a post by the user
 * Redirects to login page if user is not logged in
 *
 * @param req - req.body is json object, the json should have one field: "post_text" 
 * @returns 200 on success, 400 if the length is above 50 characters
 */
app.post("/makepost", async (req, res)=> {
  if (!req.session.user) {
    res.redirect("/loginPage")
  }
  let user_id = req.session.user.userId;
  let username = req.session.user.username;
  console.log("in server.js")
  console.log("user_id is: " + user_id)
  console.log("username is: " + username)
  let response = await data.makePostHandler(user_id, username, req);
  let status_code = response[0];
  let info = response[1];
  res.status(status_code).send(info);
  // res.redirect("/")
})

/**
 * @brief Edits a post
 * Redirects to login page if user is not logged in or if post id is not provided
 *
 * @param req - query should be the id of the post
 * @returns 200 on success, 403 if user is trying to edit someone else's post
 */
app.get("/editpage", async (req, res)=> {
  if (!req.session.user || !req.session.user.userId) {
    res.redirect("/loginPage")
  }
  else if (!req.query || !req.query.postid) {
    res.redirect("/")
  }
  else {
    let postId = req.query.postid
    let user_id = req.session.user.userId
    let postExists = await data.postExistsChecker(postId)
    if (!postExists) {
      res.status(404).send("Post does not exist")
    }
    let userCanEdit = await data.userIsAuth(postId, user_id)
    if (!userCanEdit) {
      res.status(403).send("You are not authorized to edit this post")
    }
    res.status(200).render("editpost.pug", {postId})
  }
})

/**
 * @brief Edits a post
 * Redirects to login page if user is not logged in
 *
 * @param req - req.body is json object, the json should have one field: "id" aka post id 
 * @returns 200 on success, 400 if there is an error in the formatting (like post too long)
 */
app.post("/editpost", async (req, res)=> {
  if (!req.session.user) {
    res.redirect("/loginPage")
  }
  let user_id = req.session.user_id;
  let response = await data.editPostHandler(req);
  let status_code = response[0];
  let info = response[1];
  res.status(status_code).send(info);
})

/**
 * @brief Deletes a post
 * Redirects to login page if user is not logged in
 *
 * @param req - req.body is json object, the json should have one field: "post_id" aka post id 
 * @returns 200 on success, 404 if no such post exists with that post id, and 403 if it's not the
 * user's own post (if they try to delete someone else's)
 */
app.delete("/deletepost", async (req, res)=> {
  if (!req.session.user) {
    res.redirect("/loginPage")
  }
  let user_id = req.session.user.userId;
  let response = await data.deletePostHandler(user_id, req);
  let status_code = response[0];
  let info = response[1];
  res.status(status_code).send(info);
})

app.use((req, res, next) => {
  res.status(404).render("404.pug")
})

app.listen(port , () => {
  console.log(`Example app listening on port ${port}`)
})