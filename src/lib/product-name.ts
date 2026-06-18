// Build a product's display name without doubling the manufacturer when the
// product name already starts with it — e.g. manufacturer "Olympus" + name
// "Olympus 38DL Plus" should read "Olympus 38DL Plus", not "Olympus Olympus…".
export function productDisplayName(
  manufacturer: string | null | undefined,
  name: string,
): string {
  const m = manufacturer?.trim();
  if (!m) return name;
  if (name.toLowerCase().startsWith(m.toLowerCase())) return name;
  return `${m} ${name}`;
}
