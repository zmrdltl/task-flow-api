import { OAuth2Client } from 'google-auth-library';
import { Member } from '../../models/index.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authResolver = {
  Mutation: {
    googleLogin: async (_, { idToken }) => {
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload; // Google 사용자 정보

        let member = await Member.findOne({ email });

        if (!member) {
          member = new Member({
            googleId: sub,
            email,
            nickname: name,
            profileImage: picture,
            isActive: true,
          });
          await member.save();
        }

        return { idToken, member };
      } catch (error) {
        console.error('❌ Google 로그인 실패:', error.message);
        throw new Error('Google 로그인 실패: ' + error.message);
      }
    },
  },
};

export default authResolver;
