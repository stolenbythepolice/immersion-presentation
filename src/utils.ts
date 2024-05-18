import memoize from 'memoizee'

import { pathParse, serializePath } from 'svg-path-parse'

import { useEffect, useRef, useState, useLayoutEffect } from 'react'

import { LaTeXSVGData } from './types'

export const range = (n: number): number[] => Array.from(Array(n).keys())

/* global fetch */

export const hashString = function (str: string): number {
  let hash = 0
  let i: number
  let chr: number
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const queryParameters = (obj: { [key: string]: string }): string => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
}

const cacheBust = '8'
export const LaTeX = {
  _preamble: ``,
  _host: `http://${
    typeof window !== 'undefined' ? window.location.hostname : 'example.com'
  }:3001`,
  getHost: (): string => LaTeX._host,
  setHost: (h: string): void => {
    LaTeX._host = h
  },
  getPreamble: (): string => LaTeX._preamble,
  setPreamble: (p: string): void => {
    LaTeX._preamble = normalizeLaTeXPreamble(p)
  },
  fetchSVG: async (tex: string): Promise<string> => {
    const result = await fetch(
      `${LaTeX.getHost()}/latex?${queryParameters({
        cachebust: cacheBust,
        tex: tex,
        preamble: LaTeX.getPreamble()
      })}`
    )
    if (result.ok) {
      return await result.text()
    } else {
      const error = await result.json()
      if (error.name === 'CompilationError') {
        throw new Error(
          `Could not compile '${error.tex}': ${error.latexErrors.join('\n')}`
        )
      } else {
        throw new Error(error.message)
      }
    }
  }
}

function normalizeLaTeXPreamble(preamble: string) {
  return preamble
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n')
}

function elementToPath(child: SVGElement, transform = ''): string | null {
  if (!child.ownerSVGElement) {
    throw new Error('Found a child without ownerSVGElement')
  }
  const svg: SVGSVGElement = child.ownerSVGElement
  if (child.tagName === 'use') {
    const offsetX = parseFloat(child.getAttribute('x') || '0')
    const offsetY = parseFloat(child.getAttribute('y') || '0')

    const id = child.getAttribute('xlink:href')
    if (!id) {
      throw new Error('Found a use tag without an id.')
    }

    const element: SVGElement | null = svg.querySelector(id)
    if (!element) {
      console.error(
        'I found a use tag with id',
        id,
        child,
        "but I didn't find a definition in the svg: ",
        svg
      )
      return null
    }
    if (element.tagName === 'path') {
      const path = element.getAttribute('d')
      const { err, segments, type } = pathParse(path).relNormalize({
        transform: `translate(${offsetX}, ${offsetY}) ${transform}`.trim()
      })

      const newPath = serializePath({ err, segments: segments, type })

      return newPath
    } else if (element.tagName === 'use') {
      const tr = element.getAttribute('transform') || ''
      return elementToPath(
        element,
        `translate(${offsetX}, ${offsetY}) ${tr}`.trim()
      )
    } else {
      console.error('Unrecognized use of element', element)
      return null
    }
  }

  if (child.tagName === 'rect') {
    const x = +child.getAttribute('x')!
    const y = +child.getAttribute('y')!
    const width = +child.getAttribute('width')!
    const height = +child.getAttribute('height')!

    const pathData =
      'M' + x + ' ' + y + 'H' + (x + width) + 'V' + (y + height) + 'H' + x + 'z'
    return pathData
  }
  // TODO polyline or something like that
  console.error('Unrecognized:', child)
  return null
}

function groupIdFromElement(element: SVGElement): string {
  const fill = element.getAttribute('fill')
  if (!fill) {
    return 'g0'
  }
  return 'g' + fill.slice(1)
}

function svgToGroupedPaths(svg: SVGSVGElement) {
  const byGroupId: { [key: string]: string } = {}

  for (const child of Array.from(svg.getElementById('page1').children)) {
    const id = groupIdFromElement(child as SVGElement)
    let path: string | null
    if (child.tagName === 'g') {
      path = Array.from(child.children)
        .map((subchild) => elementToPath(subchild as SVGElement))
        .filter(Boolean)
        .join(' ')
    } else {
      path = elementToPath(child as SVGElement)
    }
    if (!path) continue

    if (!byGroupId[id]) {
      byGroupId[id] = ''
    }
    byGroupId[id] += path
  }

  return byGroupId
}

function colorHash(str: string): string {
  str = String(str)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let colour = ''
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    colour += ('00' + value.toString(16)).substr(-2).toUpperCase()
  }
  return colour
}

export const fetchLaTeXSvg = memoize(
  async (tex: string): Promise<LaTeXSVGData | null> => {
    /* console.log('compiling', tex) */
    tex = tex.replace(/\\g(\d)/g, (_, p1) => `\\g{${colorHash(p1)}}`)
    tex = tex.replace(/\\g\{(.*?)\}/g, (_, p1) => `\\g{${colorHash(p1)}}`)

    // console.log('COMPILING', tex)
    let text: string
    try {
      text = await LaTeX.fetchSVG(tex)
    } catch (e) {
      console.error(`%cLaTeXError: ${e.message}`, 'color: #AD1457')
      return null
    }

    const ele = document.createElement('div')
    ele.innerHTML = text

    const svg = ele.querySelector('svg')

    if (!svg) {
      throw new Error(`Could not find SVG in compiled LaTeX ${tex}`)
    }

    const groups = svgToGroupedPaths(svg)

    const width = svg.getAttribute('width')
    const height = svg.getAttribute('height')
    const viewBox = svg.getAttribute('viewBox')
    if (!width || !height || !viewBox) {
      throw new Error('Compiled LaTeX SVG has no height or width or viewBox')
    }
    return {
      groups,
      width: parseFloat(width.replace('pt', '')),
      height: parseFloat(height.replace('pt', '')),
      viewBox: viewBox.split(' ').map((s) => parseFloat(s))
    }
  }
)

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

// Hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key)
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error also return initialValue
      console.log(error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((t: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      // Save state
      setStoredValue(valueToStore)
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error)
    }
  }
  return [storedValue, setValue] as const
}

export const isBrowser = typeof window !== 'undefined'
export const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect
