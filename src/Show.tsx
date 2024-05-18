import React from 'react'

type ShowProps = {
  when: boolean
  children: React.ReactNode
  opacity?: number
}
export default function Show({
  when,
  children,
  opacity
}: ShowProps): React.ReactElement {
  const realStyle: React.CSSProperties = {
    opacity: opacity !== undefined ? opacity : when ? 1 : 0,
    transition: '0.5s opacity ease-in-out'
  }

  return (
    // TODO: props don't get correctly cloned?
    <React.Fragment>
      {React.Children.map(children, (c: React.ReactNode) => {
        if (React.isValidElement(c)) {
          return React.cloneElement(c, {
            ...(c.props || {}),
            style: {
              ...(c?.props?.style || {}),
              ...realStyle
            }
          })
        } else {
          return <span style={realStyle}>{c}</span>
        }
      })}
    </React.Fragment>
  )
}

// TODO: Animate height of an element
// export function Grow({when, children, opacity}) {
