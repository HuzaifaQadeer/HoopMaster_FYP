const cron = require('node-cron');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const fs = require('fs');
const path = require('path');

// Run once a day at 1:00 AM (offset from challenge expiration to avoid concurrency issues)
const schedule = '0 1 * * *';

const cleanupOldPosts = async () => {
  try {
    console.log('Running post cleanup job...');
    
    // Calculate the date threshold (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log(`Deleting posts older than: ${sevenDaysAgo.toISOString()}`);
    
    // Find posts older than 7 days
    const oldPosts = await Post.find({
      createdAt: { $lt: sevenDaysAgo },
      isDeleted: false
    });
    
    console.log(`Found ${oldPosts.length} posts to delete`);
    
    let deletedPosts = 0;
    let deletedComments = 0;
    let deletedMediaFiles = 0;
    
    // Process each post
    for (const post of oldPosts) {
      try {
        // 1. Delete related comments
        const commentsResult = await Comment.updateMany(
          { postId: post._id, isDeleted: false },
          { isDeleted: true }
        );
        
        const commentCount = commentsResult.modifiedCount;
        deletedComments += commentCount;
        
        // 2. Delete the media file if it exists
        if (post.hasMedia && post.mediaUrl) {
          try {
            // Extract the file path from the URL
            const urlParts = post.mediaUrl.split('/uploads');
            if (urlParts.length > 1) {
              const relativePath = urlParts[1];
              const filePath = path.join(__dirname, '../uploads', relativePath);
              
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deletedMediaFiles++;
              }
            }
          } catch (mediaError) {
            console.error(`Error deleting media for post ${post._id}:`, mediaError);
          }
        }
        
        // 3. Mark the post as deleted
        post.isDeleted = true;
        await post.save();
        deletedPosts++;
        
        console.log(`Deleted post ${post._id} with ${commentCount} comments`);
      } catch (postError) {
        console.error(`Error processing post ${post._id}:`, postError);
      }
    }
    
    console.log(`Post cleanup completed: ${deletedPosts} posts, ${deletedComments} comments, and ${deletedMediaFiles} media files deleted`);
  } catch (error) {
    console.error('Error in post cleanup cron job:', error);
  }
};

// Start the cron job
const startCronJob = () => {
  cron.schedule(schedule, cleanupOldPosts);
  console.log(`Post cleanup cron job scheduled: ${schedule}`);
  
  // For development, you can also run it immediately
  // cleanupOldPosts();
};

module.exports = {
  startCronJob,
  cleanupOldPosts // Export for manual triggering
}; 