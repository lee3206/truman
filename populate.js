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
async function readData() {
  try{
    actors_list= require('./final_data/final_actors.json');
    notifications_list= require('./final_data/test_notifications.json');
    //A script is synonomous with posts
    final_script = require('./final_data/final_script.json');
  }
  catch(err) {
    console.log('Error occured when trying to read data', err);
  }
}



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
//var connection = mongo.connect('mongodb://127.0.0.1/test');
mongoose.connect(process.env.PRO_MONGODB_URI || process.env.PRO_MONGOLAB_URI);
var db = mongoose.connection;
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});
/*
db.once('open', function(){
  dropCollections();
  for (var i = 0, len = actors_list.length; i < len; i++) {

        console.log("@@@Looking at "+actors_list[i].username);
        ActorCreate(actors_list[i]);

  }
  for (var i = 0, len = final_script.length; i < len; i++) {

        PostReplyCreateFinal(final_script[i]);
  }

  console.log('All done with populate!');
  console.log("Connection went as planned");
}).then(function){
    mongoose.connection.close();
};
*/

/*
drop existing collections before loading
to make sure we dont overwrite the data
incase we run the script twice or more
*/
function dropCollections() {
    db.collections['actor'].drop(function (err) {
        console.log('actor collection dropped');
    });
    db.collections['script'].drop(function (err) {
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


//This is never called anywhere, don't know what it is about
/****
function highActorCreate(random_actor) {
  actordetail = {};
  actordetail.profile = {};

  actordetail.profile.name = random_actor.name.first.capitalize() +' '+random_actor.name.last.capitalize();
  actordetail.profile.gender = random_actor.gender;
  actordetail.profile.location = random_actor.location.city.capitalize() +', '+random_actor.location.state.capitalize();
  actordetail.profile.picture = random_actor.picture.large;
  actordetail.class = 'high_read';
  actordetail.username = random_actor.login.username;



  var actor = new Actor(actordetail);

  actor.save(function (err) {
    if (err) {
      console.log("Something went wrong!!!")
      return -1;
    }
    console.log('New high Actor: ' + actor.username);
  });

}
********/

//THIS MUST BE CALLED FIRST TO CREATE ACTORS
//TRYING SOMETHING NEWSSWWSA
function createActorInstances(){

  async.each(actors_list, function (actor_raw,callback) {
      actordetail = {};
      actordetail.profile = {};
      actordetail.profile.name = actor_raw.name
      actordetail.profile.location = actor_raw.location;
      actordetail.profile.picture = actor_raw.picture;
      actordetail.profile.bio = actor_raw.bio;
      actordetail.profile.age = actor_raw.age;
      //actordetail.class = actor_raw.class;
      actordetail.username = actor_raw.username;
      var actor = new Actor(actordetail);

      actor.save(function (err){
        if (err){
          console.log("Something is bad!!!");
          return -1;
        }
        console.log('New Actor: '+actor.username);
        callback();
      });
    },
      function (err) {
        console.log("ALL DONE YA SHITS");
        return 'Loaded Actors'
      }
  );
}
/*
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
*/
/*
function PostCreate(new_post) {

  Actor.findOne({ username: new_post.actor}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    console.log('Looking up Actor ID is : ' + act._id);
    var postdetail = new Object();
    postdetail.actor = {};
    postdetail.body = new_post.body
    postdetail.post_id = new_post.id;
    postdetail.class = new_post.class;
    postdetail.picture = new_post.picture;
    postdetail.likes = getLikes();
    postdetail.lowread = getReads(6,20);
    postdetail.highread = getReads(145,203);
    postdetail.actor.$oid = act._id.toString();
    //postdetail.actor=`${act._id}`;
    //postdetail.actor2=act;
    postdetail.time = timeStringToNum(new_post.time);

    console.log('Looking up Actor: ' + act.username);
    //console.log(mongoose.Types.ObjectId.isValid(postdetail.actor.$oid));
    //console.log(postdetail);

    fs.appendFileSync('upload_postsv1.json', JSON.stringify(postdetail));


  });

};

*/
function PostReplyCreateFinal(new_post){

Script.findOne({ post_id: new_post.replyID}, function(err, pr){
      if(err) {
        console.log(err);
        return
      }

      console.log('In SCRIPT');
      console.log('In Reply: ' + pr._id);

      console.log('Looking up Actor ID is : ' + act._id);
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
      postdetail.reply.$oid = pr._id.toString();

      postdetail.time = new_post.time;
      //Not sure what is going on here. Does this save to the DB?
      // TODO:
      fs.appendFileSync('upload_post_replyv2.json', JSON.stringify(postdetail));


    });


}
/*
function PostReplyCreate(new_post) {

   Actor.findOne({ username: new_post.actor}, function(err, act){
    if(err) {
      console.log(err);
      return
    }
    console.log('Looking up Actor: ' + act.username);
    console.log('Try for post: ' + new_post.reply);
    var postdetail = new Object();
    postdetail.actor = {};
    postdetail.replyID = new_post.reply;
    postdetail.body = new_post.body
    postdetail.post_id = 300 + new_post.id;
    postdetail.class = new_post.class;
    postdetail.picture = new_post.picture;
    postdetail.likes = getLikes();
    postdetail.lowread = getReads(6,20);
    postdetail.highread = getReads(145,203);
    postdetail.actor.$oid = act._id.toString();
    //postdetail.reply.$oid = pr._id.toString();
    console.log('Time is now: ' + new_post.time);
    postdetail.time = timeStringToNum(new_post.time);
    fs.appendFileSync('upload_post_replyv0.json', JSON.stringify(postdetail));
  });
};

*/

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

async function loadDatabase(){
  try{
    await promisify(dropCollections);
    await promisify(readData);
    await promisify(createActorInstances);
  } catch (err) {
    console.log('Error occured in Loading', err);
  }
}

loadDatabase();
/*

dropCollections();
for (var i = 0, len = actors_list.length; i < len; i++) {

      console.log("@@@Looking at "+actors_list[i].username);
      ActorCreate(actors_list[i]);

}
for (var i = 0, len = final_script.length; i < len; i++) {

      PostReplyCreateFinal(final_script[i]);
}

console.log('All done with populate!');
*/
    //All done, disconnect from database
  //  mongoose.connection.close();
