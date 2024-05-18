import { range } from './utils'

interface Timeline {
  (strings: TemplateStringsArray, ...subs: any[]): { [key: string]: any }[]
  abbreviations: { [key: string]: any }
}

// https://stackoverflow.com/questions/12766528/build-a-function-object-with-properties-in-typescript#41853194

// interna
export const _internalTimeline = (
  strings: TemplateStringsArray,
  ...subs: any[]
): {
  output: { [key: string]: any }[]
  [key: string]: any
} => {
  const defaultAbbreviations = timeline.abbreviations

  const translate = (sub: any) => (s: string | number): any =>
    Object.prototype.hasOwnProperty.call(sub, s)
      ? sub[s]
      : Object.prototype.hasOwnProperty.call(defaultAbbreviations, s)
      ? defaultAbbreviations[s]
      : s

  const fillWithLastUntilHasLength = (array: any[], length: number) => {
    const last = array[array.length - 1]
    return [
      ...array,
      ...Array.from({ length: length - array.length }).map(() => last)
    ]
  }

  const lines = strings.flatMap((part, i) => {
    const lines = part.split('\n').filter((line) => line.trim() !== '')
    if (lines.length === 0) return []
    const firsts = lines.slice(0, lines.length - 1)
    const last = lines[lines.length - 1]

    return [
      ...firsts.map((l) => ({ text: l, sub: {} })),
      { text: last, sub: subs[i] }
    ]
  })

  const charactersInterpreted = lines
    .map(({ text, sub }) => {
      const trimmed = text.trim()
      const splitted = trimmed.split(/\s+(.+)/)

      return {
        label: splitted[0],
        text: splitted[1],
        sub: sub
      }
    })
    .map(({ label, sub, text }) => {
      const numbers: (string | number | number[])[] = []
      let number = 0

      text.split('').forEach((step, i) => {
        const prev = numbers[numbers.length - 1]
        const nextChar = text[i + 1]

        if (step === ' ') {
          numbers.push(prev)
          return
        }
        if (step === '+' || step === '-') {
          if (step === '+') {
            number += 1
          } else {
            number -= 1
          }
          numbers.push(number)
          return
        }

        if (step === '.') {
          if (Array.isArray(prev)) {
            throw new Error(
              'Cannot use a dot . in a timeline specification immediately following another dot'
            )
          }
          if (typeof prev === 'string') {
            throw new Error(
              'Cannot use a dot . if it is surrounded by non-numbers'
            )
          }
          if (isNaN(prev)) return

          let to
          if (nextChar && !isNaN(parseInt(nextChar))) {
            to = parseInt(nextChar)
          } else {
            to = sub.length
          }

          const rangeInBetween = range(to - prev - 1).map((n) => n + prev + 1)

          if (rangeInBetween.length === 0) {
            numbers.push(prev)
            return
          }

          numbers.push(rangeInBetween)
          return
        }

        const n = parseInt(step)
        if (!isNaN(n)) {
          number = n
          numbers.push(number)
          return
        }
        numbers.push(step)
      })
      return { label, numbers, sub, text }
    })

  const numberOfUnexpandedSteps = Math.max(
    ...charactersInterpreted.map((obj) => obj.numbers.length)
  )

  const getLength = (index: number) =>
    Math.max(
      ...charactersInterpreted.map(({ numbers }) => {
        const element = numbers[index]
        if (Array.isArray(element)) {
          return element.length
        } else {
          return 1
        }
      })
    )

  const expanded = charactersInterpreted.map(({ label, numbers, sub }) => {
    const expandedSteps = range(numberOfUnexpandedSteps).flatMap((index) => {
      const length = getLength(index)

      let numberOrNumbers

      if (numbers[index] !== undefined) {
        numberOrNumbers = numbers[index]
      } else {
        const last = numbers[numbers.length - 1]
        if (Array.isArray(last)) {
          numberOrNumbers = last[last.length - 1]
        } else {
          numberOrNumbers = last
        }
      }

      if (Array.isArray(numberOrNumbers)) {
        return fillWithLastUntilHasLength(numberOrNumbers, length)
      } else {
        return fillWithLastUntilHasLength([numberOrNumbers], length)
      }
    })

    return {
      label,
      expandedSteps,
      translated: expandedSteps.map(translate(sub || {}))
    }
  })

  const output = range(expanded[0].translated.length).map((stepIndex) => {
    return Object.fromEntries(
      expanded.map(({ label, translated }) => [label, translated[stepIndex]])
    )
  })

  return {
    charactersInterpreted,
    expanded,
    output,
    numberOfUnexpandedSteps,
    lengths: range(numberOfUnexpandedSteps).map((_, i) => getLength(i))
  }
}

export const timeline: Timeline = Object.assign(
  (strings: TemplateStringsArray, ...subs: any[]): { [key: string]: any }[] => {
    return _internalTimeline(strings, ...subs).output
  },
  {
    abbreviations: {
      h: { opacity: 0 },
      v: { opacity: 1 },
      p: { opacity: 0.3 },
      d: { drawSVG: 0 },
      D: { drawSVG: '0 100%' }
    }
  }
)
