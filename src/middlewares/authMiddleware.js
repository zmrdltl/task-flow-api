import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authMiddleware = async ({ request }) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new Error('❌ 인증 토큰이 없습니다.');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    console.log('🔍 Google ID Token 검증 시작');

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('✅ 검증 완료:', payload);

    return payload; // ✅ Google 사용자 정보 반환
  } catch (error) {
    console.error('❌ Google ID Token 검증 실패:', error.message);
    throw new Error('❌ 유효하지 않은 토큰입니다.');
  }
};
