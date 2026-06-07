# Security Policy

Portfolio Platform is a personal portfolio/CV platform with authenticated admin routes, media uploads, contact forms, generated CV files and optional external integrations.

## Supported Branches

- `develop`: active development branch.
- `master`: stable branch.

Security fixes should start from `develop` unless the issue affects only the stable branch.

## Reporting a Vulnerability

Please do not disclose vulnerabilities publicly before they are reviewed. Use one of these paths:

- Open a private/security advisory if GitHub enables it for the repository.
- Contact the repository owner through the public contact details already shown in the portfolio/CV.

Include:

- Affected route, module or workflow.
- Reproduction steps.
- Expected and actual behavior.
- Any safe logs or screenshots that do not include secrets.

## Handling Rules

- Do not include real tokens, passwords, API keys or personal secrets in reports, issues, PRs or commits.
- Do not upload private CV files, contact messages or user data as proof.
- If a finding involves external providers, report only sanitized request/response metadata.

## Automated Scanning

- CodeQL runs on pushes and pull requests for `develop` and `master`.
- CodeQL also runs weekly and can be launched manually from GitHub Actions.
- Findings should be triaged before merging affected changes into `master`.

## Project Guardrails

- Admin routes must remain protected by auth guards and permissions.
- Frontend must not connect directly to PostgreSQL.
- CV adaptation must not invent professional facts.
- Upload handling must keep validation, quota and scan controls intact.
