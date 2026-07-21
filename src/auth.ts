import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const admin = await prisma.adminUser.findUnique({
          where: { email: credentials.email as string },
        });
        if (!admin) return null;
        const valid = await bcrypt.compare(credentials.password as string, admin.hashedPassword);
        if (!valid) return null;
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: "admin" as const,
          isTestClient: admin.isTestClient,
        };
      },
    }),
    Credentials({
      id: "client",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const client = await prisma.client.findUnique({
          where: { email: credentials.email as string },
        });
        if (!client) return null;
        const valid = await bcrypt.compare(credentials.password as string, client.hashedPassword);
        if (!valid) return null;
        return {
          id: client.id,
          name: client.name,
          email: client.email,
          role: "client" as const,
          isTestClient: false,
        };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: string }).role ?? "admin") as "admin" | "client";
        token.isTestClient = (user as { isTestClient?: boolean }).isTestClient ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as "admin" | "client") ?? "admin";
      session.user.isTestClient = (token.isTestClient as boolean) ?? false;
      return session;
    },
  },
});
