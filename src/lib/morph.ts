import { fetchLaTeXSvg } from '../utils'

import gsap from 'gsap'
import MorphSVGPlugin from '../gsap/MorphSVGPlugin'
import DrawSVGPlugin from '../gsap/DrawSVGPlugin'

import { LaTeXSVGData } from '../types'

gsap.registerPlugin(MorphSVGPlugin, DrawSVGPlugin)

// FIXME temp 'hack', should add colors={[...]} to <Morph>?

function colorFromGroupId(id: string): string {
  if (id === 'g0') return 'black'
  return '#' + id.slice(1)
}

const whiteListedColors = ['#00d56f']

const DEFAULT_TIMING = 0.4

export type SVGData = {
  width: number
  height: number
  viewBox: number[]
}
export async function animate(
  svgEl: SVGSVGElement,
  text: string,
  replaceImediately = false,
  TIMING: number = DEFAULT_TIMING,
  setSvgData: (data: SVGData) => void = () => undefined
): Promise<any[]> {
  let data: LaTeXSVGData
  if (text === '') {
    data = {
      groups: {},
      width: 0,
      height: 0,
      viewBox: [0, 0, 0, 0]
    }
  } else {
    data = await fetchLaTeXSvg(text)
  }

  if (!data) {
    return []
  }

  const { groups: newPaths, width, height, viewBox } = data

  // This should check if is unmounted
  setSvgData({ width, height, viewBox })

  const afterIds = Object.keys(newPaths)
  const beforeIds = Array.from(svgEl.querySelectorAll('[id]')).map((e) => e.id)
  const allIds = Array.from(new Set([...afterIds, ...beforeIds]))

  return Promise.all(
    allIds.map(async (id) => {
      const shouldRemove = beforeIds.includes(id) && !afterIds.includes(id)
      const isNew = afterIds.includes(id) && !beforeIds.includes(id)

      if (shouldRemove) {
        const element = svgEl.getElementById(id)
        if (replaceImediately) {
          element.remove()
          return true
        } else {
          await gsap.to(element, {
            duration: TIMING,
            opacity: 0
          })
          element.remove()
          return true
        }
      }

      if (isNew) {
        const path = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        )
        path.id = id
        path.setAttribute('d', newPaths[id])

        const color = colorFromGroupId(id)
        if (whiteListedColors.includes(color)) {
          path.setAttribute('fill', color)
        }

        path.style.opacity = '0'
        svgEl.appendChild(path)

        if (replaceImediately) {
          path.style.opacity = '1'
          return true
        } else {
          await gsap.to(path, {
            duration: TIMING,
            opacity: 1
          })
          return true
        }
      }

      // morphing
      const element = svgEl.getElementById(id) as SVGElement

      if (replaceImediately) {
        element.setAttribute('d', newPaths[id])
        element.style.opacity = '1'
        return true
      } else {
        await gsap.to(element, {
          duration: TIMING,
          morphSVG: newPaths[id],
          // TODO test if makes difference!
          // type:"rotational",
          opacity: 1
        })
        return true
      }
    })
  )
}
