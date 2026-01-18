import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { createAuditLog } from './audit';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google OAuth Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Microsoft Entra ID (Azure AD) Provider
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || 'common'}/v2.0`,
    }),

    // Credentials Provider (Email/Password)
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Log the login
          await createAuditLog({
            userId: user.id,
            action: 'login',
            entity: 'session',
          });

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth sign in (Google/Microsoft)
      if (account?.provider === 'google' || account?.provider === 'microsoft-entra-id') {
        try {
          const email = user.email;
          if (!email) return false;

          // Check if user exists in database
          let dbUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!dbUser) {
            // Create new user from OAuth
            dbUser = await prisma.user.create({
              data: {
                email: email,
                password: '', // No password for OAuth users
                fullName: user.name || email.split('@')[0],
                fullNameEn: user.name || email.split('@')[0],
                role: 'employee', // Default role for new OAuth users
                status: 'active',
                authProvider: account.provider,
              },
            });
          } else {
            // Update auth provider if not set
            if (!dbUser.authProvider) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { authProvider: account.provider },
              });
            }
          }

          // Update last login
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLogin: new Date() },
          });

          // Log the login
          await createAuditLog({
            userId: dbUser.id,
            action: 'login',
            entity: 'session',
          });

          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        // For credentials login
        token.id = user.id;
        token.role = user.role;
      }

      // For OAuth login, fetch user from database
      if (account?.provider === 'google' || account?.provider === 'microsoft-entra-id') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
