/**
 * Przechodzi po drzewie (mdast lub hast) i wywołuje `visitor` dla każdego węzła.
 * Zwrócenie `false` z visitora pomija dzieci tego węzła.
 */
export function walk(node, visitor, parent = null, index = -1) {
  const descend = visitor(node, parent, index);
  if (descend === false || !Array.isArray(node.children)) return;
  // Kopia, bo visitor może podmieniać dzieci rodzica w trakcie przejścia.
  for (const child of [...node.children]) {
    walk(child, visitor, node, node.children.indexOf(child));
  }
}

export function hasClass(node, name) {
  const value = node.properties?.className ?? node.properties?.class;
  if (Array.isArray(value)) return value.includes(name);
  return typeof value === 'string' && value.split(/\s+/).includes(name);
}

export function element(tagName, properties = {}, children = []) {
  return { type: 'element', tagName, properties, children };
}

export function text(value) {
  return { type: 'text', value };
}
