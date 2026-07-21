"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export async function registerClient(_prev: unknown, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "All fields are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.client.create({ data: { name, email, hashedPassword } });

  await signIn("client", { email, password, redirectTo: "/account" });
  redirect("/account");
}

export async function loginClient(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  await signIn("client", { email, password, redirectTo: "/account" });
  redirect("/account");
}
