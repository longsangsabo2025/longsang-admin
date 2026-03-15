/**
 * Test file for auto-fix system
 * This file contains intentional errors that can be auto-fixed
 */

// Missing semicolon (ESLint fixable)
const test1 = 'hello world';

// Formatting issue (Prettier fixable)
const test2 = { name: 'test', value: 123 };

// Unused variable (ESLint fixable)
const unusedVar = 'this will be removed';

// Null safety issue (AST transform fixable)
function testNullSafety(data: any) {
  // This will cause "Cannot read property 'name' of undefined"
  return data.user.name;
}

// Missing quotes consistency (ESLint fixable)
const test3 = 'single quotes';
const test4 = 'double quotes';

export { test1, test2, test3, test4, testNullSafety };
