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
//From truman_testdrive rebuild (we need: actors, notifications, replys(?), and a script)
actors_list= require('./final_data/final_actors.json');
notifications_list= require('./final_data/test_notifications.json');
//A script is synonomous with posts
final_script = require('./final_data/final_script.json');




//Messing with this by commenting out things that aren't beeing called, changing to json files in FINAL_DATA folder
//var highUsers = require('./highusers.json');
//var actors1 = require('./final_actors.json');
//var posts1 = require('./postsv1.json');
//var post_reply1 = require('./post_replyv1.json');
//var actorReply = require('./actorReply.json'); //this is actually called, don't know what the replacement is
//var notify = require('./notify.json');
//var dd = require('./upload_post_replyv1.json');

dotenv.load({ path: '.env' });

var MongoClient = require('mongodb').MongoClient
 , assert = require('assert');

var options = {
  server : {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}},
  replset: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}}
};


mongoose.connect(process.env.PRO_MONGODB_URI || process.env.PRO_MONGOLAB_URI);
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
    db.dropCollection('actors' ,function (err) {
        console.log('actor collection dropped');
    });
    db.dropCollection('scripts' ,function (err) {
        console.log('script collection dropped');
    });
}

//capitalize a string
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

//Transforms time into time in milliseconds
function timeStringToNum (v) {
  var timeParts = v.split(":");
  return parseInt(((timeParts[0] * (60000 * 60)) + (timeParts[1] * 60000)), 10);
}

//creates a random number for likes with a wieghted dist
function getLikes() {
  var notRandomNumbers = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6];
  var idx = Math.floor(Math.random() * notRandomNumbers.length);
  return notRandomNumbers[idx];
}

//creates a random number for reads with a weighted disconnect
function getReads(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

//THIS MUST BE CALLED FIRST TO CREATE ACTORS
function ActorCreate(actor1) {

  actordetail = {};
  actordetail.profile = {};
  actordetail.profile.name = actor1.name
  actordetail.profile.gender = actor1.gender;
  actordetail.profile.location = actor1.location;
  actordetail.profile.picture = actor1.picture;
  actordetail.profile.bio = actor1.bio;
  actordetail.profile.age = actor1.age;
  actordetail.class = actor1.class;
  actordetail.username = actor1.username;

  var actor = new Actor(actordetail);
  actor.save(function (err) {
    if (err) {
      console.log("Something went wrong!!!")
      return -1;
    }
    console.log('New Actor: ' + actor.username);
  });
}

//getting stuck here, doesn't appear to be working currently :(
function PostReplyCreateFinal(new_post){
  newOID = mongoose.Types.ObjectId(new_post.actor.$oid);
  //console.log(newOID);
  Actor.findOne({_id: newOID}, (err, act) => {
      if(err) {
        console.log(err);
        return
      }
      if(act){
        var postdetail = new Object();
        postdetail.actor = {};
        postdetail.reply = {};
        postdetail.body = new_post.body
        postdetail.post_id = new_post.id;
        postdetail.class = new_post.class;
        postdetail.picture = new_post.picture;
        postdetail.likes = new_post.likes;
        postdetail.lowread = new_post.lowread;
        postdetail.highread = new_post.highread;
        postdetail.actor.$oid = new_post.actor.$oid;

        postdetail.time = new_post.time;

        script = new Script(postdetail);
        console.log("Ok, well we got to here!");
        script.save(function (err){
          if (err) {
            console.log("Something went wrong adding a post!", err);
            return -1;
          }
        });
      }
      else {
        console.log("No Actor Found!");
        return;
      }
  });
}

function NotifyCreate(new_notify) {

  Actor.findOne({ username: new_notify.actor}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    console.log('Looking up Actor ID is : ' + act._id);
    var notifydetail = new Object();

    if (new_notify.userPost >= 0 && !(new_notify.userPost === ""))
    {
      notifydetail.userPost = new_notify.userPost;
      console.log('User Post is : ' + notifydetail.userPost);
    }

    else if (new_notify.userReply >= 0 && !(new_notify.userReply === ""))
    {
      notifydetail.userReply = new_notify.userReply;
      console.log('User Reply is : ' + notifydetail.userReply);
    }

    else if (new_notify.actorReply >= 0 && !(new_notify.actorReply === ""))
    {
      notifydetail.actorReply = new_notify.actorReply;
      console.log('Actor Reply is : ' + notifydetail.actorReply);
    }

    notifydetail.actor = {};
    notifydetail.notificationType = new_notify.type;
    notifydetail.actor.$oid = act._id.toString();
    notifydetail.time = timeStringToNum(new_notify.time);

    //console.log('Looking up Actor: ' + act.username);
    //console.log(mongoose.Types.ObjectId.isValid(notifydetail.actor.$oid));
    //console.log(notifydetail);

    fs.appendFileSync('upload_replyv2.json', JSON.stringify(notifydetail));

  });

};

function actorNotifyCreate(new_notify) {

  Actor.findOne({ username: new_notify.actor}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    console.log('Looking up Actor ID is : ' + act._id);
    var notifydetail = new Object();
    notifydetail.userPost = new_notify.userPostId;
    notifydetail.actor = {};
    notifydetail.notificationType = 'reply';
    notifydetail.replyBody = new_notify.body;
    notifydetail.actor.$oid = act._id.toString();
    notifydetail.time = timeStringToNum(new_notify.time);

    //console.log('Looking up Actor: ' + act.username);
    //console.log(mongoose.Types.ObjectId.isValid(notifydetail.actor.$oid));
    //console.log(notifydetail);

    fs.appendFileSync('upload_actorReplyV2.json', JSON.stringify(notifydetail));

  });

};

/*********************************
ORDER:
dropCollections
make actor
make posts
make comments
********************************/
function createActors() {
  for (var i = 0, len = actors_list.length; i < len; i++) {

        console.log("@@@Looking at "+actors_list[i].username);
        ActorCreate(actors_list[i]);

  }
}

function createPosts(){
  for (var i = 0, len = final_script.length; i < len; i++) {

        PostReplyCreateFinal(final_script[i]);
  }
}
db.once('open', function(){
  //dropCollections();
  createActors();
  createPosts();

  console.log('All done with populate!');
  console.log("Connection went as planned");
});
console.log(actors_list.length);
console.log(final_script.length);
