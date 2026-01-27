import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const readFile = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const authSource = readFile('src/auth.tsx');
const editUserModalSource = readFile('src/components/EditUserModal.tsx');
const signupSource = readFile('src/components/SignupPage.tsx');
const loginRouteSource = readFile('src/routes/login.tsx');
const profileSource = readFile('src/components/ProfilePage.tsx');
const permissionsSource = readFile('src/components/PermissionsPage.tsx');
const rolesSource = readFile('src/components/RolesPage.tsx');
const dashboardSource = readFile('src/components/DashboardPage.tsx');
const addTransactionModalSource = readFile('src/components/transactions/AddTransactionModal.tsx');
const useTransactionsSource = readFile('src/hooks/useTransactions.ts');
const apiSource = readFile('src/utils/api.ts');
const errorMessagesSource = readFile('src/utils/errorMessages.ts');
const stripJsonComments = (input) =>
  input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '');

const tsconfigApp = JSON.parse(stripJsonComments(readFile('tsconfig.app.json')));

const endpoint = 'http://127.0.0.1:7242/ingest/839a9127-914d-4ed3-bfbb-2eb07f2e4c15';
const basePayload = {
  sessionId: 'debug-session',
  runId: 'pre-fix',
  timestamp: Date.now(),
};

// #region agent log
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...basePayload,
    hypothesisId: 'A',
    location: 'scripts/debug-ts-errors.js:27',
    message: 'Auth retry count symbols',
    data: {
      hasSetRetryCount: /setRetryCount/.test(authSource),
      hasRetryCountState: /const\s+\[\s*retryCount\s*,\s*setRetryCount\s*\]/.test(authSource),
      hasRetryCountRef: /retryCountRef/.test(authSource),
    },
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...basePayload,
    hypothesisId: 'F',
    location: 'scripts/debug-ts-errors.js:102',
    message: 'Login route search schema',
    data: {
      loginHasValidateSearch: /validateSearch/.test(loginRouteSource),
      loginRedirectDefault: /redirect:\s*\(.*\)\s*\|\|\s*['"]/.test(loginRouteSource),
    },
  }),
}).catch(() => {});
// #endregion
// #region agent log
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...basePayload,
    hypothesisId: 'B',
    location: 'scripts/debug-ts-errors.js:43',
    message: 'EditUserModal error state symbols',
    data: {
      hasErrorTypeState: /const\s+\[\s*errorType\s*,/.test(editUserModalSource),
      hasCanRetryState: /const\s+\[\s*canRetry\s*,/.test(editUserModalSource),
      usesErrorType: /errorType/.test(editUserModalSource),
      usesCanRetry: /canRetry/.test(editUserModalSource),
    },
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...basePayload,
    hypothesisId: 'C',
    location: 'scripts/debug-ts-errors.js:59',
    message: 'Enum vs erasableSyntaxOnly',
    data: {
      erasableSyntaxOnly: tsconfigApp?.compilerOptions?.erasableSyntaxOnly,
      errorMessagesHasEnum: /enum\s+ErrorType/.test(errorMessagesSource),
    },
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...basePayload,
    hypothesisId: 'D',
    location: 'scripts/debug-ts-errors.js:73',
    message: 'Signup navigation search params',
    data: {
      hasNavigateLogin: /navigate\(\{\s*to:\s*['"]\/login['"]/.test(signupSource),
      hasLinkLogin: /<Link[\s\S]*to=["']\/login["']/.test(signupSource),
      hasSearchProp: /search=/.test(signupSource),
    },
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...basePayload,
    hypothesisId: 'E',
    location: 'scripts/debug-ts-errors.js:86',
    message: 'Other strict TS error markers',
    data: {
      profileHasNodeJSTimeout: /NodeJS\.Timeout/.test(profileSource),
      tsconfigTypes: tsconfigApp?.compilerOptions?.types ?? [],
      permissionsHasAuthVar: /const\s+auth\s*=/.test(permissionsSource),
      rolesHasAuthVar: /const\s+auth\s*=/.test(rolesSource),
      dashboardHasGetTransactionKind: /getTransactionKind/.test(dashboardSource),
      addTxPropsHasOnCreate: /onCreate/.test(addTransactionModalSource),
      addTxPropsHasTransaction: /transaction/.test(addTransactionModalSource),
      addTxPropsHasOnUpdate: /onUpdate/.test(addTransactionModalSource),
      useTransactionsHasEntriesFilter: /Object\.entries\([\s\S]*\)\.filter\(\(\[\s*,\s*value\s*\]\)\s*=>\s*value\)/.test(
        useTransactionsSource
      ),
      apiHasEntriesFilter: /Object\.entries\([\s\S]*\)\.filter\(\(\[\s*,\s*value\s*\]\)\s*=>\s*value\)/.test(
        apiSource
      ),
    },
  }),
}).catch(() => {});
// #endregion
