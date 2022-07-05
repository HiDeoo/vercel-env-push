import readline from 'node:readline'

import * as kolorist from 'kolorist'

export function text(colorizer: (colors: typeof kolorist) => string) {
  console.log(colorizer(kolorist))
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
