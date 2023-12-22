import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { redis } from "@/lib/db";
import { fetchRedis } from "@/helpers/redis";

function getGoogleCredentials() {
  const clientId =
    "594707145361-rcu2lrn0fjc6keijm3npl0lrt5eq1c05.apps.googleusercontent.com";
  const clientSecret = "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";

  if (!clientId || clientId.length === 0) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }

  if (!clientSecret || clientSecret.length === 0) {
    console.log(clientSecret);
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }

  return { clientId, clientSecret };
}

export const options: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId as string,
      clientSecret: getGoogleCredentials().clientSecret as string,
    }),
  ],
  adapter: UpstashRedisAdapter(redis),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      const dbUserResult = (await fetchRedis("get", `user:${token.id}`)) as
        | string
        | null;

      if (!dbUserResult) {
        token.id = user!.id;
        return token;
      }

      const dbUser = JSON.parse(dbUserResult) as User;

      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
      };
    },
    async session({ session, token }) {
      if (token) {
        (session.user.name = token.name),
          (session.user.email = token.email),
          (session.user.id = token.id),
          (session.user.image = token.picture);
      }
      return session;
    },
    redirect() {
      return "/dashboard";
    },
  },
};
