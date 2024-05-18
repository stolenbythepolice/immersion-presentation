import React, { useEffect, useState } from 'react'

type Size = {
  width: number
  height: number
}
// TODO: rename this
function measureText(text: string, style: React.CSSProperties = {}): Size {
  const div = document.createElement('div')

  document.body.appendChild(div)
  div.style.position = 'absolute'
  div.style.left = '-1000'
  div.style.top = '-1000'
  for (const key in style) {
    div.style[key as any] = (style as { [index: string]: any })[key]
  }

  // TODO: this assumes text!
  div.innerHTML = text

  const result = {
    width: div.clientWidth,
    height: div.clientHeight
  }

  document.body.removeChild(div)

  return result
}

function MObject({ children }: { children: string }): React.ReactElement {
  const [child, setChild] = useState<string | null>(null)
  const [opacity, setOpacity] = useState<number>(1)
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    setOpacity(0)
    setWidth(measureText(children).width)
    setTimeout(() => setChild(children), 500)
    setTimeout(() => setOpacity(1), 500)
  }, [children])

  return (
    <div
      style={{
        opacity,
        display: 'inline-block',
        transition: '0.5s opacity, 0.7s width',
        width: width,
        overflow: 'hidden',
        verticalAlign: 'top'
      }}
    >
      {child}
    </div>
  )
}

export default MObject
