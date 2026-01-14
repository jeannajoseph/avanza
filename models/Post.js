const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  // The 'slug' is for the URL (e.g. avanza.education/blog/my-first-post)
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  // 'content' will store your blog text (HTML or Markdown)
  content: {
    type: String,
    required: true
  },
  // 'coverImage' stores the URL to the image in Blob Storage/S3
  coverImage: {
    type: String 
  },
  // Links this post to a specific Coach
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach', 
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);