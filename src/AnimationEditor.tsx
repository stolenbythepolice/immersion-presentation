import React, { useEffect, useState, useMemo, useCallback } from 'react'

import { useLocalStorage } from './utils'
import Morph from './Morph'

import './AnimationEditor.css'
// import localStorageData from './localStorage.json'

type Selection = [number, number, number]

type AnimationEditorProps = {
  animations: { start: string; end: string }[]
}

type Animation = {
  startGroups: Selection[]
  endGroups: Selection[]
  start: string
  end: string
  index?: number
}

type AnimationProps = {
  colorIndex: number
  setColorIndex: (arg: number) => void
  animation: Animation
  setAnimation: (arg: Animation) => void
}

/* global localStorage */
const allColors = [
  '#ff8a80',
  '#ea80fc',
  '#b388ff',
  '#8c9eff',
  '#82b1ff',
  '#80d8ff',
  '#84ffff',
  '#a7ffeb',
  '#b9f6ca',
  '#ccff90',
  '#f4ff81',
  '#ffff8d',
  '#ffe57f',
  '#ffd180',
  '#ff9e80'
]

function convertToTeX(tex: string, selections: Selection[]) {
  return (
    tex
      .split('')
      .map((c, i) => {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const ending = selections.filter(([c, s, e]) => e === i)
        const starting = selections
          .filter(([_c, s, _e]) => s === i)
          .sort((a, b) => b[2] - a[2]) // descending on `end`
          .map(([c, s, e]) => c)

        return (
          ending.map(() => '}').join('') +
          starting.map((col) => `\\g{${col + 1}}{`).join('') +
          c
        )
      })
      .join('') +
    selections
      .filter(([c, s, e]) => e === tex.length)
      .map(() => '}')
      .join('')
  )
}

export const lookupAnimationGroups = (() => {
  // TODO: use hashmap?
  return (start: string, end: string) => {
    const data = JSON.parse(localStorage.animationGroups || '[]') as Animation[]
    const result = data.find(({ start: s, end: e }) => {
      return (start === s && end === e) || (start === e && end === s)
    })

    // no result found
    if (!result) {
      return [start, end]
    }

    if (result.start === start) {
      // not reversed
      return [
        convertToTeX(result.start, result.startGroups),
        convertToTeX(result.end, result.endGroups)
      ]
    } else {
      // reversed
      return [
        convertToTeX(result.end, result.endGroups),
        convertToTeX(result.start, result.startGroups)
      ]
    }
  }
})()

export default function AnimationEditor({
  animations: playedAnimations
}: AnimationEditorProps): React.ReactElement {
  const [animations, setAnimations] = useLocalStorage<Animation[]>(
    'animationGroups',
    []
  )
  const [colorIndex, setColorIndex] = useState<number>(0)

  const onKeyPress = (e: KeyboardEvent): void => {
    try {
      const i = parseInt(e.key, 10)
      setColorIndex((i + 9) % 10)
    } catch (e) {}
  }

  useEffect(() => {
    window.addEventListener('keypress', onKeyPress)
    return () => window.removeEventListener('keypress', onKeyPress)
  }, [])

  useEffect(() => {
    const newOnes = playedAnimations
      .filter((animation) => {
        const animated = animations.find(
          (a) =>
            (animation.start === a.start && animation.end === a.end) ||
            (animation.start === a.end && animation.end === a.start)
        )
        const inDataBase = !animated
        return inDataBase
      })
      .map((anim) => ({
        ...anim,
        startGroups: [],
        endGroups: []
      }))

    if (newOnes.length >= 1) {
      setAnimations((animations) => [...animations, ...newOnes])
    }
  }, [animations, playedAnimations])

  const animationsIShouldShow = useMemo(
    () =>
      (playedAnimations
        .map((animation) => {
          const index = animations.findIndex(
            (a) =>
              (animation.start === a.start && animation.end === a.end) ||
              (animation.start === a.end && animation.end === a.start)
          )

          const a = animations[index]

          if (!a) return null

          return {
            ...a,
            start: '' + a.start,
            end: '' + a.end,
            index
          } as Animation
        })
        .filter((a) => a !== null) as (Animation & { index: number })[]).filter(
        (value, index, array) => {
          return (
            array.findIndex(
              ({ start, end }) => value.start === start && value.end === end
            ) === index
          )
        }
      ),
    [animations, playedAnimations]
  )

  return (
    <div className='animation-editor'>
      <div className='colors'>
        {allColors.map((c, i) => (
          <span
            key={i}
            className='color'
            style={{
              backgroundColor: c,
              transform: colorIndex === i ? 'scale(1.4)' : 'scale(1)'
            }}
            onClick={() => setColorIndex(i)}
          />
        ))}
      </div>
      <style>{` .formula *::selection { background: ${allColors[colorIndex]} } `}</style>

      <div className='animations'>
        {animationsIShouldShow.map((animation) => {
          const i = animation.index
          return (
            <Animation
              key={animation.start + animation.end}
              animation={animation}
              setAnimation={(f: Animation) =>
                setAnimations([
                  ...animations.slice(0, i),
                  f,
                  ...animations.slice(i + 1)
                ])
              }
              colorIndex={colorIndex}
              setColorIndex={setColorIndex}
            />
          )
        })}
      </div>
    </div>
  )
}

type Part = 'start' | 'end'

function Animation({
  colorIndex,
  setColorIndex,
  animation,
  setAnimation
}: AnimationProps) {
  const handleSelection = useCallback(() => {
    const sel = window.getSelection()

    if (!sel) return

    if (!sel.anchorNode || !sel.focusNode) return
    try {
      const sString = (sel.anchorNode?.parentNode as HTMLElement)?.dataset.index
      const eString = (sel.focusNode?.parentNode as HTMLElement)?.dataset.index
      if (sString === undefined || eString === undefined) return

      const s = parseInt(sString, 10) + sel.anchorOffset
      const e = parseInt(eString, 10) + sel.focusOffset

      // check if selection does not cross two formulas (before / after)
      const part1 = (sel.focusNode.parentNode as HTMLElement).dataset.part
      const part2 = (sel.focusNode.parentNode as HTMLElement).dataset.part

      if (!part1 || !part2) return
      if (part1 !== part2) return

      const part = part1
      if (part !== 'start' && part !== 'end') {
        return
      }

      const start = Math.min(s, e)
      const end = Math.max(s, e)
      if (start === end) {
        return
      }
      const newAnimation = {
        ...animation,
        [part + 'Groups']: mergeSelections([
          ...animation[(part + 'Groups') as 'endGroups' | 'startGroups'],
          [colorIndex, start, end]
        ])
      }

      setAnimation(newAnimation)
    } catch (e) {
      // Happend when you select non-formula stuff
      // do nothing
    } finally {
      sel?.removeAllRanges()
    }
  }, [animation, colorIndex])

  const handleClick = useCallback(
    (ev, part: Part) => {
      // remove
      if (ev.button === 2) {
        const index = ev.target.dataset.index
        const groups = (part + 'Groups') as 'endGroups' | 'startGroups'
        const selections = determineSelections(
          animation[part],
          animation[groups]
        )
        const activeSelection = selections[index]

        if (!activeSelection) {
          return
        }

        setAnimation({
          ...animation,
          [groups]: animation[groups].filter(
            (s: Selection) => s !== activeSelection
          )
        })

        return
      }

      // pick color
      if (ev.button === 1) {
        ev.preventDefault()
        const group = ev.target.dataset.group
        setColorIndex(+group)
        return
      }
    },
    [setAnimation, animation, setColorIndex, colorIndex]
  )

  // return <pre>{JSON.stringify(animation)}</pre>;

  const splitChars = (part: Part) => {
    const groups = (part + 'Groups') as 'endGroups' | 'startGroups'
    const selections = determineSelections(animation[part], animation[groups])
    return (
      <div key={part}>
        <span
          className='formula'
          style={{ fontFamily: 'Iosevka Term, monospace' }}
          onMouseUp={(e) => handleClick(e, part)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {animation[part].split('').map((c: string, j: number) => {
            const sel = selections[j]
            const color = sel === null ? '' : allColors[sel[0]]
            const group = sel === null ? -1 : sel[0]
            return (
              <span
                key={j}
                data-part={part}
                data-index={j}
                data-group={group}
                style={{ background: color }}
              >
                {c}
              </span>
            )
          })}
        </span>
      </div>
    )
  }

  return (
    <div className='animation' onMouseUp={() => handleSelection()}>
      {(['start', 'end'] as Part[]).map(splitChars)}
      <div className='preview'>
        <AutoMorph
          steps={[
            convertToTeX(animation.start, animation.startGroups),
            convertToTeX(animation.end, animation.endGroups)
          ]}
        />
      </div>
      {/* }<button className='remove' onClick={removeAnimation}>⨯</button> */}
    </div>
  )
}

function AutoMorph({ steps }: { steps: [string, string] }) {
  const [step, setStep] = useState<0 | 1>(0)
  const onClick = () => setStep((step) => ((step + 1) % 2) as 0 | 1)

  return (
    <div className='automorph' onClick={onClick}>
      <Morph TIMING={1.0} display useAnimationDatabase={false}>
        {steps[step]}
      </Morph>
    </div>
  )
}

function determineSelections(
  tex: string,
  selections: Selection[]
): (Selection | null)[] {
  const colors: (Selection | null)[] = []
  let levels: Selection[] = []
  tex.split('').forEach((_c, i) => {
    const ending = selections.filter(([_c, _s, e]) => e === i)

    const starting = selections
      .filter(([_c, s, _e]) => s === i)
      .sort((a, b) => b[2] - a[2]) // descending on `end`

    levels = levels.slice(0, levels.length - ending.length)
    levels = [...levels, ...starting]

    const currentActive = levels[levels.length - 1]
    if (!currentActive) {
      colors.push(null)
    } else {
      colors.push(currentActive)
    }
  })

  return colors
}

// TODO: unit test this
function mergeSelections(selections: Selection[]): Selection[] {
  const result: Selection[] = []
  selections.forEach(([color, start, end]) => {
    const prev = result.find(([c, _s, e]) => e === start && c === color)
    if (prev) {
      prev[2] = end
      return
    }
    const surrounding = result.find(
      ([c, s, e]) => c === color && s <= start && e >= end
    )

    if (surrounding) {
      // Don't include this selection, it is surrounded by a bigger selection of the same color
      return
    }

    result.push([color, start, end])
  })
  return result
}
