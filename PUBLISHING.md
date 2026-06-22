# Publishing

Maintainer-only release checklist for `@sohojxpay/sdk`.

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
import { createSohojxPayClient } from '@sohojxpay/sdk'

const sohojxpay = createSohojxPayClient({
  baseUrl: process.env.SOHOJXPAY_BASE_URL!,
  serviceApiKey: process.env.SOHOJXPAY_SERVICE_API_KEY!,
})

console.log(await sohojxpay.recharge.getBalance())
```

## First Public Publish

```bash
npm login
npm whoami
npm run check
npm pack --dry-run
npm publish --access public
```

## Later Releases

```bash
npm version patch
npm publish --access public
```

Use `minor` for new backward-compatible features and `major` for breaking changes.
