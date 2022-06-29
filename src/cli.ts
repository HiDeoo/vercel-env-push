import cac from 'cac'

import { version } from '../package.json'

const cli = cac('vercel-env-push')

cli.version(version).help()

cli.parse()
