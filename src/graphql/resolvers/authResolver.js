import { OAuth2Client } from 'google-auth-library';
import { Member } from '../../models/index.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authResolver = {
  Mutation: {
    googleLogin: async (_, { accessToken }) => {
      try {
        const ticket = await client.verifyIdToken({
          idToken: accessToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        /**
         * ✅ 검증 완료: {
          iss: 'https://accounts.google.com',
          azp: '587740335419-c50ehaimioledcu31mrtchvbjhgg242g.apps.googleusercontent.com',
          aud: '587740335419-c50ehaimioledcu31mrtchvbjhgg242g.apps.googleusercontent.com',
          sub: '117156607534092926692',
          email: 'dmlgus911@gmail.com',
          email_verified: true,
          nbf: 1738312902,
          name: '김의현',
          picture: 'https://lh3.googleusercontent.com/a/ACg8ocJkC-KbmBKBwFgMC3ipwmZkLiR0q5ylRKhYNR5l4HlKV2eJRA=s96-c',
          given_name: '의현',
          family_name: '김',
          iat: 1738313202,
          exp: 1738316802,
          jti: 'bf1e91fe37844358e84996510c20b0bdede00e12'
        }
         */

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

        return { accessToken, member };

      } catch (error) {
        console.error('❌ Google 로그인 실패:', error.message);
        throw new Error('Google 로그인 실패: ' + error.message);
      }
    },
  },
};

export default authResolver;
