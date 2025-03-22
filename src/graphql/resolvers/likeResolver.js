import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { Like, Member } from '../../models/index.js';
import { getIsClicked, getLikeCount } from '../../utils/commentUtils.js';

const likeResolver = {
  Query: {
    // 모든 좋아요 조회
    getLikes: async (_, __, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        const likes = await Like.find()
          .populate({
            path: 'commentId',
            populate: { path: 'memberId' }, // 글 작성자
          })
          .populate('memberId'); //좋아요를 누른 사용자

        const responseLikes = await Promise.all(
          likes.map(async (like) => {
            const likeCount = await getLikeCount(like.commentId._id); // ✅ 최신 좋아요 개수 가져오기
            const isClicked = await getIsClicked(
              like.commentId._id,
              member._id
            );

            return {
              id: like._id.toString(),
              comment: {
                ...like.commentId.toObject(),
                id: like.commentId._id.toString(),
                member: like.commentId.memberId,
                taskId: like.commentId.taskId
                  ? like.commentId.taskId.toString()
                  : null,
                likeCount,
                isClicked,
              },

              member: like.memberId,
            };
          })
        );

        return responseLikes;
      } catch (err) {
        throw new Error('Failed to fetch likes');
      }
    },
    // 특정 댓글에 대한 좋아요 조회
    getLikesByComment: async (_, { commentId }, context) => {
      await authMiddleware({ request: context.request });
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

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
        const responseLikes = await Promise.all(
          likes.map(async (like) => {
            const likeCount = await getLikeCount(like.commentId._id); // ✅ 최신 좋아요 개수 가져오기
            const isClicked = await getIsClicked(
              like.commentId._id,
              member._id
            );

            return {
              id: like._id.toString(),
              comment: {
                ...like.commentId.toObject(),
                id: like.commentId._id.toString(),
                member: like.commentId.memberId,
                taskId: like.commentId.taskId
                  ? like.commentId.taskId.toString()
                  : null,
                likeCount,
                isClicked,
              },

              member: like.memberId,
            };
          })
        );

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
        const likeCount = await getLikeCount(commentId);
        const isClicked = await getIsClicked(commentId, member._id);
        console.log('like', JSON.stringify(like, null, 2));
        return {
          id: like._id.toString(),
          comment: {
            ...like.commentId.toObject(),
            id: like.commentId._id.toString(),
            member: like.commentId.memberId,
            taskId: like.commentId.taskId
              ? like.commentId.taskId.toString()
              : null,
            likeCount,
            isClicked,
          },
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
        const likeCount = await getLikeCount(commentId); // ✅ 최신 좋아요 개수 가져오기
        const isClicked = await getIsClicked(commentId, member._id); // ✅ 현재 사용자 좋아요 여부 가져오기

        return {
          ...like.toObject(),
          id: like._id.toString(),
          comment: {
            ...like.commentId.toObject(),
            id: like.commentId._id.toString(),
            member: like.commentId.memberId,
            taskId: like.commentId.taskId
              ? like.commentId.taskId.toString()
              : null,
            likeCount,
            isClicked,
          },
          member: like.memberId,
          likeCount,
          isClicked,
        };
      } catch (err) {
        throw new Error(`Failed to delete like: ${err.message}`);
      }
    },
  },
};

export default likeResolver;
