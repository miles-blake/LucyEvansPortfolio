import "next-auth";

declare module "next-auth" {
  interface User {
    isTestClient?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isTestClient: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isTestClient?: boolean;
  }
}
