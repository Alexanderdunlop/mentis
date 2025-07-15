import { cn } from "fumadocs-ui/utils/cn";

type DemoContainerProps = React.ComponentProps<"section"> & {
  demoKey: string;
};

export function DemoContainer({
  children,
  className,
  demoKey,
  ...props
}: DemoContainerProps) {
  return (
    <section
      className={cn(
        "not-prose flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-2",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
