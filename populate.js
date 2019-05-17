#! /usr/bin/env node

console.log('populate.js data script is running!!!!');

var async = require('async');
var Actor = require('./models/Actor.js');
var Script = require('./models/Script.js');
var Notification = require('./models/Notification.js')
const _ = require('lodash');
const dotenv = require('dotenv');
var mongoose = require('mongoose');
var fs = require('fs');

/************************
Todo:
Figure out if final_actors json files are appropriate for posting
Modify variables for those
*************************/
var actors_list;
var notifications_list;
var final_script;
var comment_list;
//From truman_testdrive rebuild (we need: actors, notifications, replys(?), and a script)

async function readData(){
  try{
    await console.log("Starting to read that data");
    //Actors are the profiles
    await console.log("Read the actors");
    actors_list= await require('./final_data/actors.json');
    await console.log("Read the notifications");
    notifications_list= await require('./final_data/test_notifications.json');
    //A script is synonomous with posts
    await console.log("Read the posts");
    final_script = await require('./final_data/script.json');
    await console.log("Read the comments");
    comment_list = await require('./final_data/comment.json');
  }catch (err){
    console.log('Error occured in reading data from JSON files', err);
  }
}

dotenv.load({ path: '.env' });

var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');

mongoose.connect(process.env.PRO_MONGODB_URI || process.env.PRO_MONGOLAB_URI, {useNewUrlParser: true});
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/*
drop existing collections before loading
to make sure we dont overwrite the data
incase we run the script twice or more
*/
function dropCollections() {
    db.collections['actors'].drop(function (err) {
        console.log('actors collection dropped');
    });
    db.collections['scripts'].drop(function (err) {
        console.log('scripts collection dropped');
    });
}

//capitalize a string
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

//Transforms a time like -12:32 (minus 12 minutes and 32 seconds)
//into a time in milliseconds
function timeStringToNum(v) {
    var timeParts = v.split(":");
    if (timeParts[0] == "-0")
        return -1 * parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
    else if (timeParts[0].startsWith('-'))
        return parseInt(((timeParts[0] * (60000 * 60)) + (-1 * (timeParts[1] * 60000))), 10);
    else
        return parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
};

//creates a random number for likes with a wieghted dist
function getLikes() {
  var notRandomNumbers = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  var idx = Math.floor(Math.random() * notRandomNumbers.length);
  return notRandomNumbers[idx];
}

//create a radom number (for likes) with a weighted distrubution
//this is for comments
function getLikesComment() {
    var notRandomNumbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 3, 4];
    var idx = Math.floor(Math.random() * notRandomNumbers.length);
    return notRandomNumbers[idx];
}

//creates a random number for reads with a weighted disconnect
function getReads(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

/*************************
createActorInstances:
Creates all the Actors in the simulation
Must be done first!
TODO: Double check why actors aren't being created correctly!
(I suspect it is something to do with the profile array)
*************************/
function createActorInstances() {

  async.each(actors_list, function(actor1, callback){
    var actordetail = new Actor();
    actordetail.profile.name = actor1.profile.name
    actordetail.profile.gender = actor1.profile.gender;
    actordetail.profile.location = actor1.profile.location;
    actordetail.profile.picture = actor1.profile.picture;
    actordetail.profile.bio = actor1.profile.bio;
    actordetail.profile.age = actor1.profile.age;
    actordetail.username = actor1.username;
    actordetail.id = actor1.id;
    /*Adding profile
    actordetail.name = actor1.name
    actordetail.gender = actor1.gender;
    actordetail.location = actor1.location;
    actordetail.picture = actor1.picture;
    actordetail.bio = actor1.bio;
    actordetail.age = actor1.age;
    actordetail.class = actor1.class;
    actordetail.username = actor1.username;
    */
    //var actor = new Actor(actordetail);

    actordetail.save(function (err) {
      if (err) {
        console.log("Something went wrong adding an actor!")
        return -1;
      }
      console.log('New Actor: ' + actordetail.username);
      callback();
    });
  },
    function (err){
      console.log("All done with actors!")
      return 'Loaded Actors'
    }
  );
}

/*************************
createPostInstances:
Creates each post and uploads it to the DB
Actors must be in DB first to add them correctly to the post
*************************/
function createPostInstances(){
  async.each(final_script, function(new_post, callback){
    Actor.findOne({ username :new_post.actor}, (err, act) => {
      if (err) {console.log("error in createPostInstances"); console.log(err); return;}
      if (act){
        console.log('Looking up posts for : ' + act.username);
        var postdetail = new Object();
        postdetail.module = "" //blank for default truman
        postdetail.body = new_post.body
        postdetail.info_text = ""//blank for default truman
        postdetail.post_id = new_post.post_id;
        postdetail.class = new_post.class;
        postdetail.picture = new_post.picture;
        postdetail.likes = new_post.likes || getLikes();
        postdetail.lowread = new_post.lowread;
        postdetail.highread = new_post.highread;
        postdetail.actor = act;

        postdetail.time = timeStringToNum(new_post.time);

        var script = new Script(postdetail);
        script.save(function (err){
          if (err) {
            console.log("Something went wrong adding a post!");
            callback(err)
          }
            //callback();
        });
      }
        else {//else no actor found
          console.log("No Actor Found!");
          callback();
        }
    });
  });
}

/*************************
createPostRepliesInstances:
Creates inline comments for each post
Looks up actors (by comparing the name of the actor who mande the comment with the username)
and posts (by comparing the reply ID to the post ID number)
to insert the correct comment.
Does this in series to insure comments are put in, in correct order
Takes a while because of this
*************************/
function createPostRepliesInstances(){

    async.eachSeries(comment_list, function(new_replies, callback) {

      Actor.findOne({ username: new_replies.actor }, (err, act) => {
        if (act){//if correct actor is found
          Script.findOne({post_id: new_replies.reply}, function(err, pr){
            if (pr) {//if correct post reply is found
              var comment_detail = new Object();
              comment_detail.body = new_replies.body
              comment_detail.commentID = new_replies.id;
              comment_detail.likes = getLikesComment();
              comment_detail.time = timeStringToNum(new_replies.time);
              //1 hr is 3600000
              comment_detail.actor = act;
              pr.comments.push(comment_detail);
              pr.comments.sort(function (a, b) { return a.time - b.time; });

              pr.save(function(err){
                if (err) {
                  console.log("@@@@@@@@@@@@@@@@Something went wrong in Saving COMMENT!!!");
                  console.log("Error IN: " + new_replies.id);
                  callback(err);
                }
                console.log('Added new Comment to Post: ' + pr.post_id);
                callback();
              });
            }
            else {//Else no post Found
              console.log("############Error IN: " + new_replies.id);
              console.log("No POST Found!!!");
              callback();
            }
          });
        }
        else {//Else no ACTOR Found
          console.log("****************Error IN: " + new_replies.id);
          console.log("No Actor Found!!!");
          callback();
        }
      });//Actor.findOne
    },
        function (err) {
          if (err) {
            console.log("End is WRONG");
            console.log(err);
            callback(err);
          }
          //return response
          console.log("All done with replies/comments");
          mongoose.connection.close();
          return 'Loaded Post Replies/comments';
        }
  );
}

/*
promisify function will convert a function call to promise
which will eventually resolve when function completes its execution,
additionally it will wait for 2 seconds before starting.
*/

function promisify(inputFunction) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(inputFunction());
        }, 2000);
    });
}

/*********************************
ORDER:
dropCollections
make actor
make posts
make comments
********************************/

async function loadDatabase(){
  try{
    await readData(); //reading data from JSON files
    await promisify(dropCollections);//drops existing collections
    await promisify(createActorInstances); //creates all of the actors
    await promisify(createPostInstances); //creates their posts
    await promisify(createPostRepliesInstances); //creates replies to the posts
  }catch (err){
    console.log('Error occurred in loading into DB', err);
  }
}

loadDatabase()
