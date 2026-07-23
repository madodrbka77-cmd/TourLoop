const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      max: 500,
    },
    img: {
      type: String,
    },
    video: {
        type: String,
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: [
        {
            userId: String,
            username: String,
            profilePicture: String,
            comment: String,
            time: { type: Date, default: Date.now }
        }
    ],
    isPinned: {
        type: Boolean,
        default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);