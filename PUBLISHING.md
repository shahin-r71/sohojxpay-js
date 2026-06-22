# Publishing

Maintainer-only release checklist for `sohojxpay-sdk`.

## Local Verification

```bash
npm install
npm run check
npm pack --dry-run
```

## Test The Packed Package In Another App

From this SDK repo:

```bash
npm pack
```

Install the generated tarball in a separate test project:

```bash
npm install D:\work\projects\recharge-projects\sohojxpay-js\sohojxpay-sdk-0.1.0.tgz
```

Use a safe endpoint first:

```ts
import { createSohojxPayClient } from 'sohojxpay-sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

console.log(await sohojxpay.recharge.getBalance())
```

## First Public Publish

Unscoped packages are public by default, so this package does not need `--access public`.

```bash
npm login
npm whoami
npm run check
npm pack --dry-run
npm publish
```

## Later Releases

```bash
npm version patch
npm publish
```

Use `minor` for new backward-compatible features and `major` for breaking changes.

## If The Wrong Package Name Was Published

If you published a package name that users should not install, prefer deprecating it with a migration message:

```bash
npm deprecate wrong-package-name "This package name is deprecated. Please use sohojxpay-sdk instead."
```

If it was just published and has no users yet, npm may allow unpublishing:

```bash
npm unpublish wrong-package-name@0.1.0 --force
```

After unpublishing, that exact package name and version cannot be reused. Publish the correct package as a new package/version.
