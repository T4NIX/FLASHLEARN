import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

/**
 * Lazily load openid-client (ESM-safe)
 */
async function loadOidc() {
  const client = await import("openid-client");
  const passportOidc = await import("openid-client/passport");
  return { client, passportOidc };
}

/**
 * Memoized OIDC config
 */
const getOidcConfig = memoize(
  async () => {
    const { client } = await loadOidc();

    return client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

/**
 * Session middleware
 */
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

/**
 * Update user session from tokens
 */
function updateUserSession(user: any, tokens: any) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await authStorage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.first_name,
    lastName: claims.last_name,
    profileImageUrl: claims.profile_image_url,
  });
}

/**
 * Setup Replit Auth (SAFE)
 */
export async function setupAuth(app: Express) {
  if (
    !process.env.REPLIT_CLIENT_ID ||
    !process.env.REPLIT_CLIENT_SECRET
  ) {
    console.warn("Replit Auth disabled (env vars not set)");
    return;
  }

  const { client, passportOidc } = await loadOidc();
  const { Strategy } = passportOidc;

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify = async (tokens: any, done: passport.AuthenticateCallback) => {
    const user: any = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    done(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const name = `replitauth:${domain}`;

    if (registeredStrategies.has(name)) return;

    passport.use(
      new Strategy(
        {
          name,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      )
    );

    registeredStrategies.add(name);
  };

 passport.serializeUser((user: Express.User, cb) => cb(null, user));

 passport.deserializeUser((user: Express.User, cb) => cb(null, user));


  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`)(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    const endSessionUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
    });

    req.logout(() => res.redirect(endSessionUrl.href));
  });
}

/**
 * Auth guard
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user: any = req.user;
  const now = Math.floor(Date.now() / 1000);

  if (user?.expires_at && now <= user.expires_at) {
    return next();
  }

  if (!user?.refresh_token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { client } = await loadOidc();
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(
      config,
      user.refresh_token
    );

    updateUserSession(user, tokenResponse);
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
