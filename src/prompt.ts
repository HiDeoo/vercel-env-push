import readline from 'node:readline'

import Table from 'cli-table3'
import * as kolorist from 'kolorist'
import { type Ora } from 'ora'

export function text(builder: (colors: typeof kolorist) => string) {
  console.log(builder(kolorist))
}

export function table(builder: (colors: typeof kolorist) => [headers: string[], values: string[][]]) {
  const [headers, values] = builder(kolorist)

  const table = new Table({
    head: headers,
    style: { head: [] },
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

export async function spin(message: string) {
  const { default: ora } = await import('ora')

  return ora({ color: 'cyan', text: message }).start()
}

export function confirm(question: string, defaultYes = true) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise<boolean>((resolve) => {
    const answers = getConfirmAnswers(defaultYes)

    rl.question(`${question} (${answers[0]}/${answers[1]}) `, (answer) => {
      rl.close()

      console.log('\n')

      const sanitizedAnswer = answer.trim().toLowerCase()

      if ((sanitizedAnswer === '' && defaultYes) || sanitizedAnswer === 'y' || sanitizedAnswer === 'yes') {
        return resolve(true)
      }

      return resolve(false)
    })
  })
}

function getConfirmAnswers(defaultYes = true): [string, string] {
  return [defaultYes ? 'Y' : 'y', !defaultYes ? 'N' : 'n']
}

export type Spinner = Ora
