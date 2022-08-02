<div align="center">
  <h1>vercel-env-push 🔏</h1>
  <p>The missing <code>vercel env push</code> command</p>
  <p>
    <a href="https://user-images.githubusercontent.com/494699/178267610-2843f230-f048-43d4-88b5-baba6ee00e4d.png" title="Screenshot of vercel-env-push">
      <img alt="Screenshot of vercel-env-push" src="https://user-images.githubusercontent.com/494699/178267610-2843f230-f048-43d4-88b5-baba6ee00e4d.png" width="520" />
    </a>
  </p>
</div>

<div align="center">
  <a href="https://github.com/HiDeoo/vercel-env-push/actions/workflows/integration.yml">
    <img alt="Integration Status" src="https://github.com/HiDeoo/vercel-env-push/actions/workflows/integration.yml/badge.svg" />
  </a>
  <a href="https://github.com/HiDeoo/vercel-env-push/blob/main/LICENSE">
    <img alt="License" src="https://badgen.net/github/license/hideoo/vercel-env-push" />
  </a>
  <br /><br />
</div>

## Motivations

The [Vercel command-line interface (CLI)](https://vercel.com/docs/cli) provides a `vercel env pull [file]` command that can be used to pull development environment variables from a Vercel project and write them to a .env file. Unfortunately, the reverse operation is not doable through the Vercel CLI.

As I couldn't find any other tools providing this functionality with the features I wanted, I decided to write my own which internally uses [`npx`](https://docs.npmjs.com/cli/v8/commands/npx) to run the Vercel CLI either installed locally or fetched remotely.

## Features

- Usable as a command-line tool or through an API
- Push to multiple environments at once
- Ability to add/remove/edit environment variables before pushing
- Support for [authorization tokens](https://vercel.com/docs/cli#introduction/global-options/token)
- Dry-run mode

## Usage

### CLI

You can either add `vercel-env-push` to your project and invoke it with your favorite package manager (or through an entry in your project's `package.json` file):

```shell
$ pnpm add -D vercel-env-push
$ pnpm vercel-env-push <file> <env> [...otherEnvs]
```

or use it directly with `npx`:

```shell
$ npx vercel-env-push <file> <env> [...otherEnvs]
```

The `file` argument is the path to the .env file containing the environment variables to push. The `env` argument is the name of the environment to push the environment variables to (the supported environments are `development`, `preview` and `production`). You can specify multiple environments by separating them with spaces.

#### Usage

```shell
# Push the environment variables from the .env.local file to the preview & production environments.
$ pnpm vercel-env-push .env.local preview production
```

#### Options

The following options are available through the CLI:

##### `--dry, --dry-run`

List environment variables without pushing them.

```shell
$ pnpm vercel-env-push .env.local development --dry
```

##### `-t, --token`

Login token to use for pushing environment variables.

```shell
$ VERCEL_ORG_ID=<ORG_ID> VERCEL_PROJECT_ID=<PROJECT_ID> pnpm vercel-env-push .env.local development -t <TOKEN>
```

This can be especially useful if you ever need to push environment variables [from a CI pipeline](https://vercel.com/support/articles/using-vercel-cli-for-custom-workflows).

```yaml
- name: Push environment variables from GitHub Actions
  run: pnpm vercel-env-push .env.local preview -t "$VERCEL_TOKEN"
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

##### `-b, --branch`

The Git branch to apply the environment variables to when pushing environment variables to the Preview environment.

```shell
$ pnpm vercel-env-push .env.local preview --branch my-preview-branch
```

### API

`vercel-env-push` can also be used through an API:

```ts
pushEnvVars(envFilePath: string, envs: string[], options?: Options): Promise<void>
```

#### Usage

```ts
import { pushEnvVars } from 'vercel-env-push'

// Push the environment variables from the .env.local file to the preview & production environments.
await pushEnvVars('.env.local', ['preview', 'production'])
```

#### Options

##### `token`

Determines a [login token](https://vercel.com/docs/cli#introduction/global-options/token) to use for pushing environment variables.

```ts
import { pushEnvVars } from 'vercel-env-push'

await pushEnvVars('.env.local', ['preview', 'production'], {
  token: process.env.VERCEL_TOKEN,
})
```

##### `branch`

Determines a Git branch to apply the environment variables to when pushing environment variables to the Preview environment.

```ts
import { pushEnvVars } from 'vercel-env-push'

await pushEnvVars('.env.local', ['preview'], {
  branch: process.env.GIT_BRANCH,
})
```

##### `prePush`

Specifies a callback that can be used to add/remove/edit environment variables before pushing.

```ts
import { pushEnvVars } from 'vercel-env-push'

await pushEnvVars('.env.local', ['preview', 'production'], {
  prePush: async ({ keyToRemove, ...otherEnvVars }) => {
    const secretValue = await getSecretValueFromVault()

    return {
      ...otherEnvVars,
      newKey: 'newValue',
      existingKey: 'updatedValue',
      secret: secretValue,
    }
  },
})
```

> **Note**
> The `dryRun` & `interactive` options are also available through the API but are mostly useless in this context.

## License

Licensed under the MIT License, Copyright © HiDeoo.

See [LICENSE](https://github.com/HiDeoo/vercel-env-push/blob/main/LICENSE) for more information.
