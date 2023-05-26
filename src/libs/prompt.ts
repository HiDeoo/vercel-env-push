import readline from 'node:readline'

import Table from 'cli-table3'
import * as kolorist from 'kolorist'
import { createSpinner } from 'nanospinner'

export { type Spinner } from 'nanospinner'

const tableColumnWidth = Math.floor(((process.stdout.columns ?? 80) - 10) / 2)

export function text(builder: (colors: typeof kolorist) => string) {
  console.log(builder(kolorist))
}

export function table(builder: (colors: typeof kolorist) => [headers: string[], values: string[][]]) {
  const [headers, values] = builder(kolorist)

  const table = new Table({
    colWidths: [tableColumnWidth, tableColumnWidth],
    head: headers,
    style: { head: [] },
    wordWrap: true,
    wrapOnWordBoundary: false,
  })

  table.push(...values)

  console.log(table.toString())
}

export function redact(value: string) {
  if (value.length < 5) {
    return '*'.repeat(value.length)
  }

  return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1]
}

export function spin(message: string) {
  return createSpinner(message, { color: 'cyan' }).start()
}

export function confirm(question: string, defaultYes = true) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise<void>((resolve, reject) => {
    const answers = getConfirmAnswers(defaultYes)

    rl.question(`${question} (${answers[0]}/${answers[1]}) `, (answer) => {
      rl.close()

      const sanitizedAnswer = answer.trim().toLowerCase()

      if ((sanitizedAnswer === '' && defaultYes) || sanitizedAnswer === 'y' || sanitizedAnswer === 'yes') {
        return resolve()
      }

      return reject(new Error('User aborted.'))
    })
  })
}

function getConfirmAnswers(defaultYes = true): [string, string] {
  return [defaultYes ? 'Y' : 'y', !defaultYes ? 'N' : 'n']
}
