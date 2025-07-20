type UseMentionFocusProps = {
  editorRef: React.RefObject<HTMLDivElement | null>;
};

export function useMentionFocus({ editorRef }: UseMentionFocusProps) {
  const handleFocus = (): void => {
    editorRef.current?.classList.remove("empty");
  };

  const handleBlur = (): void => {
    if (editorRef.current?.textContent === "") {
      editorRef.current.classList.add("empty");
    }
  };

  return {
    handleFocus,
    handleBlur,
  };
}
