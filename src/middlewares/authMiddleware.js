import jwt from 'jsonwebtoken';

export const authMiddleware = (context) => {
  const authHeader = context.req.headers.authorization; // 요청 헤더에서 Authorization 가져오기

  if (!authHeader) {
    throw new Error('❌ 인증 토큰이 없습니다.');
  }

  const token = authHeader.replace('Bearer ', ''); // "Bearer " 제거

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
    return decoded; // ✅ 검증된 사용자 정보 반환
  } catch (error) {
    throw new Error('❌ 유효하지 않은 토큰입니다.');
  }
};
