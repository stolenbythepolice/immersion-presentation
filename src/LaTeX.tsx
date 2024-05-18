import React from 'react'

import Morph from './Morph'

export function InlineMath({
  children,
  ...props
}: {
  children: string
  [key: string]: any
}): React.ReactElement {
  return (
    <Morph inline replace {...props}>
      {children}
    </Morph>
  )
}

export function DisplayMath({
  children,
  ...props
}: {
  children: string
  [key: string]: any
}): React.ReactElement {
  return (
    <Morph display replace {...props}>
      {children}
    </Morph>
  )
}

export const m = (
  template: TemplateStringsArray,
  ...subtitutions: any[]
): React.ReactElement => (
  <InlineMath>{String.raw(template, ...subtitutions)}</InlineMath>
)
export const M = (
  template: TemplateStringsArray,
  ...subtitutions: any[]
): React.ReactElement => (
  <DisplayMath>{String.raw(template, ...subtitutions)}</DisplayMath>
)
