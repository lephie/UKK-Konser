import { OAuth2Client } from "google-auth-library";

const allowedClientIds = [
  process.env.GOOGLE_CLIENT_ID,
  ...(process.env.GOOGLE_MOBILE_CLIENT_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
].filter(Boolean);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    const err = new Error("Google idToken is required");
    err.statusCode = 400;
    throw err;
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: allowedClientIds,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    const err = new Error("Invalid Google token payload");
    err.statusCode = 401;
    throw err;
  }

  if (payload.email_verified === false) {
    const err = new Error("Google email is not verified");
    err.statusCode = 401;
    throw err;
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    avatarUrl: payload.picture || null,
  };
}

/**
 * Finds or creates a user using your existing model/DB layer.
 * Replace `userModel` methods below with your actual `models/` queries.
 */
async function findOrCreateGoogleUser(googleProfile, userModel, signJwt) {
  const { googleId, email, name, avatarUrl } = googleProfile;

  // 1. Check by google_id first
  let user = await userModel.findByGoogleId(googleId);

  // 2. Otherwise check by unique email to link an existing account
  if (!user) {
    user = await userModel.findByEmail(email);
    if (user) {
      user = await userModel.linkGoogleAccount(user.id, {
        googleId,
        avatarUrl: user.avatar_url || avatarUrl,
      });
    }
  }

  // 3. Otherwise create a new buyer account with role = 'user'
  if (!user) {
    user = await userModel.create({
      name,
      email,
      password: null,
      google_id: googleId,
      avatar_url: avatarUrl,
      auth_provider: "google",
      role: "user",
    });
  }

  const token = signJwt(user);

  // Strip sensitive fields before returning
  const { password, ...safeUser } = user;
  return { token, user: safeUser };
}

export default {
  verifyGoogleIdToken,
  findOrCreateGoogleUser,}