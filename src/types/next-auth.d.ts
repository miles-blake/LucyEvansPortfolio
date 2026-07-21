import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "admin" | "client";
    isTestClient?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "admin" | "client";
      isTestClient: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "client";
    isTestClient?: boolean;
  }
}
