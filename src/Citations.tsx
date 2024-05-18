import React, {useEffect, useState, useContext} from 'react'

import Citation from 'citation-js'

/* global fetch */

export type CitationMap = {[key: string]: number}
type Bibliography = {
  label: string
}[]

export interface CitationContextInterface {
  citationMap: CitationMap
  bibliography: Bibliography | null
}

export const CitationContext = React.createContext<CitationContextInterface | null>(
  null
)

type CitationProviderProps = {
  bibUrl?: string
  citationMap: CitationMap
  children: React.ReactNode
}

export function CitationProvider({
  bibUrl,
  citationMap,
  children
}: CitationProviderProps): React.ReactElement {
  const [bibliography, setBibliography] = useState<Bibliography | null>(null)

  useEffect(() => {
    ; (async () => {
      if (!bibUrl) {
        return
      }
      const text = await fetch(bibUrl).then((res) => res.text())
      const result = Citation.parse.bibtex.text(text)
      setBibliography(result)
    })()
  }, [])

  return (
    <CitationContext.Provider
      value={{
        bibliography,
        citationMap
      }}
    >
      {children}
    </CitationContext.Provider>
  )
}

type CiteRenderFunction = (arg: {
  text: string | null
  number: string | number | null
}) => React.ReactElement

type RenderCiteProps = {
  id: string
  render: CiteRenderFunction
}

type BibliographyRenderFunction = (
  items: {id: string; n: number; html: string}[]
) => React.ReactElement

export function RenderCite({
  id,
  render
}: RenderCiteProps): React.ReactElement {
  const {citationMap = {}, bibliography} = useContext(CitationContext) || {}

  return render({
    text: bibliography
      ? new Citation(bibliography.find((e) => e.label === id)).format(
        'bibliography',
        {
          format: 'text',
          template: 'apa',
          lang: 'en-US'
        }
      )
      : null,
    number:
      bibliography && !bibliography.find((e) => e.label === id)
        ? `?? ${id}`
        : citationMap[id] || null
  })
}

export function RenderBibliography({
  render
}: {
  render: BibliographyRenderFunction
}): React.ReactElement {
  const {citationMap = {}, bibliography = []} =
    useContext(CitationContext) || {}
  // TODO: Slide header should work here!

  const sortedEntries = Object.entries(citationMap).sort((a, b) => a[1] - b[1])

  if (!bibliography) return render([])
  return render(
    sortedEntries.map(([id, n]) => {
      const entry = bibliography.find((e) => e.label === id)
      const html = new Citation(entry).format('bibliography', {
        format: 'html',
        template: 'apa',
        lang: 'en-US'
      })
      return {id, n, html}
    })
  )
}
