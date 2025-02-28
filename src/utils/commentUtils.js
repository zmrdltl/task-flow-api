import { Like } from '../models/index.js';

/**
 * 현재 로그인한 사용자가 특정 댓글을 좋아요 눌렀는지 확인하는 함수
 * @param {string} commentId - 확인할 댓글 ID
 * @param {string} memberId - 현재 로그인한 사용자 ID
 * @returns {Promise<boolean>} - 좋아요 여부 반환
 */
export const getIsClicked = async (commentId, memberId) => {
  if (!commentId || !memberId) return false;

  const existingLike = await Like.findOne({
    commentId: commentId,
    memberId: memberId,
  });

  return !!existingLike;
};

/**
 * 특정 댓글의 좋아요 개수를 가져오는 함수
 * @param {string} commentId - 좋아요 개수를 조회할 댓글 ID
 * @returns {Promise<number>} - 좋아요 개수 반환
 */
export const getLikeCount = async (commentId) => {
  if (!commentId) return 0;

  const likeCount = await Like.countDocuments({ commentId });
  return likeCount;
};
