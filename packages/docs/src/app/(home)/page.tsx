import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute:
      "mentis | A small, fast, and flexible mention input solution for React",
  },
  alternates: {
    canonical: "https://mentis.alexdunlop.com",
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center items-center text-center">
      <div className="max-w-md text-left grid gap-4 px-6">
        <h1 className="text-5xl font-bold">mentis</h1>
        <p className="text-black text-xl">
          A small, fast, and flexible mention input solution for React.
        </p>
        <div className="flex gap-2">
          <Link
            href="/docs"
            className="bg-black px-4 py-2 rounded-xl text-white hover:bg-gray-800"
          >
            Documentation
          </Link>
          <Link
            href="https://github.com/alexanderdunlop/mentis"
            className="px-4 py-2 rounded-md"
          >
            GitHub
          </Link>
        </div>
      </div>
    </main>
  );
}
