export function isAdminRole(role?: string | null) {
  const normalized = (role ?? '').trim().toLowerCase()
  return normalized.includes('admin')
}
