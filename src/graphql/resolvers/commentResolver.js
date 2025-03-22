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

        const comments = await Comment.find().populate('memberId');
        if (!comments.length) return [];

        return await Promise.all(
          comments.map(async (comment) => ({
            ...comment._doc,
            id: comment._id.toString(),
            member: comment.memberId,
            taskId: comment.taskId ? comment.taskId.toString() : null,
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
        const comment = await Comment.findById(id).populate('memberId');
        if (!comment) throw new Error('Comment not found');
        return {
          ...comment._doc,
          id: comment._id.toString(),
          member: comment.memberId,
          taskId: comment.taskId ? comment.taskId.toString() : null,
          isClicked: await getIsClicked(comment._id, member._id),
          likeCount: await getLikeCount(comment._id),
        };
      } catch (err) {
        console.error('Error in getCommentById:', err);
        throw new Error(`Failed to fetch comment: ${err.message}`);
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

        const task = await Task.findById(taskId);
        if (!task) {
          throw new Error(`Task with ID ${taskId} not found`);
        }

        const comments = await Comment.find({ taskId }).populate('memberId');

        if (!comments.length) return [];

        return await Promise.all(
          comments.map(async (comment) => ({
            ...comment._doc,
            id: comment._id.toString(),
            member: comment.memberId,
            taskId: taskId, // 직접 요청받은 taskId 사용
            isClicked: await getIsClicked(comment._id, member._id),
            likeCount: await getLikeCount(comment._id),
          }))
        );
      } catch (err) {
        console.error('Error in getCommentsByTask:', err);
        throw new Error(`Failed to fetch comments by task: ${err.message}`);
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
            taskId: comment.taskId ? comment.taskId.toString() : null,
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

        // ✅ Task 또는 SubTask에도 댓글 추가
        if (taskId) {
          await Task.findByIdAndUpdate(
            taskId,
            { $push: { comments: newComment._id } },
            { new: true }
          );
        }

        const savedComment = await Comment.findById(newComment._id).populate(
          'memberId'
        );

        return {
          ...savedComment._doc,
          id: savedComment._id.toString(),
          member: savedComment.memberId,
          taskId: taskId, // 직접 요청받은 taskId 사용
          isClicked: await getIsClicked(savedComment._id, member._id),
          likeCount: await getLikeCount(savedComment._id),
        };
      } catch (err) {
        console.error('Error in createComment:', err);
        throw new Error(`Failed to create comment: ${err.message}`);
      }
    },

    // 댓글 수정 (내용 업데이트)
    updateComment: async (_, { id, content }, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        const commentToUpdate = await Comment.findById(id);
        if (!commentToUpdate) throw new Error('Comment not found');

        const taskId = commentToUpdate.taskId
          ? commentToUpdate.taskId.toString()
          : null;

        const comment = await Comment.findByIdAndUpdate(
          id,
          { content, updatedAt: new Date() },
          { new: true }
        ).populate('memberId');

        if (!comment) throw new Error('Comment not found');

        return {
          ...comment._doc,
          id: comment._id.toString(),
          member: comment.memberId,
          taskId: taskId,
          isClicked: await getIsClicked(comment._id, member._id),
          likeCount: await getLikeCount(comment._id),
        };
      } catch (err) {
        console.error('Error in updateComment:', err);
        throw new Error(`Failed to update comment: ${err.message}`);
      }
    },

    // 댓글 삭제
    deleteComment: async (_, { id }, context) => {
      const userData = await authMiddleware({ request: context.request });
      const member = await Member.findOne({ email: userData.email });

      try {
        const commentToDelete = await Comment.findById(id);
        if (!commentToDelete) throw new Error('Comment not found');

        const taskId = commentToDelete.taskId
          ? commentToDelete.taskId.toString()
          : null;

        const comment = await Comment.findByIdAndUpdate(
          id,
          { expiredAt: new Date() }, // ✅ 삭제 시 `expiredAt`을 현재 timestamp로 설정
          { new: true }
        ).populate('memberId');

        if (!comment) throw new Error('Comment not found');

        // 태스크에서 댓글 참조 제거
        if (taskId) {
          await Task.findByIdAndUpdate(
            taskId,
            { $pull: { comments: id } },
            { new: true }
          );
        }

        return {
          ...comment._doc,
          id: comment._id.toString(),
          member: comment.memberId,
          taskId: taskId,
          isClicked: await getIsClicked(comment._id, member._id),
          likeCount: await getLikeCount(comment._id),
        };
      } catch (err) {
        console.error('Error in deleteComment:', err);
        throw new Error(`Failed to delete comment: ${err.message}`);
      }
    },
  },
};

export default commentResolver;
