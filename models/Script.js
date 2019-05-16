const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scriptSchema = new mongoose.Schema({
  body: {type: String, default: '', trim: true},//body of the post
  post_id: Number, //post ID used in input file
  class: String, //experimental or normal
  picture: String, //filename for image in post
  highread: Number,//numbers for high-read condtion
  lowread: Number,//numbers for low-read condition
  likes: Number,//number of lieks the post has
  actor: {type: Schema.ObjectId, ref: 'Actor'}, //actor who wrote the post
  //reply: {type: Schema.ObjectId, ref: 'Script'},
  time: Number, //in millisecons

  //comments for this post (in an array)
  comments: [new Schema({
    class: String, //Bully, Marginal, normal, etc
    module: String, //name of mod for this script
    actor: {type: Schema.ObjectId, ref: 'Actor'},
    body: {type: String, default: '', trim: true}, //body of post or reply
    commentID: Number, //ID of the comment
    time: Number,//millisecons
    new_comment: {type: Boolean, default: false}, //is new comment
    likes: Number
    }, { versionKey: false })] //versioning messes up our updates to the DB sometimes, so we kill it here
},{ versionKey: false });

const Script = mongoose.model('Script', scriptSchema);

module.exports = Script;
