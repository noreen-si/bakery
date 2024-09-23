-- Creating the posts table
create table post (
    id int not null auto_increment,
    post_text text not null,
    like_count int default 0,
    user_id int not null,
    username text not null,
    time_created timestamp default CURRENT_TIMESTAMP,
    primary key(id)
);

-- Creating the user table

create table user (
    user_id int not null auto_increment,
    username text not null,
    user_password text not null,
    primary key(user_id)
);

-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello', 5, 0, 'myuser0');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello1', 9, 1, 'myuser1');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello2', 15, 2, 'myuser2');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello3', 2, 3, 'myuser3');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello4', 2, 4, 'myuser4');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello5', 3, 5, 'myuser5');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello6', 3, 6, 'myuser6');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello7', 20, 7, 'myuser7');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello8', 11, 8, 'myuser8');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello9', 14, 9, 'myuser9');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello10', 15, 10, 'myuser10');
-- INSERT INTO post (post_text, like_count, user_id, username) VALUES ('hello11', 4, 11, 'myuser11');

