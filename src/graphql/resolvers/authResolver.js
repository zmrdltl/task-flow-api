import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { Member } from '../../models/index.js'; // ✅ Member 모델 가져오기

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authResolver = {
  Mutation: {
    googleLogin: async (_, { idToken }) => {
      try {
        // 1️⃣ Google ID Token 검증
        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload; // Google 사용자 정보

        // 2️⃣ 기존 회원 여부 확인 (email 기준)
        let member = await Member.findOne({ email });

        if (!member) {
          // 3️⃣ 새 회원 등록
          member = new Member({
            googleId: sub, // ✅ Google ID 저장
            email,
            nickname: name, // ✅ name을 nickname으로 매핑
            profileImage: picture, // ✅ 프로필 이미지 추가
            isActive: true, // ✅ 기본값 설정
          });
          await member.save();
        }

        // 4️⃣ JWT 발급
        const accessToken = jwt.sign(
          { id: member.id, email: member.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        return { accessToken, member }; // ✅ 반환값 변경
      } catch (error) {
        console.error('❌ Google 로그인 실패:', error.message);
        throw new Error('Google 로그인 실패: ' + error.message);
      }
    },
  },
};

export default authResolver;
