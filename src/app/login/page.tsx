import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="page narrow">
      <div className="logo">
        TSL<small>Your shopping list</small>
      </div>
      <LoginForm next={typeof next === "string" ? next : "/"} />
    </main>
  );
}
