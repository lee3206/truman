const Script = require('../models/Script.js');
const User = require('../models/User.js');
const Notification = require('../models/Notification.js');
const _ = require('lodash');


/**
 * GET /
 * List of Script posts for Feed
*/
exports.getScript = (req, res, next) => {

  //req.user.createdAt
  var time_now = Date.now();
  var time_diff = time_now - req.user.createdAt;
  //Can crank this up or remove to remove post limit
  var time_limit = time_diff - 86400000; //one day in milliseconds

  var user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var userAgent = req.headers['user-agent'];


  console.log("$#$#$#$#$#$#$START GET SCRIPT$#$#$$#$#$#$#$#$#$#$#$#$#");
  User.findById(req.user.id)
  .populate({
       path: 'posts.reply',
       model: 'Script',
       populate: {
         path: 'actor',
         model: 'Actor'
       }
    })
  .populate({
       path: 'posts.actorAuthor',
       model: 'Actor'
    })
  .populate({
       path: 'posts.comments.actor',
        model: 'Actor'
    })
  .exec(function (err, user) {
  //User.findById(req.user.id, (err, user) => {

    //User is no longer active - study is over
    if (!user.active)
    {
      req.logout();
      req.flash('errors', { msg: 'Account is no longer active. Study is over' });
      res.redirect('/login');
    }
    //Loggs user
    user.logUser(time_now, userAgent, user_ip);

    Script.find()
    //Making edit here to remove 24 hour time limit
      //.where('time').lte(time_diff).gte(time_limit)
      .where('time').lte(time_diff)
      .sort('-time')
      .populate('actor')
      .populate({
       path: 'comments.actor',
       populate: {
         path: 'actor',
         model: 'Actor'
       }
    })
      .exec(function (err, script_feed) {
        if (err) { return next(err); }
        //Successful, so render

        //update script feed to see if reading and posts has already happened
        var finalfeed = [];

        var user_posts = [];

        //Look up Notifications??? And do this as well?
        //User posts based on posts between time limit (24 hours) and time_diff (current time)
        //user_posts = user.getPostInPeriod(time_limit, time_diff);
        user_posts = user.getPostInPeriod(time_diff);

        console.log("@@@@@@@@@@ User Post is size: "+user_posts.length);

        user_posts.sort(function (a, b) {
            return b.relativeTime - a.relativeTime;
          });

        while(script_feed.length || user_posts.length) {
          //console.log(typeof script_feed[0] === 'undefined');
          //console.log(user_posts[0].relativeTime);
          //console.log(feed[0].time)
          if(typeof script_feed[0] === 'undefined') {
              console.log("Script_Feed is empty, push user_posts");
              finalfeed.push(user_posts[0]);
              user_posts.splice(0,1);
          }
          else if(!(typeof user_posts[0] === 'undefined') && (script_feed[0].time < user_posts[0].relativeTime)){
              console.log("Push user_posts");
              finalfeed.push(user_posts[0]);
              user_posts.splice(0,1);
          }
          else{
            //console.log("ELSE PUSH FEED");
            var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == script_feed[0].id; });


            if(feedIndex!=-1)
            {
              //console.log("WE HAVE AN ACTION!!!!!");
              //check to see if there are comments - if so remove ones that are not in time yet.
              //Do all comment work here for feed
              if (Array.isArray(user.feedAction[feedIndex].comments) && user.feedAction[feedIndex].comments)
              {

                console.log("WE HAVE COMMENTS!!!!!");
                //iterate over all comments in post - add likes, flag, etc
                for (var i = 0; i < user.feedAction[feedIndex].comments.length; i++) {
                  //i is now user.feedAction[feedIndex].comments index

                    //is this action of new user made comment we have to add???
                    if (user.feedAction[feedIndex].comments[i].new_comment)
                    {

                      console.log("Adding a new Comment by the USER");
                      var cat = new Object();
                      cat.body = user.feedAction[feedIndex].comments[i].comment_body;
                      cat.new_comment = user.feedAction[feedIndex].comments[i].new_comment;
                      cat.time = user.feedAction[feedIndex].comments[i].time;
                      cat.commentID = user.feedAction[feedIndex].comments[i].new_comment_id;
                      cat.likes = 0;

                      script_feed[0].comments.push(cat);
                      console.log("Already have COMMENT ARRAY");


                    }

                    else
                    {
                      //Do something

                      var commentIndex = _.findIndex(script_feed[0].comments, function(o) { return o.id == user.feedAction[feedIndex].comments[i].comment; });

                      //If user action on Comment in Script Post
                      if(commentIndex!=-1)
                      {

                        //console.log("WE HAVE AN ACTIONS ON COMMENTS!!!!!");
                        //Action is a like (user liked this comment in this post)
                        if (user.feedAction[feedIndex].comments[i].liked)
                        {
                          script_feed[0].comments[commentIndex].liked = true;
                          script_feed[0].comments[commentIndex].likes++;
                          //console.log("Post %o has been LIKED", script_feed[0].id);
                        }

                        //Action is a FLAG (user Flaged this comment in this post)
                        if (user.feedAction[feedIndex].comments[i].flagged)
                        {
                          console.log("Comment %o has been LIKED", user.feedAction[feedIndex].comments[i].id);
                          script_feed[0].comments.splice(commentIndex,1);
                        }
                      }
                    }//end of ELSE

                }//end of for loop

              }//end of IF Comments
              if (user.feedAction[feedIndex].readTime[0])
              {
                script_feed[0].read = true;
                script_feed[0].state = 'read';
                //console.log("Post: %o has been READ", script_feed[0].id);
              }

              if (user.feedAction[feedIndex].liked)
              {
                script_feed[0].like = true;
                script_feed[0].likes++;
                //console.log("Post %o has been LIKED", script_feed[0].id);
              }

              if (user.feedAction[feedIndex].replyTime[0])
              {
                script_feed[0].reply = true;
                //console.log("Post %o has been REPLIED", script_feed[0].id);
              }

              //If this post has been flagged - remove it from FEED array (script_feed)
              if (user.feedAction[feedIndex].flagTime[0])
              {
                script_feed.splice(0,1);
                //console.log("Post %o has been FLAGGED", script_feed[0].id);
              }

              //post is from blocked user - so remove  it from feed
              else if (user.blocked.includes(script_feed[0].actor.username))
              {
                script_feed.splice(0,1);
              }

              else
              {
                //console.log("Post is NOT FLAGGED, ADDED TO FINAL FEED");
                finalfeed.push(script_feed[0]);
                script_feed.splice(0,1);
              }

              }//end of IF we found Feed_action

              else
              {
                //console.log("NO FEED ACTION SO, ADDED TO FINAL FEED");
                if (user.blocked.includes(script_feed[0].actor.username))
                {
                  script_feed.splice(0,1);
                }
                else
                {
                  finalfeed.push(script_feed[0]);
                  script_feed.splice(0,1);
                }
              }
            }//else in while loop
      }//while loop

      user.save((err) => {
        if (err) {
          return next(err);
        }
        //req.flash('success', { msg: 'Profile information has been updated.' });
      });


      res.render('script', { script: finalfeed });

      });//end of Script.find()


  });//end of User.findByID

};//end of .getScript

exports.getScriptPost = (req, res) => {

	Script.findOne({ _id: req.params.id}, (err, post) => {
		console.log(post);
		res.render('script_post', { post: post });
	});
};

/*
##############
NEW POST
Add a new post to the DB from the user
#############
*/
exports.newPost = (req, res) => {

  User.findById(req.user.id, (err, user) => {
    if (err) { return next(err); }

    console.log("Text Body of Post is "+req.body.body);

    var post = new Object();
    post.body = req.body.body;
    post.absTime = Date.now();
    post.relativeTime = post.absTime - user.createdAt;

    //if numPost/etc never existed yet, make it here - should never happen in new users
    if (!(user.numPosts) && user.numPosts < -1)
    {
      user.numPosts = -1;
      console.log("numPost is "+user.numPosts);
    }

    if (!(user.numReplies) && user.numReplies < -1)
    {
      user.numReplies = -1;
      console.log("numReplies is "+user.numReplies);
    }

    if (!(user.numActorReplies) && user.numActorReplies < -1)
    {
      user.numActorReplies = -1;
      console.log("numActorReplies is "+user.numActorReplies);
    }

    //New post - not a comment or reply
    if (req.file)
    {
      post.picture = req.file.filename;
      user.numPosts = user.numPosts + 1;
      post.postID = user.numPosts;
      post.type = "user_post";

      console.log("numPost is now "+user.numPosts);
      user.posts.unshift(post);
      console.log("CREATING NEW POST!!!");

      //Now we find any Actor Replies that go along with it
      Notification.find()
        .where('userPost').equals(post.postID)
        .where('notificationType').equals('reply')
        .populate('actor')
        .exec(function (err, actor_replies) {
          if (err) { return next(err); }
          //console.log("%^%^%^^%INSIDE NOTIFICATION&^&^&^&^&^&^&");
          if (actor_replies.length > 0)
          {
            //we have a actor reply that goes with this userPost
            //add them to the posts array
            console.log("@@@@@@@We have Actor Replies to add");
            for (var i = 0, len = actor_replies.length; i < len; i++) {
              var tmp_actor_reply = new Object();

              //actual actor reply information
              tmp_actor_reply.body = actor_replies[i].replyBody;
              //tmp_actor_reply.actorReplyID = actor_replies[i].replyBody;
              //might need to change to above
              user.numActorReplies = user.numActorReplies + 1;
              tmp_actor_reply.commentID = user.numActorReplies;
              tmp_actor_reply.actor = actor_replies[i].actor;


              //original post this is a reply to
              tmp_actor_reply.actorReplyOBody= post.body;
              tmp_actor_reply.actorReplyOPicture = post.picture
              tmp_actor_reply.actorReplyORelativeTime = post.relativeTime;

              var tmpTime = post.absTime + actor_replies[i].time

              tmp_actor_reply.absTime = new Date(tmpTime);
              tmp_actor_reply.relativeTime = post.relativeTime + actor_replies[i].time;


              //add to posts
              user.posts.push(tmp_actor_reply);

            }

          }//end of IF

          user.save((err) => {
            if (err) {
              return next(err);
            }
            res.redirect('/');
          });

        });//of of Notification

    }

    else if (req.body.reply)
    {
      post.reply = req.body.reply;
      post.type = "user_reply";
      user.numReplies = user.numReplies + 1;
      post.replyID = user.numReplies; //all reply posts are -1 as ID

      user.posts.unshift(post);
      console.log("CREATING REPLY");

      user.save((err) => {
        if (err) {
          return next(err);
        }
        //req.flash('success', { msg: 'Profile information has been updated.' });
        res.redirect('/');
      });

    }

    else
    {
      console.log("@#@#@#@#@#@#@#ERROR: Oh Snap, Made a Post but not reply or Pic")
      req.flash('errors', { msg: 'ERROR: Your post or reply did not get sent' });
      res.redirect('/');
    }

  });
};

/**
 * POST /feed/
 * Update user's feed posts Actions.
 All likes, flags, new comments (with actions on those comments as well)
 get added here
 */
exports.postUpdateFeedAction = (req, res, next) => {

  User.findById(req.user.id, (err, user) => {
    //somehow user does not exist here
    if (err) { return next(err); }

    console.log("@@@@@@@@@@@ TOP postID is  ", req.body.post_id);

    //find the object from the right post in feed
    var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == req.body.postID; });

    //console.log("index is  ", feedIndex);

    if(feedIndex==-1)
    {
      //Post does not exist yet in User DB, so we have to add it now
      //console.log("$$$$$Making new feedAction Object! at post ", req.body.postID);
      var cat = new Object();
      cat.post = req.body.postID;
      if(!(req.body.start))
        {
          //console.log("!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!@!No start");
        }
      cat.startTime = req.body.start;
      cat.rereadTimes = 0;
      //add new post into feedAction
      user.feedAction.push(cat);

    }
    else
    {
      //we found the right post, and feedIndex is the right index for it
      console.log("##### FOUND post "+req.body.post_id+" at index "+ feedIndex);


      //update to new StartTime
      if (req.body.start && (req.body.start > user.profile_feed[feedIndex].startTime))
      {

        user.profile_feed[feedIndex].startTime = req.body.start;
        user.profile_feed[feedIndex].rereadTimes++;

      }

      //array of readTimes is empty and we have a new READ event
      else if ((!user.profile_feed[feedIndex].readTime)&&req.body.read && (req.body.read > user.profile_feed[feedIndex].startTime))
      {
        let read = req.body.read - user.profile_feed[feedIndex].startTime
        //console.log("!!!!!New FIRST READ Time: ", read);
        user.profile_feed[feedIndex].readTime = [read];
        //console.log("!!!!!adding FIRST READ time [0] now which is  ", user.feedAction[feedIndex].readTime[0]);
      }

      //Already have a readTime Array, New READ event, need to add this to readTime array
      else if ((user.profile_feed[feedIndex].readTime)&&req.body.read && (req.body.read > user.profile_feed[feedIndex].startTime))
      {
        let read = req.body.read - user.profile_feed[feedIndex].startTime
        //console.log("%%%%%Add new Read Time: ", read);
        user.profile_feed[feedIndex].readTime.push(read);
      }

      //array of picture_clicks is empty and we have a new (first) picture_clicks event
      else if ((!user.profile_feed[feedIndex].picture_clicks)&&req.body.picture && (req.body.picture > user.profile_feed[feedIndex].startTime))
      {
        let picture = req.body.picture - user.profile_feed[feedIndex].startTime
        console.log("!!!!!New FIRST picture Time: ", picture);
        user.profile_feed[feedIndex].picture_clicks = [picture];
        console.log("!!!!!adding FIRST picture time [0] now which is  ", user.profile_feed[feedIndex].picture_clicks[0]);
      }

      //Already have a picture_clicks Array, New PICTURE event, need to add this to picture_clicks array
      else if ((user.profile_feed[feedIndex].picture_clicks)&&req.body.picture && (req.body.picture > user.profile_feed[feedIndex].startTime))
      {
        let picture = req.body.picture - user.profile_feed[feedIndex].startTime
        console.log("%%%%%Add new PICTURE Time: ", picture);
        user.profile_feed[feedIndex].picture_clicks.push(picture);
      }

      else
      {
        console.log("Got a POST that did not fit anything. Possible Error.")
      }

       //console.log("####### END OF ELSE post at index "+ feedIndex);

    }//else

    //console.log("@@@@@@@@@@@ ABOUT TO SAVE TO DB on Post ", req.body.postID);
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'Something in profile_feed went crazy. You should never see this.' });

          return res.redirect('/');
        }
        console.log(err);
        return next(err);
      }
      //req.flash('success', { msg: 'Profile information has been updated.' });
      //res.redirect('/account');
      //console.log("@@@@@@@@@@@ SAVED TO DB!!!!!!!!! ");
      res.send({result:"success"});
    });
  });
};

/**
 * POST /userPost_feed/
 * Update user's POST feed Actions.
 */
exports.postUpdateUserPostFeedAction = (req, res, next) => {

  User.findById(req.user.id, (err, user) => {
    //somehow user does not exist here
    if (err) { return next(err); }

    console.log("@@@@@@@@@@@ TOP USER profile is  ", req.body.postID);

    //find the object from the right post in feed
    var feedIndex = _.findIndex(user.posts, function(o) { return o.postID == req.body.postID; });

    console.log("User Posts index is  ", feedIndex);

    if(feedIndex==-1)
    {
      //User Post does  not exist yet, This is an error
      console.log("$$$$$ERROR: Can not find User POST ID: ", req.body.postID);

    }

   //create a new Comment
    else if(req.body.new_comment)
    {
        var cat = new Object();
        cat.new_comment = true;
        user.numReplies = user.numReplies + 1;
        cat.commentID = 900 + user.numReplies; //this is so it doesn't get mixed with actor comments
        cat.body = req.body.comment_text;
        cat.isUser = true;
        cat.absTime = Date.now();
        cat.time = cat.absTime - user.createdAt;
        user.posts[feedIndex].comments.push(cat);
        console.log("$#$#$#$#$#$$New  USER COMMENT Time: ", cat.time);
    }

    //Are we doing anything with a comment?
    else if(req.body.commentID)
    {
      var commentIndex = _.findIndex(user.posts[feedIndex].comments, function(o) { return o.commentID == req.body.commentID; });

      //no comment in this post-actions yet
      if(commentIndex==-1)
      {
        console.log("!!!!!!Error: Can not find Comment for some reason!");
      }

      //LIKE A COMMENT
      else if(req.body.like)
      {

        console.log("%^%^%^%^%^%User Post comments LIKE was: ", user.posts[feedIndex].comments[commentIndex].liked);
        user.posts[feedIndex].comments[commentIndex].liked = user.posts[feedIndex].comments[commentIndex].liked ? false : true;
        console.log("^&^&^&^&^&User Post comments LIKE was: ", user.posts[feedIndex].comments[commentIndex].liked);
      }

      //FLAG A COMMENT
      else if(req.body.flag)
      {
        console.log("%^%^%^%^%^%User Post comments FLAG was: ", user.posts[feedIndex].comments[commentIndex].flagged);
        user.posts[feedIndex].comments[commentIndex].flagged = user.posts[feedIndex].comments[commentIndex].flagged ? false : true;
        console.log("%^%^%^%^%^%User Post comments FLAG was: ", user.posts[feedIndex].comments[commentIndex].flagged);
      }

    }//end of all comment junk

    else
    {
      //we found the right post, and feedIndex is the right index for it
      console.log("##### FOUND post "+req.body.postID+" at index "+ feedIndex);


        //array of likeTime is empty and we have a new (first) LIKE event
        if (req.body.like)
        {

          console.log("!!!!!!User Post LIKE was: ", user.posts[feedIndex].liked);
          user.posts[feedIndex].liked = user.posts[feedIndex].liked ? false : true;
          console.log("!!!!!!User Post LIKE is now: ", user.posts[feedIndex].liked);
        }


      else
      {
        console.log("Got a POST that did not fit anything. Possible Error.")
      }

    }//else

    //console.log("@@@@@@@@@@@ ABOUT TO SAVE TO DB on Post ", req.body.postID);
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'Something in profile_feed went crazy. You should never see this.' });

          return res.redirect('/');
        }
        console.log(err);
        return next(err);
      }
      //req.flash('success', { msg: 'Profile information has been updated.' });
      //res.redirect('/account');
      //console.log("@@@@@@@@@@@ SAVED TO DB!!!!!!!!! ");
      res.send({result:"success"});
    });
  });
}
