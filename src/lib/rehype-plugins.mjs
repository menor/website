// Markdown has no captions. This turns an image with an italic line right
// below it, in the same paragraph:
//
//   ![alt text](./shot.png)
//   *Caption*
//
// into <figure><img><figcaption>Caption</figcaption></figure>.
export function rehypeFigures() {
  return (tree) => wrapFigures(tree);
}

const isElement = (node, tag) => node.type === "element" && node.tagName === tag;
const isBlank = (node) =>
  (node.type === "text" && !node.value.trim()) || isElement(node, "br");

function wrapFigures(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (isElement(child, "p")) {
      const parts = child.children.filter((c) => !isBlank(c));
      if (parts.length === 2 && isElement(parts[0], "img") && isElement(parts[1], "em")) {
        return {
          type: "element",
          tagName: "figure",
          properties: {},
          children: [
            parts[0],
            { type: "element", tagName: "figcaption", properties: {}, children: parts[1].children },
          ],
        };
      }
    }
    wrapFigures(child);
    return child;
  });
}

// Footnote labels are set once for all posts, in English. Spanish posts
// (src/content/blog/es/) get them translated, so screen readers read Spanish.
export function rehypeSpanishFootnotes() {
  return (tree, file) => {
    if (!/[\\/]blog[\\/]es[\\/]/.test(file.path ?? "")) return;
    translate(tree);
  };
}

function translate(node) {
  if (isElement(node, "h2") && node.properties.id === "footnote-label") {
    node.children = [{ type: "text", value: "Notas" }];
  }
  const label = node.properties?.ariaLabel;
  if (node.properties?.dataFootnoteBackref !== undefined && typeof label === "string") {
    node.properties.ariaLabel = label.replace("Back to reference", "Volver a la referencia");
  }
  node.children?.forEach(translate);
}
