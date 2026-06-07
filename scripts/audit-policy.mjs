import { execSync } from 'node:child_process';

const allowedVulnerabilities = {
  next: {
    severity: 'moderate',
    viaPackages: ['postcss'],
    reason:
      'Next currently bundles the vulnerable PostCSS range; npm audit fix proposes a major downgrade to next@9.3.3.',
  },
  postcss: {
    severity: 'moderate',
    advisoryUrls: ['https://github.com/advisories/GHSA-qx2v-qp2m-jg93'],
    reason:
      'Tracked until Next ships a compatible version that updates its bundled PostCSS dependency.',
  },
};

function runAudit() {
  try {
    return execSync('npm audit --json --audit-level=moderate', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    if (error.stdout) {
      return error.stdout.toString();
    }

    throw error;
  }
}

function getAdvisoryUrls(vulnerability) {
  return vulnerability.via
    .filter((item) => typeof item === 'object' && item.url)
    .map((item) => item.url);
}

function getViaPackages(vulnerability) {
  return vulnerability.via.filter((item) => typeof item === 'string');
}

function isAllowed(name, vulnerability) {
  const policy = allowedVulnerabilities[name];

  if (!policy || vulnerability.severity !== policy.severity) {
    return false;
  }

  if (policy.advisoryUrls) {
    const urls = getAdvisoryUrls(vulnerability);
    return (
      urls.length > 0 &&
      urls.every((url) => policy.advisoryUrls.includes(url))
    );
  }

  if (policy.viaPackages) {
    const packages = getViaPackages(vulnerability);
    return (
      packages.length > 0 &&
      packages.every((packageName) => policy.viaPackages.includes(packageName))
    );
  }

  return false;
}

const audit = JSON.parse(runAudit());
const vulnerabilities = audit.vulnerabilities ?? {};
const unexpected = Object.entries(vulnerabilities).filter(
  ([name, vulnerability]) => !isAllowed(name, vulnerability),
);

if (unexpected.length > 0) {
  console.error('Unexpected npm audit findings:');
  for (const [name, vulnerability] of unexpected) {
    console.error(`- ${name}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

const allowed = Object.entries(vulnerabilities);

if (allowed.length === 0) {
  console.log('npm audit policy: no moderate-or-higher vulnerabilities found.');
} else {
  console.log('npm audit policy: allowed findings only.');
  for (const [name] of allowed) {
    console.log(`- ${name}: ${allowedVulnerabilities[name].reason}`);
  }
}
