import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { Suspense } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions}
      sidebar={{
        collapsible: false,
        footer: (
          <Suspense>
            <SidebarFooter />
          </Suspense>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}

async function SidebarFooter() {
  const version = await getLatestVersion();
  return (
    <footer className="flex w-full items-baseline gap-2 text-zinc-600 dark:text-zinc-400">
      <a
        href={`https://npmjs.com/package/mentis/v/${version}`}
        className="hover:underline"
        tabIndex={-1}
      >
        <pre className="text-xs">mentis@{version}</pre>
      </a>
    </footer>
  );
}

async function getLatestVersion() {
  try {
    const res = await fetch("https://registry.npmjs.org/mentis", {
      next: {
        tags: ["npm"],
      },
    }).then((r) => r.json());
    return res["dist-tags"].latest;
  } catch {
    return "latest";
  }
}
