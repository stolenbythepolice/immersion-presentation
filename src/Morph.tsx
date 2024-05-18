import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useCallback
} from 'react'

import { animate, SVGData } from './lib/morph.js'
import { lookupAnimationGroups } from './AnimationEditor'

import { usePrevious, useIsomorphicLayoutEffect } from './utils.js'

export const wrapMathBasedOnProps = (
  props: { display?: boolean; inline?: boolean },
  s: string
): string => {
  if (props.display) {
    return '$\\displaystyle ' + s + '$'
  } else if (props.inline) {
    return '$' + s + '$'
  }
  return s
}

type MorphProps = {
  children: string
  display?: boolean
  inline?: boolean
  debug?: boolean
  useAnimationDatabase?: boolean
  replace?: boolean
  TIMING?: number
  style?: React.CSSProperties
  className?: string
}

// TODO: maybe use useLayout effect for some things?
function Morph({
  children,
  display,
  inline,
  debug,
  useAnimationDatabase = true,
  replace,
  TIMING = 0.6,
  style = {},
  className = ''
}: MorphProps): React.ReactElement {
  const svgEl = useRef<SVGSVGElement | null>(null)
  const [
    {
      viewBox: [vx, vy, vw, vh],
      width,
      height
    },
    setSvgData
  ] = useState<SVGData>({
    viewBox: [0, 0, 0, 0],
    width: 0,
    height: 0
  })

  const [transition, setTransition] = useState(false)

  const FONT_SCALING_FACTOR = 2

  const updateSvgData = ({ viewBox, width, height }: SVGData) => {
    setSvgData({
      viewBox,
      width: FONT_SCALING_FACTOR * width,
      height: FONT_SCALING_FACTOR * height
    })
  }

  const wrapMath = useCallback(
    (tex) => wrapMathBasedOnProps({ display, inline }, tex),
    [display, inline]
  )

  const previousChildren = usePrevious(children)

  // This eliminates "fly in" effect.
  useIsomorphicLayoutEffect(() => {
    if (!previousChildren) {
      setTransition(false)
    } else {
      setTransition(true)
    }
  }, [children])

  const promise = useRef(Promise.resolve())
  const update = async (children: string) => {
    const svg = svgEl.current
    const anim = (text: string, replaceImediately: boolean) => {
      if (!svg) return
      return animate(svg, text, replaceImediately, TIMING, updateSvgData)
    }

    if (!children) {
      await anim('', false)
      return
    }

    if (typeof children !== 'string') {
      console.error("Trying to compile something that is'nt text:", children)
      return
    }

    if (!previousChildren) {
      await anim(wrapMath(children), false)
      return
    }

    if (replace) {
      await anim(wrapMath(children), true)
      return
    }

    if (useAnimationDatabase) {
      const [before, after] = lookupAnimationGroups(
        previousChildren || '',
        children
      )

      await anim(wrapMath(before), true)
      await anim(wrapMath(after), false)
    } else {
      await anim(wrapMath(children), false)
    }
  }

  useEffect(() => {
    // This plays the animation after all the others have played.
    // Makes sure two animations aren't playing at the same time

    promise.current = promise.current
      .then(() => update(children))
      .catch(() => {
        console.log('Failed to update Morph children')
      })
  }, [children])

  const inner = (
    <div
      style={{
        ...(display
          ? {
              left: '50%',
              transform: `translate(${-width / 2}pt, 0)`
            }
          : {}),
        width: 0,
        height: 0,
        marginTop: `${-vy * FONT_SCALING_FACTOR}pt`,
        marginRight: `${width}pt`,
        verticalAlign: 'baseline',
        position: 'relative',
        display: 'inline-block',
        ...(transition
          ? {
              transition: `${TIMING}s margin-right, ${TIMING}s margin-top, ${TIMING}s transform`
            }
          : {
              transition: ` ${TIMING}s margin-top`
            }),
        ...(debug ? { outline: '1px solid lightblue' } : {})
      }}
      className={className}
    >
      <svg
        width={width + 'pt'}
        height={height + 'pt'}
        viewBox={[vx, vy, vw, vh].join(' ')}
        style={{
          display: 'inline-block',
          position: 'absolute',
          top: `${FONT_SCALING_FACTOR * vy}pt`,
          verticalAlign: 'baseline',
          ...(debug ? { outline: '1px solid yellow' } : {}),
          ...style
        }}
        ref={svgEl}
      />
    </div>
  )

  if (display) {
    return (
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          height: height + 'pt',
          margin: '0.5em 0',
          transition: `${TIMING}s height`,
          ...(debug ? { outline: '1px solid red' } : {})
        }}
      >
        {inner}
      </div>
    )
  } else {
    return (
      <Fragment>
        {/* strut */}
        <div
          style={{
            display: 'inline-block',
            width: 0,
            verticalAlign: 'text-top',
            marginTop: '0.9em',
            height: height + vy + 'pt',
            ...(transition
              ? { transition: `${TIMING}s height, ${TIMING}s margin-bottom` }
              : {}),
            ...(debug ? { width: '2px', background: 'limegreen' } : {})
          }}
        />
        {inner}
      </Fragment>
    )
  }
}

export default Morph
