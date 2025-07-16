import { cn } from "fumadocs-ui/utils/cn";

export function DemoContainer({
  children,
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "relative not-prose flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-2",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
