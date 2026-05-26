# Publishing to npm

This monorepo publishes two packages:

- [`@iammaxim/docgen`](../packages/docgen) — the SvelteKit library
- [`@iammaxim/create-docgen`](../packages/create-docgen) — the bootstrapper

Each is published independently. CI handles the actual `npm publish` — humans bump versions, push tags, and create a GitHub Release.

## One-time setup

### 1. Reserve the npm scope

```sh
npm login                       # if not already
npm org create iammaxim         # only the first time; or use a personal scope
```

If using a personal username scope (no org needed), skip `npm org create` — scoped packages under `@<your-npm-username>/*` work out of the box.

### 2. Enable 2FA

```sh
npm profile enable-2fa auth-and-writes
```

### 3. Generate an automation token

[https://www.npmjs.com/settings/&lt;username&gt;/tokens](https://www.npmjs.com/) →
**Generate New Token** → **Granular Access Token**:

- Permissions: **Read and write**
- Packages: `@iammaxim/docgen`, `@iammaxim/create-docgen` (or a wildcard `@iammaxim/*`)
- Expiry: 1 year, set a calendar reminder to rotate

Copy the token (you only see it once).

### 4. Add the token to GitHub

Repository **Settings → Secrets and variables → Actions → New repository secret**:

- Name: `NPM_TOKEN`
- Value: the token from step 3

### 5. Provenance (free, recommended)

The publish workflow already uses `--provenance`. This requires:

- Repository must be public (it is)
- Workflow needs `id-token: write` permission (already set in `publish.yml`)
- No extra config

## Releasing a new version

Both packages release together in lockstep — same version, one tag, one Release.

1. Bump the version in **both** packages (must match):

   ```sh
   NEW=0.2.0
   npm version --workspace @iammaxim/docgen --workspace @iammaxim/create-docgen \
     --no-git-tag-version "$NEW"
   git add packages/*/package.json package-lock.json
   git commit -m "release: v$NEW"
   git tag "v$NEW"
   ```

2. Push:

   ```sh
   git push origin master "v$NEW"
   ```

3. Create the GitHub Release:

   ```sh
   gh release create "v$NEW" --title "v$NEW" --generate-notes
   ```

   (or via the web UI: Releases → Draft a new release → pick the tag.)

4. Watch the **Publish** workflow finish in the **Actions** tab.
   It validates that both `package.json` files match the tag version before publishing,
   then publishes `@iammaxim/docgen` first, followed by `@iammaxim/create-docgen`.

## Manual publish (fallback)

If CI is down, you can publish locally with your token:

```sh
# Build first
npm run build -w @iammaxim/docgen

cd packages/docgen
npm publish --provenance --access public
```

You'll be prompted for an OTP if 2FA is enabled.

## Verifying a release

```sh
npm view @iammaxim/docgen version
npm view @iammaxim/create-docgen version
```

Smoke-test the bootstrapper:

```sh
npx @iammaxim/create-docgen@latest /tmp/smoke-test
```

## Troubleshooting

**`E403 Forbidden` on first publish.** The scope might not be claimed yet. Run `npm publish --access public` from your local machine once to claim it — subsequent CI publishes will succeed.

**`OTP required` from CI.** Your automation token is the wrong type — regenerate as **Granular Access Token** with 2FA bypass enabled (automation tokens skip OTP).

**Provenance fails.** Confirm the workflow has `permissions: id-token: write` and the repo is public.

**Tag/version mismatch.** The publish workflow refuses to publish when the tag version doesn't match `package.json`. Fix `package.json`, force-update the tag, push again.
