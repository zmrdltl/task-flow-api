import mongoose from 'mongoose';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { Comment, Member, Task, Project } from '../../models/index.js';
import { getIsClicked, getLikeCount } from '../../utils/commentUtils.js';

const commentResolver = {
  Query: {
    // 모든 댓글 조회 (회원, 태스크, 프로젝트 정보 populate)
    getComments: async (_, __, context) => {
      try {
        const userData = await authMiddleware({ request: context.request });
        const member = await Member.findOne({ email: userData.email });

        const comments = await Comment.find()
          .populate('memberId')
          .populate('taskId');
        if (!comments.length) return [];

        return await Promise.all(
          comments.map(async (comment) => ({
            ...comment._doc,
            id: comment._id.toString(),
            member: comment.memberId,
            task: comment.taskId,
            isClicked: await getIsClicked(comment._id, member._id),
            likeCount: await getLikeCount(comment._id),
          }))
        );
      } catch (err) {
        console.error('❌ Error in getComments:', err.message);
        throw new Error('Failed to fetch comments: ' + err.message);
      }
    },

    // 특정 댓글 조회
    getCommentById: async (_, { id }, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        const comment = await Comment.findById(id)
          .populate('memberId')
          .populate('taskId');
        if (!comment) throw new Error('Comment not found');
        return {
          ...comment._doc,
          id: comment._id.toString(),
          member: comment.memberId,
          task: comment.taskId,
          isClicked: await getIsClicked(comment._id, member._id),
          likeCount: await getLikeCount(comment._id),
        };
      } catch (err) {
        throw new Error('Failed to fetch comment');
      }
    },
    // 태스크별 댓글 조회
    getCommentsByTask: async (_, { taskId }, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
          throw new Error(`Invalid taskId: ${taskId}`);
        }
        const comments = await Comment.find({ taskId })
          .populate('memberId')
          .populate('taskId');
        if (!comments.length) return [];

        return await Promise.all(
          comments.map(async (comment) => ({
            ...comment._doc,
            id: comment._id.toString(),
            member: comment.memberId,
            task: comment.taskId,
            isClicked: await getIsClicked(comment._id, member._id),
            likeCount: await getLikeCount(comment._id),
          }))
        );
      } catch (err) {
        throw new Error('Failed to fetch comments by task');
      }
    },
    // 프로젝트별 댓글 조회
    getCommentsByProject: async (_, { projectId }, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          throw new Error(`Invalid projectId: ${projectId}`);
        }
        const comments = await Comment.find({ projectId })
          .populate('memberId')
          .populate('taskId');
        if (!comments.length) return [];
        return await Promise.all(
          comments.map(async (comment) => ({
            ...comment._doc,
            id: comment._id.toString(),
            member: comment.memberId,
            task: comment.taskId,
            isClicked: await getIsClicked(comment._id, member._id),
            likeCount: await getLikeCount(comment._id),
          }))
        );
      } catch (err) {
        throw new Error('Failed to fetch comments by project');
      }
    },
  },
  Mutation: {
    // 댓글 생성 (현재 로그인한 회원이 작성자로 등록)
    createComment: async (_, { content, taskId, projectId }, context) => {
      const userData = await authMiddleware({ request: context.request });

      const member = await Member.findOne({ email: userData.email });

      if (!member) {
        throw new Error('❌ Member not found in database');
      }

      const memberId = member._id;

      try {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
          throw new Error(`Invalid memberId: ${memberId}`);
        }
        if (taskId && !mongoose.Types.ObjectId.isValid(taskId)) {
          throw new Error(`Invalid taskId: ${taskId}`);
        }
        if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
          throw new Error(`Invalid projectId: ${projectId}`);
        }

        const newComment = new Comment({
          memberId,
          content,
          taskId: taskId ? new mongoose.Types.ObjectId(taskId) : undefined,
          projectId: projectId
            ? new mongoose.Types.ObjectId(projectId)
            : undefined,
        });

        await newComment.save();

        const savedComment = await Comment.findById(newComment._id)
          .populate('memberId')
          .populate('taskId');

        return {
          ...savedComment._doc,
          id: savedComment._id.toString(),
          member: savedComment.memberId,
          task: savedComment.taskId,
          isClicked: await getIsClicked(savedComment._id, member._id),
          likeCount: await getLikeCount(savedComment._id),
        };
      } catch (err) {
        throw new Error(`Failed to create comment: ${err.message}`);
      }
    },

    // 댓글 수정 (내용 업데이트)
    updateComment: async (_, { id, content }, context) => {
      await authMiddleware({ request: context.request });
      try {
        const comment = await Comment.findByIdAndUpdate(
          id,
          { content, updatedAt: new Date() },

          { new: true }
        )
          .populate('memberId')
          .populate('taskId');

        if (!comment) throw new Error('Comment not found');
        return {
          ...comment._doc,
          id: comment._id.toString(),
          member: comment.memberId,
          task: comment.taskId,
          isClicked: await getIsClicked(comment._id, member._id),
          likeCount: await getLikeCount(comment._id),
        };
      } catch (err) {
        throw new Error(`Failed to update comment: ${err.message}`);
      }
    },
    // 댓글 삭제
    deleteComment: async (_, { id }, context) => {
      await authMiddleware({ request: context.request });
      try {
        const comment = await Comment.findByIdAndUpdate(
          id,
          { expiredAt: new Date() }, // ✅ 삭제 시 `expiredAt`을 현재 timestamp로 설정
          { new: true }
        )
          .populate('memberId')
          .populate('taskId');

        if (!comment) throw new Error('Comment not found');
        return {
          ...comment._doc,
          id: comment._id.toString(),
          member: comment.memberId,
          task: comment.taskId,
          isClicked: await getIsClicked(comment._id, member._id),
          likeCount: await getLikeCount(comment._id),
        };
      } catch (err) {
        throw new Error(`Failed to delete comment: ${err.message}`);
      }
    },
  },
};

export default commentResolver;
