import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // Tìm hoặc tạo user trong DB ở đây
    // Ví dụ:
    // const user = await User.findOrCreate({ googleId: profile.id, ... });
    // done(null, user);
    done(null, profile); // demo
  }
));