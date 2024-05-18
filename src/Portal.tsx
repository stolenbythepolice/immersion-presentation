// MAYBE try to apply this to make it more smooth?
// https://aerotwist.com/blog/flip-your-animations/
// Also: web animation api might be useful?

import React, { useRef, useEffect, useContext } from 'react'

import useResizeObserver from 'use-resize-observer'

import {
  PresentationContext,
  PresentationContextInterface,
  Transitions
} from './Presentation'

type Rect = {
  left: number
  top: number
  width: number
  height: number
  parentWidth: number
  parentHeight: number
}

type Portal = {
  zoom: 'in' | 'out' | null
  rect: Rect
}

function getRect(element: HTMLElement): Rect {
  let el = element
  let offsetLeft = 0
  let offsetTop = 0

  do {
    offsetLeft += el.offsetLeft // + el.clientLeft;
    offsetTop += el.offsetTop // + el.clientTop;

    el = el.offsetParent as HTMLElement
  } while (!el.classList.contains('slide'))
  return {
    left: offsetLeft,
    top: offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
    parentWidth: el.offsetWidth,
    parentHeight: el.offsetHeight
  }
}

const addPortal = (
  { i, setTransitions }: PresentationContextInterface,
  portal: Portal
): void => {
  const {
    rect: { width, height, left, top, parentWidth, parentHeight }
  } = portal
  const sx = parentWidth / width
  const sy = parentHeight / height

  const s = Math.max(sx, sy)

  const x = left
  const y = top

  const enlarge: React.CSSProperties = {
    transformOrigin: `${x + width / 2}px ${y + height / 2}px`,
    transform: `translate3d(${-(x + width / 2) + parentWidth / 2}px, ${
      -(y + height / 2) + parentHeight / 2
    }px, 0px) scaleX(${s}) scaleY(${s})`,
    opacity: 0
  }

  const shrink: React.CSSProperties = {
    transformOrigin: `${parentWidth / 2}px ${parentHeight / 2}px`,
    transform: `translate3d(${-parentWidth / 2 + x + width / 2}px, ${
      -parentHeight / 2 + y + height / 2
    }px, 0px) scaleX(${1 / s}) scaleY(${1 / s})`,
    opacity: 0
  }

  setTransitions(
    (transitions: Transitions): Transitions => {
      const newTransitions = { ...transitions }
      if (portal.zoom === 'in') {
        newTransitions[i] = {
          ...(newTransitions[i] || {}),
          after: enlarge
        }
        newTransitions[i + 1] = {
          ...(newTransitions[i + 1] || {}),
          before: shrink
        }
      }

      // Problem: if out and in: current transformOrigin gets set twice!
      // FIXME
      if (portal.zoom === 'out') {
        newTransitions[i - 1] = {
          ...(newTransitions[i - 1] || {}),
          after: shrink
        }
        newTransitions[i] = {
          ...(newTransitions[i] || {}),
          before: enlarge
        }
      }
      return newTransitions
    }
  )
}

type PortalProps = {
  children: React.ReactNode
  zoomin?: boolean
  zoomout?: boolean
  [key: string]: any
}

export default function Portal({
  children,
  zoomin,
  zoomout,
  className = '',
  ...props
}: PortalProps): React.ReactNode {
  const context = useContext(PresentationContext)
  const zoom = zoomin ? 'in' : zoomout ? 'out' : null

  const ref = useRef<HTMLDivElement | null>(null)
  useResizeObserver({
    ref,
    onResize: () => {
      if (!zoom) return
      if (!ref.current) return
      if (!context) return
      const rect = getRect(ref.current)
      addPortal(context, { zoom, rect })
    }
  })

  return (
    <div className={`inline-block ${className}`} ref={ref} {...props}>
      {children}
    </div>
  )
}
