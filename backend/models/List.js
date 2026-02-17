const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a list title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
listSchema.index({ board: 1, position: 1 });
listSchema.index({ board: 1, isArchived: 1 });

module.exports = mongoose.model('List', listSchema);
