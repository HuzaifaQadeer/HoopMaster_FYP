const Post = require('../models/postModel');
const User = require('../models/userModel');
const Comment = require('../models/commentModel');
const fs = require('fs');
const path = require('path');

// Helper function to format post data
const formatPostData = async (post, userId = null) => {
  // Populate user data
  await post.populate('user', 'displayName username profilePicture');
  
  const formattedPost = post.toObject({ virtuals: true });
  
  // Add additional fields if user ID is provided
  if (userId) {
    formattedPost.isLiked = post.isLikedBy(userId);
  }
  
  return formattedPost;
};

// Get all posts
exports.getAllPosts = async (req, res) => {
  try {
    const { limit = 20, page = 1, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Base query excludes deleted posts
    const query = { isDeleted: false };
    
    // If userId provided, filter by user
    if (userId) {
      query.user = userId;
    }
    
    // For admin users, show all posts regardless of privacy
    if (req.user && req.user.isAdmin) {
      // No additional filters for admins
    }
    // For regular authenticated users, show public posts or their own posts
    else if (req.user) {
      query.$or = [
        { isPrivate: false },
        { user: req.user._id }
      ];
    } 
    // For non-authenticated users, only show public posts
    else {
      query.isPrivate = false;
    }
    
    console.log('Post query:', JSON.stringify(query));
    
    const posts = await Post.find(query)
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('Found posts:', posts.length);
    
    // Format each post
    const formattedPosts = await Promise.all(
      posts.map(post => formatPostData(post, req.user ? req.user._id : null))
    );
    
    // Get total count for pagination
    const total = await Post.countDocuments(query);
    
    res.status(200).json({
      posts: formattedPosts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ message: 'Error retrieving posts' });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    console.log('[Debug Backend] Getting post with ID:', req.params.id);
    console.log('[Debug Backend] User auth:', req.user ? `Authenticated as ${req.user._id}` : 'Not authenticated');
    
    const post = await Post.findOne({ 
      _id: req.params.id,
      isDeleted: false
    });
    
    if (!post) {
      console.log(`[Debug Backend] Post ${req.params.id} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log(`[Debug Backend] Found post: ${post._id}, private: ${post.isPrivate}`);
    
    // Check if user can view this post (public or owned by user)
    if (post.isPrivate) {
      console.log('[Debug Backend] Post is private, checking permissions');
      // If post is private, check if user is authenticated and is the owner
      if (!req.user || post.user.toString() !== req.user._id.toString()) {
        console.log('[Debug Backend] Permission denied for private post');
        return res.status(403).json({ message: 'You do not have permission to view this post' });
      }
    }
    
    const formattedPost = await formatPostData(post, req.user ? req.user._id : null);
    console.log('[Debug Backend] Returning formatted post data');
    res.status(200).json(formattedPost);
  } catch (error) {
    console.error('[Debug Backend] Error getting post:', error);
    res.status(500).json({ message: 'Error retrieving post' });
  }
};

// Create new post
exports.createPost = async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    const userId = req.user._id;
    
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Post must contain text or media' });
    }
    
    const postData = {
      content: content || '',
      user: userId,
      isPrivate: isPrivate === 'true' || isPrivate === true
    };
    
    // Handle media upload if present
    if (req.file) {
      try {
        // Determine media type based on file mimetype
        const isImage = req.file.mimetype.startsWith('image');
        const isVideo = req.file.mimetype.startsWith('video');
        
        if (!isImage && !isVideo) {
          return res.status(400).json({ message: 'Invalid file type' });
        }
        
        // Extract the filename and folder from the path
        let folder, filename;
        try {
          // Handle Windows-style paths
          if (req.file.path.includes('\\')) {
            const pathParts = req.file.path.split('Server\\posts\\')[1].split('\\');
            folder = pathParts[0]; // 'images' or 'videos'
            filename = pathParts[1];
          } 
          // Handle Unix-style paths
          else if (req.file.path.includes('/')) {
            const pathParts = req.file.path.split('Server/posts/')[1].split('/');
            folder = pathParts[0]; // 'images' or 'videos'
            filename = pathParts[1];
          }
          // Fallback if path format is unexpected
          else {
            console.error('Unexpected path format:', req.file.path);
            folder = isImage ? 'images' : 'videos';
            filename = path.basename(req.file.path);
          }
          
          console.log('Extracted path info:', { folder, filename, originalPath: req.file.path });
        } catch (pathError) {
          console.error('Error parsing file path:', pathError, req.file.path);
          // Fallback to a simpler approach
          folder = isImage ? 'images' : 'videos';
          filename = path.basename(req.file.path);
        }
        
        // Create the media URL using the new path format
        const mediaUrl = `/posts/${folder}/${filename}`;
        
        // Add media data to post
        postData.media = {
          type: isImage ? 'image' : 'video',
          url: mediaUrl
        };
        postData.hasMedia = true;
      } catch (uploadError) {
        console.error('Error processing media:', uploadError);
        // Clean up temp file if exists
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: 'Error processing media' });
      }
    }
    
    // Create and save post
    try {
      const post = new Post(postData);
      console.log('Attempting to save post with data:', JSON.stringify(postData, null, 2));
      await post.save();
      
      const formattedPost = await formatPostData(post, userId);
      res.status(201).json(formattedPost);
    } catch (saveError) {
      console.error('Error saving post to database:', saveError);
      // Clean up the uploaded file since the post creation failed
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up file after failed post creation:', req.file.path);
      }
      res.status(500).json({ message: `Database error: ${saveError.message}` });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    // Clean up temp file if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error creating post' });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { content, isPrivate } = req.body;
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this post' });
    }
    
    // Update fields
    if (content !== undefined) post.content = content;
    if (isPrivate !== undefined) post.isPrivate = isPrivate === 'true' || isPrivate === true;
    
    await post.save();
    
    const formattedPost = await formatPostData(post, req.user._id);
    res.status(200).json(formattedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this post' });
    }
    
    // If post has media, delete the file
    if (post.hasMedia && post.media && post.media.url) {
      try {
        // Extract the file path from the URL
        const mediaUrl = post.media.url;
        if (mediaUrl.startsWith('/posts/')) {
          // Format: /posts/folder/filename
          const pathParts = mediaUrl.split('/');
          if (pathParts.length >= 4) {
            const folder = pathParts[2]; // 'images' or 'videos'
            const filename = pathParts[3];
            
            // Construct the file path
            const filePath = path.join(__dirname, '../../Server/posts', folder, filename);
            console.log('Attempting to delete file:', filePath);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted media file: ${filePath}`);
            } else {
              console.log(`File not found at path: ${filePath}`);
            }
          }
        }
      } catch (deleteError) {
        console.error('Error deleting media file:', deleteError);
        // Continue with post deletion even if file deletion fails
      }
    }
    
    // Soft delete
    post.isDeleted = true;
    await post.save();
    
    // Also mark all comments as deleted
    await Comment.updateMany(
      { post: post._id },
      { isDeleted: true }
    );
    
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Like/unlike a post
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findOne({ 
      _id: req.params.id,
      isDeleted: false 
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Toggle like
    const isLiked = post.toggleLike(req.user._id);
    await post.save();
    
    res.status(200).json({ 
      message: isLiked ? 'Post liked' : 'Post unliked',
      isLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error processing like' });
  }
};

// Get post comments
exports.getPostComments = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('[Debug Backend] Getting comments for post ID:', req.params.id);
    console.log('[Debug Backend] User auth:', req.user ? `Authenticated as ${req.user._id}` : 'Not authenticated');
    console.log('[Debug Backend] Query params:', { limit, page, skip });
    
    const post = await Post.findOne({
      _id: req.params.id,
      isDeleted: false
    });
    
    if (!post) {
      console.log(`[Debug Backend] Post ${req.params.id} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log(`[Debug Backend] Found post: ${post._id}, private: ${post.isPrivate}`);
    
    // Check if user can view this post (public or owned by user)
    if (post.isPrivate) {
      console.log('[Debug Backend] Post is private, checking permissions');
      // If post is private, check if user is authenticated and is the owner
      if (!req.user || post.user.toString() !== req.user._id.toString()) {
        console.log('[Debug Backend] Permission denied for private post');
        return res.status(403).json({ message: 'You do not have permission to view this post' });
      }
    }
    
    const comments = await Comment.find({
      post: req.params.id,
      isDeleted: false
    })
      .populate('user', 'displayName username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log(`[Debug Backend] Retrieved ${comments.length} comments`);
    res.status(200).json(comments);
  } catch (error) {
    console.error('[Debug Backend] Error getting comments:', error);
    res.status(500).json({ message: 'Error retrieving comments' });
  }
};

// Get post media
exports.getPostMedia = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      isDeleted: false,
      hasMedia: true
    });
    
    if (!post) {
      return res.status(404).json({ message: 'Post or media not found' });
    }
    
    // Check if user can view this post (public or owned by user)
    if (post.isPrivate) {
      // If post is private, check if user is authenticated and is the owner
      if (!req.user || post.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You do not have permission to view this media' });
      }
    }
    
    // Return the media URL
    res.status(200).json({ 
      mediaUrl: post.media.url,
      mediaType: post.media.type
    });
  } catch (error) {
    console.error('Error getting post media:', error);
    res.status(500).json({ message: 'Error retrieving media' });
  }
};
