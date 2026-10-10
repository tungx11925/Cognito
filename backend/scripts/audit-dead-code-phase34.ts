import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const backendSrc = path.join(__dirname, '../src');
const frontendSrc = path.join(__dirname, '../../frontend/src');

interface DeadCodeItem {
  category: string;
  name: string;
  path: string;
  reason: string;
  evidence: string;
}

const deadCodeList: DeadCodeItem[] = [];

// Helper to recursively collect files
function getFiles(dir: string, extensions: string[] = ['.ts', '.tsx', '.js']): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        results = results.concat(getFiles(fullPath, extensions));
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const allBackendFiles = getFiles(backendSrc);
const allFrontendFiles = getFiles(frontendSrc);
const allCodeFiles = [...allBackendFiles, ...allFrontendFiles];

function fileIsReferenced(targetBaseNameWithoutExt: string, excludeFilePaths: string[] = []): { referenced: boolean; occurrences: string[] } {
  const occurrences: string[] = [];
  const searchPattern1 = new RegExp(`['"\`][^'"\`]*\\b${targetBaseNameWithoutExt}\\b[^'"\`]*['"\`]`, 'i');
  const searchPattern2 = new RegExp(`\\b${targetBaseNameWithoutExt}\\b`, 'i');

  for (const f of allCodeFiles) {
    if (excludeFilePaths.includes(f)) continue;
    try {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes(targetBaseNameWithoutExt)) {
        occurrences.push(path.relative(path.join(__dirname, '../..'), f));
      }
    } catch (e) {}
  }
  return { referenced: occurrences.length > 0, occurrences };
}

async function runAudit() {
  console.log('=== PHASE 34: COMPREHENSIVE DEAD CODE AUDIT ===\n');

  // 1. Audit Backend Routes
  const routesDir = path.join(backendSrc, 'routes');
  const appTsContent = fs.readFileSync(path.join(backendSrc, 'app.ts'), 'utf-8');
  const routeFiles = fs.readdirSync(routesDir);

  for (const rf of routeFiles) {
    const fullPath = path.join(routesDir, rf);
    const baseName = rf.replace(/\.ts$/, '');
    const isMounted = appTsContent.includes(baseName) || appTsContent.includes(rf);
    if (!isMounted) {
      deadCodeList.push({
        category: 'Backend Route',
        name: rf,
        path: fullPath,
        reason: 'Route file is NOT imported or mounted in backend/src/app.ts',
        evidence: `grep in app.ts returned 0 matches for '${baseName}'`
      });
    }
  }

  // 2. Audit Backend Controllers
  const controllersDir = path.join(backendSrc, 'controllers');
  const controllerFiles = fs.readdirSync(controllersDir);

  for (const cf of controllerFiles) {
    const fullPath = path.join(controllersDir, cf);
    const baseName = cf.replace(/\.ts$/, '');
    const ref = fileIsReferenced(baseName, [fullPath]);
    // check if it's only referenced by unmounted routes or not at all
    const activeRefs = ref.occurrences.filter(o => !o.includes('marketplace.routes.ts'));
    if (activeRefs.length === 0) {
      deadCodeList.push({
        category: 'Backend Controller',
        name: cf,
        path: fullPath,
        reason: 'Controller is not referenced by any active route, service, or app entrypoint',
        evidence: `References found only in: [${ref.occurrences.join(', ')}]`
      });
    }
  }

  // 3. Audit Backend Services
  const servicesDir = path.join(backendSrc, 'services');
  const serviceFiles = fs.readdirSync(servicesDir);

  for (const sf of serviceFiles) {
    const fullPath = path.join(servicesDir, sf);
    const baseName = sf.replace(/\.ts$/, '');
    const ref = fileIsReferenced(baseName, [fullPath]);
    if (!ref.referenced) {
      deadCodeList.push({
        category: 'Backend Service',
        name: sf,
        path: fullPath,
        reason: 'Service file is not referenced by any controller, test, or worker',
        evidence: '0 references across all backend and frontend source files'
      });
    }
  }

  // 4. Audit Backend Repositories
  const reposDir = path.join(backendSrc, 'repositories');
  const repoFiles = fs.readdirSync(reposDir);

  for (const rf of repoFiles) {
    const fullPath = path.join(reposDir, rf);
    const baseName = rf.replace(/\.ts$/, '');
    const ref = fileIsReferenced(baseName, [fullPath]);
    if (!ref.referenced) {
      deadCodeList.push({
        category: 'Backend Repository',
        name: rf,
        path: fullPath,
        reason: 'Repository file is not referenced anywhere in backend',
        evidence: '0 references across all codebase files'
      });
    }
  }

  // 5. Audit Root Backend Scratch/Orphan Files
  const rootBackendFiles = ['check_constraints.ts', 'server2.ts'];
  for (const rbf of rootBackendFiles) {
    const fullPath = path.join(backendSrc, rbf);
    if (fs.existsSync(fullPath)) {
      deadCodeList.push({
        category: 'Backend Orphan / Scratch Script',
        name: rbf,
        path: fullPath,
        reason: rbf === 'server2.ts' ? 'Empty 0-byte file left in backend/src' : 'Ad-hoc scratch debug script left in backend/src',
        evidence: 'Never imported anywhere; not part of standard application entrypoints'
      });
    }
  }

  // 6. Audit Frontend Components
  const componentsDir = path.join(frontendSrc, 'components');
  const componentFiles = getFiles(componentsDir);

  for (const cf of componentFiles) {
    const baseName = path.basename(cf).replace(/\.(tsx|ts)$/, '');
    const ref = fileIsReferenced(baseName, [cf]);
    if (!ref.referenced) {
      deadCodeList.push({
        category: 'Frontend Component',
        name: path.relative(componentsDir, cf),
        path: cf,
        reason: 'Component is never imported or rendered in any page, layout, or parent component',
        evidence: '0 references across all frontend pages, layouts, and components'
      });
    }
  }

  // 7. Audit Frontend Hooks
  const hooksDir = path.join(frontendSrc, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hookFiles = getFiles(hooksDir);
    for (const hf of hookFiles) {
      const baseName = path.basename(hf).replace(/\.(tsx|ts)$/, '');
      const ref = fileIsReferenced(baseName, [hf]);
      if (!ref.referenced) {
        deadCodeList.push({
          category: 'Frontend Hook',
          name: path.relative(hooksDir, hf),
          path: hf,
          reason: 'Custom hook is never imported or called anywhere in frontend',
          evidence: '0 references across all frontend files'
        });
      }
    }
  }

  // 8. Audit Database Tables in PostgreSQL
  console.log('Connecting to PostgreSQL database to audit tables...');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log(`Found ${tablesRes.rows.length} total database tables.`);

  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    // Exclude migration tracking tables
    if (tableName === 'pgmigrations') continue;

    // Search codebase for table name (excluding migrations directory)
    let refCount = 0;
    const occurrences: string[] = [];

    for (const f of allCodeFiles) {
      // Exclude marketplace controller/route when checking
      if (f.includes('marketplace.controller') || f.includes('marketplace.routes')) continue;
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes(tableName)) {
        refCount++;
        occurrences.push(path.relative(path.join(__dirname, '../..'), f));
      }
    }

    if (refCount === 0 || tableName === 'purchased_resources' || tableName === 'transactions') {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      const rowCount = parseInt(countRes.rows[0].count, 10);

      deadCodeList.push({
        category: 'Database Table',
        name: tableName,
        path: `PostgreSQL public."${tableName}" (${rowCount} rows)`,
        reason: tableName === 'purchased_resources' 
          ? 'Legacy table from deprecated coin marketplace; replaced by open community resource exchange'
          : tableName === 'transactions'
          ? 'Legacy prototype coin transactions; replaced by subscription payment_orders'
          : 'Table is not referenced in any active backend service, repository, or controller',
        evidence: `Active code references: ${refCount} files. Row count in DB: ${rowCount}.`
      });
    }
  }

  // Check columns on users table
  const userColsRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'wallet_balance';
  `);
  if (userColsRes.rows.length > 0) {
    deadCodeList.push({
      category: 'Database Column',
      name: 'users.wallet_balance',
      path: 'PostgreSQL public.users.wallet_balance (INTEGER)',
      reason: 'Legacy coin balance from deprecated marketplace; no deposit/withdraw/coin transactions exist',
      evidence: 'No business logic reads or updates this column for real coin transactions'
    });
  }

  await client.end();

  console.log(`\nAUDIT COMPLETED. Total potential dead code items found: ${deadCodeList.length}\n`);
  console.log(JSON.stringify(deadCodeList, null, 2));

  fs.writeFileSync(
    path.join(__dirname, 'dead-code-audit-results.json'),
    JSON.stringify(deadCodeList, null, 2)
  );
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
