import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Logo from "../../public/logo/logo.png";
import Image from "next/image";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <div className="w-8">
        <Image src={Logo} alt="mentis" />
      </div>
    ),
    transparentMode: "top",
  },
  links: [],
  githubUrl: "https://github.com/alexanderdunlop/mentis",
};
