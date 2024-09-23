window.addEventListener("DOMContentLoaded", loadedHandler);
let timerId;

async function loadedHandler() {
    let allLikeButtons = document.querySelectorAll(".postBtns .likeBtn");
    for (likeBtn of allLikeButtons) {
        likeBtn.addEventListener("click", likePost);
    }

    let makePostButton = document.querySelector("#publishBtn");
    if (makePostButton) {
        makePostButton.addEventListener("click", makePost);
    }

    let allDeleteButtons = document.querySelectorAll(".postBtns .deleteBtn");
    for (deleteBtn of allDeleteButtons) {
        deleteBtn.addEventListener("click", deletePost);
    }

    let editPostButton = document.querySelector("#publishEditBtn");
    if (editPostButton) {
        editPostButton.addEventListener("click", editPost);
    }

    // timerId = setInterval(updateLikes, 1000);
}

async function editPost(event) {
    console.log("about to try to edit post")

    let msg = document.querySelector("input#editPostText");
    let post_id = parseInt(document.querySelector("#hiddenPostId").innerText)
    let msgBody = {
        "post_id": post_id,
        "post_text": msg.value
    }
        
    let response = await fetch("/editpost", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(msgBody)
    });
    
    if (response.status == 200) {
        console.log("edit post")
        // redirect to page
        // CREDIT/SOURCE: https://developer.mozilla.org/en-US/docs/Web/API/Location/href
        window.location.href = '/';
    }
    else {
        console.log("ERROR: incorrect status: status was " + response.status);
    }
}

async function deletePost(event) {
    console.log("about to try to delete post")
    // first check if user is logged in (otherwise they can't like posts)
    let loggedIn = await fetch("/isLoggedIn")
    const loggedInJson = await loggedIn.json();
    console.log("logged in: " + loggedInJson.loggedIn)
    if (loggedInJson.loggedIn) {
        console.log("logged in user will try to delete post")
        let btnId = event.target.id;
        // we slice btnId at pos 6 because each delete button id is in format "delete1" "delete2" "delete3"
        // etc and we're trying to extract the id
        let deleteBtnId = btnId.substring(6);
        
        // post id and like btn id match
        let deleteBody = {
            "post_id": deleteBtnId
        };

        let response = await fetch("/deletepost", {
            method: "DELETE",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(deleteBody)
        });
        
        // updating frontend
        if (response.status == 200|| response.status == 404) {
            let parentNode = document.querySelector(".feed")
            let childNode = document.getElementById("post" + deleteBtnId)
            parentNode.removeChild(childNode)
            console.log("deleted post");
         }
         else {
            console.log("ERROR: incorrect status");
         }
    }
    else {
        console.log("user not logged in, cannot like post")
    }
}


async function makePost(event) {
    console.log("about to try to make post")
    // first check if user is logged in (otherwise they can't make posts)
    let loggedIn = await fetch("/isLoggedIn")
    const loggedInJson = await loggedIn.json();
    console.log("logged in: " + loggedInJson.loggedIn)
    if (loggedInJson.loggedIn) {
        console.log("logged in user will make post")

        let msg = document.querySelector("input#postText");
        let msgBody = {
            "post_text": msg.value
        }
            
        let response = await fetch("/makepost", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(msgBody)
        });
        
        // TODO: do something useful with the status code
        if (response.status == 200) {
            console.log("made post")
            // redirect to page
            // SOURCE: https://developer.mozilla.org/en-US/docs/Web/API/Location/href
            window.location.href = '/';
        }
        else {
            console.log("ERROR: incorrect status");
        }
        
    }
    else {
        console.log("user not logged in, cannot make post")
    }
}

async function likePost(event) {
    console.log("about to try to like post")
    // first check if user is logged in (otherwise they can't like posts)
    let loggedIn = await fetch("/isLoggedIn")
    const loggedInJson = await loggedIn.json();
    console.log("logged in: " + loggedInJson.loggedIn)
    if (loggedInJson.loggedIn) {
        console.log("logged in user will like post")
        let btnId = event.target.id;
        console.log("btnId is: " + btnId)
        // we slice btnId at pos 4 because each like button id is in format "like1" "like2" "like3"
        // etc and we're trying to extract the id
        let likeBtnId = btnId.substring(4);
        console.log("likeBtnId is: " + likeBtnId)

        // post id and like btn id match
        let likeBody = {
            "post_id": likeBtnId
        };

        let response = await fetch("/like", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(likeBody)
        });
        
        // updating frontend
        if (response.status == 200) {
            let likeText = document.querySelector("div#post" + likeBtnId.toString() + " > span.like");
            likeText.innerText = likeText.innerText.substring(0, likeText.innerText.length - 6)
            likeText.innerText = parseFloat(likeText.innerText) + 1;
            likeText.innerText += " likes"
            console.log("liked post")
        }
        else {
            console.log("ERROR: incorrect status");
        }
    }
    else {
        console.log("user not logged in, cannot like post")
    }
}

async function updateLikes(event) {
    let allPosts = document.querySelectorAll(".post");
    for (post of allPosts) {
        let post_id =  post.id;
        // post id and like btn id match
        let likeBody = {
            "post_id": post_id
        };

        let response = await fetch("/likeCount", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify(likeBody)
        });
        
        // updating frontend
        if (response.status == 200) {
            let likeText = document.querySelector("# " + post_id.toString + "> span.like > p");
            likeText.innerText = response.id;
        }
        else {
            console.log("ERROR: incorrect status");
        }
    }
}
