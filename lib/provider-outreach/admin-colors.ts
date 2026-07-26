/**
 * Stable color generation for admin name chips
 * Colors are determined by hashing the admin ID for consistency
 */

export interface ChipColor {
  bg: string;
  text: string;
  border: string;
}

/**
 * Predefined color palette for admin chips
 * Each color has background, text, and border variants
 */
export const CHIP_COLORS: ChipColor[] = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
];

/**
 * Unassigned chip style (gray outlined)
 */
export const UNASSIGNED_CHIP_COLOR: ChipColor = {
  bg: 'bg-gray-50',
  text: 'text-gray-500',
  border: 'border-gray-300',
};

/**
 * Get a stable color for an admin based on their ID
 * The same admin ID will always return the same color
 */
export function getAdminColor(adminId: string): ChipColor {
  // Hash adminId to get stable index
  const hash = adminId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CHIP_COLORS[hash % CHIP_COLORS.length];
}

/**
 * Get chip color classes as a single string for easy className usage
 */
export function getAdminColorClasses(adminId: string | null): string {
  if (!adminId) {
    const { bg, text, border } = UNASSIGNED_CHIP_COLOR;
    return `${bg} ${text} ${border}`;
  }
  const { bg, text, border } = getAdminColor(adminId);
  return `${bg} ${text} ${border}`;
}
