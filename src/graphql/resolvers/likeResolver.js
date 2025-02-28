import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { Like, Member } from '../../models/index.js';

const likeResolver = {
  Query: {
    // 모든 좋아요 조회
    getLikes: async (_, __, context) => {
      await authMiddleware({ request: context.request });
      try {
        const likes = await Like.find()
          .populate({
            path: 'commentId',
            populate: { path: 'memberId' }, // 글 작성자
          })
          .populate('memberId'); //좋아요를 누른 사용자

        const responseLikes = likes.map((like) => ({
          id: like._id.toString(),
          comment: like.commentId
            ? {
                ...like.commentId.toObject(),
                id: like.commentId._id.toString(),
                member: like.commentId.memberId, // ✅ `commentId.memberId`를 `comment.member`로 변환
              }
            : null,
          member: like.memberId, // ✅ `memberId`를 `member`로 변환
        }));

        return responseLikes;
      } catch (err) {
        throw new Error('Failed to fetch likes');
      }
    },
    // 특정 댓글에 대한 좋아요 조회
    getLikesByComment: async (_, { commentId }, context) => {
      await authMiddleware({ request: context.request });
      try {
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
          throw new Error(`Invalid commentId: ${commentId}`);
        }

        const likes = await Like.find({ commentId })
          .populate({
            path: 'commentId',
            populate: { path: 'memberId' }, // ✅ 댓글 작성자도 포함
          })
          .populate('memberId'); // ✅ 좋아요를 누른 사용자도 포함

        // ✅ GraphQL에서 `commentId.memberId`를 `comment.member`로 변환
        const responseLikes = likes.map((like) => ({
          id: like._id.toString(),
          comment: like.commentId
            ? {
                ...like.commentId.toObject(),
                id: like.commentId._id.toString(),
                member: like.commentId.memberId, // ✅ `commentId.memberId`를 `comment.member`로 변환
              }
            : null,
          member: like.memberId, // ✅ `memberId`를 `member`로 변환
        }));

        return responseLikes;
      } catch (err) {
        throw new Error('Failed to fetch likes by comment');
      }
    },
  },
  Mutation: {
    // 좋아요 생성 (현재 로그인한 회원이 좋아요)
    createLike: async (_, { commentId }, context) => {
      const userData = await authMiddleware({ request: context.request });
      try {
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
          throw new Error(`Invalid commentId: ${commentId}`);
        }
        const member = await Member.findOne({ email: userData.email });
        if (!member) throw new Error('Member not found');

        // 중복 좋아요 방지
        const existingLike = await Like.findOne({
          commentId,
          memberId: member._id,
        });
        if (existingLike) {
          throw new Error('You have already liked this comment');
        }

        const newLike = new Like({
          commentId: new mongoose.Types.ObjectId(commentId),
          memberId: member._id,
        });
        await newLike.save();
        const like = await Like.findById(newLike._id)
          .populate({
            path: 'commentId',
            populate: { path: 'memberId' }, // ✅ 댓글 작성자도 포함
          })
          .populate('memberId'); // ✅ 좋아요를 누른 사용자도 포함

        return {
          id: like._id.toString(),
          comment: like.commentId
            ? {
                ...like.commentId.toObject(),
                id: like.commentId._id.toString(),
                member: like.commentId.memberId, // ✅ `commentId.memberId`를 `comment.member`로 변환
              }
            : null,
          member: like.memberId, // ✅ `memberId`를 `member`로 변환
        };
      } catch (err) {
        throw new Error(`Failed to create like: ${err.message}`);
      }
    },
    // 좋아요 삭제 (해당 댓글에 대해 현재 회원이 누른 좋아요 삭제)
    deleteLike: async (_, { commentId }, context) => {
      const userData = await authMiddleware({ request: context.request });
      try {
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
          throw new Error(`Invalid commentId: ${commentId}`);
        }

        const member = await Member.findOne({ email: userData.email });
        if (!member) throw new Error('Member not found');

        const like = await Like.findOne({
          commentId,
          memberId: member._id,
        })
          .populate({
            path: 'commentId',
            populate: { path: 'memberId' },
          })
          .populate('memberId');
        if (!like) {
          throw new Error('Like not found');
        }

        await Like.findByIdAndDelete(like._id);
        return {
          ...like.toObject(),
          id: like._id.toString(),
          comment: like.commentId,
          member: like.memberId,
        };
      } catch (err) {
        throw new Error(`Failed to delete like: ${err.message}`);
      }
    },
  },
};

export default likeResolver;
