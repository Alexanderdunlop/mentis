import { HeroSection } from "@/components";
import {
  createMetadata,
  defaultTitle,
  siteDescription,
  siteUrl,
} from "@/lib/metadata";

export const metadata = {
  ...createMetadata({ path: "/" }),
  title: {
    absolute: defaultTitle,
  },
};

/**
 * Structured data so search engines and AI crawlers can identify what this
 * package is without parsing the page.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "mentis",
      description: siteDescription,
      inLanguage: "en",
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${siteUrl}/#software`,
      name: "mentis",
      description: siteDescription,
      url: siteUrl,
      codeRepository: "https://github.com/alexanderdunlop/mentis",
      programmingLanguage: ["TypeScript", "JavaScript"],
      runtimePlatform: "React",
      license: "https://opensource.org/licenses/MIT",
      author: {
        "@type": "Person",
        name: "Alexander Dunlop",
        url: "https://alexdunlop.com/",
      },
      keywords:
        "react mentions, mention input, @mention autocomplete, react-mentions alternative, combobox, typeahead, tagging, contenteditable, accessible",
    },
  ],
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center items-center text-center">
      <script
        type="application/ld+json"
        // Static, author-controlled JSON — no user input is interpolated.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection />
    </main>
  );
}
