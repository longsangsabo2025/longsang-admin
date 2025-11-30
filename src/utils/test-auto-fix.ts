/**
 * 🧪 TEST FILE FOR AUTO-FIX - VERSION 2
 * This file contains NEW intentional bugs for testing Sentry → Copilot auto-fix flow
 * Run: trigger a Sentry error to test the full flow
 */

// BUG 1: Calling method on undefined object
export function processOrder(order: any) {
  // This will throw if order.items is undefined
  const total = order.items.reduce((sum: number, item: any) => sum + item.price, 0);
  return total;
}

// BUG 2: Array access without bounds checking
export function getFirstThreeUsers(users: any[]) {
  // This will throw if users has less than 3 items
  return [users[0].name, users[1].name, users[2].name];
}

// BUG 3: Async function without error handling
export async function fetchUserData(userId: string) {
  // This will fail silently if fetch fails
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data.profile.settings.theme;
}

// BUG 4: Type coercion issue
export function formatPrice(price: any) {
  // This will fail if price is not a number
  return '$' + price.toFixed(2);
}

// BUG 5: Missing null check on callback
export function executeCallback(callback: any, data: any) {
  // This will throw if callback is not a function
  callback(data);
  return true;
}

// BUG 6: Unsafe JSON parse
export function parseConfig(configString: string) {
  // This will throw if configString is invalid JSON
  const config = JSON.parse(configString);
  return config.database.host;
}

// BUG 7: Date parsing without validation
export function formatDate(dateString: string) {
  // This will return Invalid Date if dateString is invalid
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// BUG 8: Object destructuring without defaults
export function createUser({ name, email, role }: any) {
  // This will fail if any property is undefined
  return {
    displayName: name.toUpperCase(),
    contactEmail: email.toLowerCase(),
    accessLevel: role.permissions.level,
  };
}
