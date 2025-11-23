import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

const ALLOWED_EMAILS = ["marcussalarini@gmail.com", "llamayer@hotmail.com"];

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID || "",
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
            tenantId: process.env.AZURE_AD_TENANT_ID,
        }),
        // DEV ONLY: Bypass for testing when OAuth is not configured
        ...(process.env.NODE_ENV === "development" && !process.env.GOOGLE_CLIENT_ID
            ? [
                CredentialsProvider({
                    id: "dev-bypass",
                    name: "Development",
                    credentials: {
                        email: { label: "Email", type: "email" },
                    },
                    async authorize(credentials) {
                        if (credentials?.email && ALLOWED_EMAILS.includes(credentials.email)) {
                            return { id: "dev", email: credentials.email, name: credentials.email };
                        }
                        return null;
                    },
                }),
            ]
            : []),
    ],
    callbacks: {
        async signIn({ user }) {
            if (user.email && ALLOWED_EMAILS.includes(user.email)) {
                return true;
            }
            return false;
        },
    },
    pages: {
        signIn: "/login",
    },
};
