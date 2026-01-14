const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET /blog
// Description: List all blog posts, sorted by newest first
router.get('/', async (req, res) => {
  try {
    // Populate 'author' to get the Coach's name and details
    const posts = await Post.find()
      .sort({ publishedAt: -1 })
      .populate('author', 'firstName lastName profileImage'); 
    
    res.render('blog/index', { 
      title: 'Avanza Blog', 
      posts: posts,
      user: req.user || null // Pass user if logged in
    });
  } catch (err) {
    console.error("Error fetching blog posts:", err);
    res.status(500).render('error', { message: 'Could not load blog posts' });
  }
});

// GET /blog/:slug
// Description: View a single blog post
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate('author', 'firstName lastName bio profileImage');

    if (!post) {
      return res.status(404).render('404', { title: 'Post Not Found' });
    }

    res.render('blog/show', { 
      title: post.title, 
      post: post,
      user: req.user || null
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).render('error', { message: 'Could not load post' });
  }
});

module.exports = router;