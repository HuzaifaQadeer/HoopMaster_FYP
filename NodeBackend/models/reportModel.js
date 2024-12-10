const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contentType: {
    type: String,
    enum: ['post', 'comment', 'user'],
    required: true
  },
  contentId: mongoose.Schema.Types.ObjectId,
  reason: { type: String, required: true },
  comment: String,
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminAction: {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    action: String,
    date: Date,
    notes: String
  }
}, { timestamps: true }); 