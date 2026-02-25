import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: "7d",
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
});
