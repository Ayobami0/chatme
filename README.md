# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies (this project uses pnpm; see [Testing](#testing))

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Testing

### Required versions

| Tool | Version | Source |
| --- | --- | --- |
| Node.js | 24.x (CI uses 24) | `.github/workflows/testing.yml` |
| pnpm | 10.33.0 | `package.json` `packageManager`, `pnpm-lock.yaml` |
| Expo SDK | 55 (`expo ~55.0.29`) | `package.json` |
| React / React Native | 19.2.0 / 0.83.10 | `package.json` |
| TypeScript | ~5.9.3 | `package.json` |
| Jest / jest-expo | 29.7 / ~55.0.22 | `package.json` |
| React Native Testing Library | 13.3 | `package.json` |

Use pnpm only; `pnpm-lock.yaml` is the single lockfile.

### Commands

```bash
pnpm install --frozen-lockfile   # install exactly what the lockfile pins
pnpm test                        # run all tests
pnpm exec jest <file>            # run one file, e.g. pnpm exec jest message-composer.test.tsx
pnpm run test:watch              # rerun on change (local only)
pnpm run test:coverage           # coverage report in coverage/ (git-ignored)
pnpm run verify                  # typecheck + lint + tests, as run in CI and before push
```

### How tests are set up

- Jest config lives in `package.json` (`jest` key): the `jest-expo` preset, tests discovered as `src/**/__tests__/**/*.test.ts(x)`, and coverage collected from `src` (excluding `src/app` routes and generated SVG icons).
- Tests live next to the code they check, in `__tests__` folders, and never under `src/app` (Expo Router would treat them as routes).
- `jest.setup.js` mocks AsyncStorage only. `.svg` imports map to `jest/svg-mock.js` because Jest doesn't run Metro's SVG transformer. Network, clock and storage are controlled per test; the application logic under test stays real.

### Before pushing

`pnpm run verify` must pass. A pre-push hook runs it automatically. Enable it once per clone:

```bash
git config --local core.hooksPath .githooks
```

GitHub Actions (`.github/workflows/testing.yml`) runs the same `verify` on every push and pull request.

