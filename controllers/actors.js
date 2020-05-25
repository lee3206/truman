const Actor = require('../models/Actor.js');
const Script = require('../models/Script.js');
const User = require('../models/User');
var ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');

/**
 * GET /
 * List of Actors.
*/

exports.getActors = (req, res) => {
  Actor.find((err, docs) => {


    res.render('actors', { actors: docs });


  });
};

exports.getActor = (req, res, next) => {

  var time_diff = Date.now() - req.user.createdAt;

  console.log("START HERE Our Paramater is:::::");
  console.log(req.params.userId);
  console.log("Time Diff");
  console.log(time_diff);
  //Find a user (which is actually an actor)
  User.findById(req.user.id)
  .exec(function (err, user) {
  //See, we are actually finding an actor
	Actor.findOne({ username: req.params.userId}, (err, act) => {
    if (err) { console.log(err); return next(err); }

    //If the actor isn't here, return NULLLLLLLLLLL, else, print actor to console
    if (act == null) {console.log("NULLLLLLLLLLL");  var myerr = new Error('Record not found!'); return next(myerr); }

    console.log(act);
    console.log("&&&&&&&&&&&&&&&&&&&&&");

    user.logPage(Date.now(), req.params.userId);
    console.log("We found an actor!")

    var isBlocked;
    //If the user (actually an actor) is blocked by the user, block, if not don't
    if (user.blocked.includes(req.params.userId))
    {
      isBlocked = true;
    }
    else
    {
      isBlocked = false;
    }
    //Look in the script and match to id.
    Script.find({ actor: act.id})
    //Maybe it's the time? Turning it off didn't seem to do anything, but I removed anyway
    .where('time')//.lte(time_diff)
    //sort in reverse time order?
    .sort('-time')
    //
    .populate('actor')
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
    /*
    .populate({
     path: 'comments.actor',
     //I think something is broken here for having bios contain all posts
     populate: {
       path: 'actor',
       model: 'Actor'
     },
     path: 'reply',
     populate: {
       path: 'actor',
       model: 'Actor'
       }
    })
    */
    .exec(function (err, script_feed) {
      if (err) { console.log(err); return next(err); }


      for (var i = script_feed.length - 1; i >= 0; i--) {

        var feedIndex = _.findIndex(user.feedAction, function(o) { return o.post == script_feed[i].id; });
        console.log('Feed index is: ' +feedindex);

          if(feedIndex!=-1)
          {
            console.log("WE HAVE AN ACTION!!!!!");

            if (user.feedAction[feedIndex].readTime[0])
            {
              script_feed[i].read = true;
              script_feed[i].state = 'read';
              console.log("Post: %o has been READ", script_feed[i].id);
            }

            if (user.feedAction[feedIndex].liked)
            {
              script_feed[i].like = true;
              script_feed[i].likes++;
              console.log("Post %o has been LIKED", script_feed[i].id);
            }

            if (user.feedAction[feedIndex].replyTime[0])
            {
              script_feed[i].reply = true;
              console.log("Post %o has been REPLIED", script_feed[i].id);
            }

            //If this post has been flagged - remove it from FEED array (script_feed)
            if (user.feedAction[feedIndex].flagTime[0])
            {
              script_feed.splice(i,1);
              console.log("Post %o has been FLAGGED", script_feed[i].id);
            }

          }//end of IF we found Feed_action



      }

      user.save((err) => {
        if (err) {
          return next(err);
        }
      });
      console.log("Is the actor blocked?: "+isBlocked);
      res.render('actor', { script: script_feed, actor: act, blocked:isBlocked });
    });

 // }

  });//Actor Find One
});//User.findbyID
};


/**
 * POST /feed/
 * Update user's feed posts Actions.
 */
exports.postBlockOrReport = (req, res, next) => {

  User.findById(req.user.id, (err, user) => {
    //somehow user does not exist here
    if (err) { return next(err); }

    //if we have a blocked user and they are not already in the list, add them now
    if (req.body.blocked && !(user.blocked.includes(req.body.blocked)))
    {
      user.blocked.push(req.body.blocked);

      var log = {};
      log.time = Date.now();
      log.action = "block";
      log.actorName = req.body.blocked
      user.blockAndReportLog.push(log);
    }

    //if we have a reported user and they are not already in the list, add them now
    else if (req.body.reported && !(user.reported.includes(req.body.reported)))
    {
      console.log("@@@Reporting a user now")
      user.reported.push(req.body.reported);
      var log = {};
      log.time = Date.now();
      log.action = "report";
      log.actorName = req.body.reported;
      log.report_issue = req.body.report_issue;
      user.blockAndReportLog.push(log);
    }

    else if (req.body.unblocked && user.blocked.includes(req.body.unblocked))
    {
      var index = user.blocked.indexOf(req.body.unblocked);
      user.blocked.splice(index, 1);

      var log = {};
      log.time = Date.now();
      log.action = "unblock";
      log.actorName = req.body.unblocked
      user.blockAndReportLog.push(log);
    }


    user.save((err) => {
      if (err) {
        return next(err);
      }
      res.send({result:"success"});
    });
  });
};
