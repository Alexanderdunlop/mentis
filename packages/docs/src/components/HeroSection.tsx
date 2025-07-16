import Link from "next/link";
import { Github, Library } from "lucide-react";
import { LandingDemo } from "./LandingDemo";
import Image from "next/image";

export const HeroSection = () => {
  return (
    <section className="container relative mb-12 grid grid-cols-1 items-center justify-center gap-8 xl:h-[max(650px,min(800px,calc(75vh)))] xl:grid-cols-2 xl:flex-row">
      <aside className="my-16 flex flex-col items-center self-center xl:my-24 xl:-mr-10 xl:ml-10 xl:flex-1 xl:items-start">
        <div className="flex items-center gap-4">
          <Image src="/logo/logo.png" alt="mentis" width={100} height={100} />
          <h1 className="text-6xl md:text-8xl">mentis</h1>
        </div>
        <p className="my-8 text-center text-2xl md:text-4xl xl:text-left">
          A small, fast, and flexible
          <br /> mention input solution.
        </p>
        <nav className="flex flex-wrap gap-8 items-center">
          <Link
            href="/docs"
            className="text-md bg-black px-4 py-2 text-white w-full rounded-full sm:w-auto"
          >
            <Library className="mr-2 inline-block" size={20} />
            Documentation
          </Link>
          <a
            href="https://github.com/alexanderdunlop/mentis"
            className="text-md w-full rounded-full sm:w-auto"
          >
            <Github className="-ml-1 mr-2 inline-block" size={20} />
            GitHub
          </a>
        </nav>
      </aside>
      <aside className="relative my-4 xl:my-auto xl:flex-1 xl:pt-4">
        <LandingDemo />
      </aside>
    </section>
  );
};
