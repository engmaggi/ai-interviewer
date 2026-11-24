/** "Maggi Mamdouh" → "MM", "maggi" → "M". */
export function getInitials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]);

  return initials.join("").toUpperCase() || "?";
}

export function getFirstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}
