export const ADMIN_PASSWORD = "Themillion";
export const ADMIN_PASSWORD_HEADER = "x-admin-password";
export const ADMIN_PASSWORD_STORAGE_KEY = "digishare-admin-password";

export function isAdminPassword(value?: string | null) {
  return value === ADMIN_PASSWORD;
}

