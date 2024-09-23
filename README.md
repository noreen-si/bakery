# Tweetr

## How to run
- Enter project directory, type in node server.js

## Features

- Account creation, login, logout, keeping track of when a user is logged in
- Make, edit, delete posts, where only the user who made the post can edit or delete the post
- Like post, where a user can spam the like button for the same post
- Pagination, where 10 posts are shown per page
- Sorting posts, by either recent posts first, or by like count (most likes is first)

## Important notes about features

- I've included doxygen comments above each function that should give a good overview of what everything does
- Most of the request handling, error handling logic is stored in data.js
- When a user is logged in, they'll still see the "login" / "signup" links on the navigation bar. When they click login / signup, nothing will happen if they're already logged in. That is the expected behavior
- When a user clicks edit, they will be redirected to the login page if they are not logged in. If they try to like or delete a post when they're not logged in, nothing will happen, by design
- If the user doesn't enter the right password on the login page, the login page will just keep refreshing until they enter the right password by design

## Important links
- NOTE: you shouldn't need this section to do things and navigate around the website. They are here so you can maybe look at the server.js code with the relevant endpoint if needed
- "/" (get) - this is the link to the home page, default recent posts first
- "/bylike" (get) - this sorts it by like count
- "/like" (post) - this handles liking a post
- "/loginPage" (get) - this retrieves the user login page
- "/signupPage" (get) - this retrieves the user signup page
- "/login" (post) - this logs the user in
- "/signup" (post) - this signs up the user
- "/logout" - this logs the user out
- "/makepost" (post) - this makes the post
- "/editpage" (get) - brings user to page where they can edit a post
- "/editpost" (post) - this actually does the editing, updating of a post
- "/deletepost" (delete) - this deletes a post
