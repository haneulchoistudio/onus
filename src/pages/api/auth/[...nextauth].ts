import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import { Session } from "next-auth";
import { abc } from "~/server/dotenv";
import { db } from "~/server/mongo";
import type { User } from "~/types";
import type { NextAuthOptions } from "next-auth";

const nextAuthOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: abc("GOOGLE_CLIENT_ID"),
      clientSecret: abc("GOOGLE_CLIENT_SECRET"),
    }),
    KakaoProvider({
      clientId: abc("KAKAO_CLIENT_ID"),
      clientSecret: abc("KAKAO_CLIENT_SECRET"),
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: abc("NEXTAUTH_SECRET"),
  callbacks: {
    async redirect({ baseUrl, url }) {
      return baseUrl;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider;
        if (account.provider === "google") {
        } else if (account.provider === "kakao") {
        }
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      const id = token.id as string;
      const provider = token.provider as string;

      //   SEARCH DB USERS
      const userDocs = await db("users");
      const userFound = (await userDocs.findOne({
        _id: id,
      })) as User;

      if (!userFound) {
        //  CREATE DB USER
        const { insertedId } = await userDocs.insertOne({
          _id: id,
          provider,
          data: {
            name: session.user?.name || ("" as string),
            nickname: "",
            email: session.user?.email || ("" as string),
            image: session.user?.image || ("" as string),
            bio: `Hi, I am ${session.user?.name}.`,
            groups: [],
            subscription: "free",
            preferred_language: "en",
            preferred_show_nickname: false,
            preferred_theme: "light",
            preferred_view_profile: "hidden",
          },
        });
        const newUserDocs = await db("users");
        const newUserFound = (await newUserDocs.findOne({
          _id: insertedId,
        })) as User;

        return Promise.resolve({
          ...newUserFound,
          expires: session.expires,
        } as Session & { expires?: string });
      }

      return Promise.resolve({
        ...userFound,
        expires: session.expires,
      } as Session & { expires?: string });
    },
  },
};

export default NextAuth(nextAuthOptions);
