import { Metadata } from "next";
import { HeroSection } from "@/components";

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
      <HeroSection />
    </main>
  );
}
