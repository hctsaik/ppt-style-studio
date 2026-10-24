// Compatibility entrypoint: the maintained table UI suite covers the current
// full-table, inspector-first workbench. Requires Playwright and Chromium.
const { spawnSync } = require('child_process');
const path = require('path');
const result = spawnSync(process.execPath, [path.join(__dirname, 'table_workbench_test.js'), '--browser-only', ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
if (result.error) console.error(result.error.message);
process.exit(result.status == null ? 1 : result.status);
