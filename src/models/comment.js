import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    content: { type: String, required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    likeCount: { type: Number, default: 0 },
    isClicked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

commentSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'commentId',
});

commentSchema.virtual('computedLikeCount').get(function () {
  if (this.populated('likes')) {
    return this.likes.length;
  }
  return this.likeCount;
});

commentSchema.methods.getIsClicked = async function (
  currentMemberId,
  LikeModel
) {
  const existingLike = await LikeModel.findOne({
    commentId: this._id,
    memberId: currentMemberId,
  });
  return !!existingLike;
};

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
