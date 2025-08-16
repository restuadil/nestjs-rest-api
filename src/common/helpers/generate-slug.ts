export function generateSlug(text: string) {
  // Convert to lowercase and trim leading/trailing spaces
  let slug = text.toLowerCase().trim();

  // Remove accents from characters (e.g., á, é, ü)
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace invalid characters with spaces
  slug = slug.replace(/[^a-z0-9\s-]/g, " ");

  // Replace multiple spaces or hyphens with a single hyphen
  slug = slug.replace(/[\s-]+/g, "-");

  // Remove leading/trailing hyphens (if any resulted from previous steps)
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}
