export async function toPng() {
  const el = document.querySelector(".react-flow") as HTMLElement | null;
  if (!el) return;

  try {
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(el, {
      backgroundColor: "#ffffff",
      filter: (node) => {
        if (node instanceof HTMLElement) {
          return !node.classList.contains("react-flow__minimap") &&
                 !node.classList.contains("react-flow__controls");
        }
        return true;
      },
    });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.png";
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    console.warn("Export failed — html-to-image not available");
  }
}
