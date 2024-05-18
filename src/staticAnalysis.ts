import React from 'react'
import { PresentationContext, RenderSlide } from './Presentation'
import { CitationContext, RenderCite, CitationMap } from './Citations'
import Notes from './PresenterNotes'

import flattenDeep from 'lodash/flattenDeep'
import Morph, { wrapMathBasedOnProps } from './Morph'
import { lookupAnimationGroups } from './AnimationEditor'

// TODO: does this also work for figures?

type FakeContextes = [React.Context<any>, any][]
const withFakeDispatcher = <T>(ctx: FakeContextes, cb: () => T): T => {
  // I'll guess I'll be fired then ;)
  const {
    ReactCurrentDispatcher
  } = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  const original = ReactCurrentDispatcher.current

  ReactCurrentDispatcher.current = {
    useContext: (context: React.Context<any>): any => {
      const result = ctx.find(([c, _]) => c === context)
      if (result) {
        return result[1]
      }
      return {}
    },
    readContext: () => null,
    useCallback: (x: any) => x,
    useEffect: () => null,
    useImperativeHandle: () => null,
    useLayoutEffect: () => null,
    useMemo: (x: any) => x,
    useReducer: (_: any, initialState: any) => initialState,
    useRef: (initial: any) => {
      const ref = { current: initial }
      return ref
    },
    useState: (initial: any) => [initial, (x: any): any => x],
    useDebugValue: () => null,
    useResponder: () => null,
    useDeferredValue: () => null,
    useTransition: () => null
  }

  let result: T
  try {
    result = cb()
  } finally {
    ReactCurrentDispatcher.current = original
  }
  return result
}

const isComponent = (
  node: any
): node is { type: (arg: any) => React.ReactElement } =>
  node.type && typeof node.type === 'function'

const ignore: React.JSXElementConstructor<any>[] = [Morph, RenderCite]
const findElementsInTree = (
  node: React.ReactElement,
  predicate: (arg: any) => boolean
): React.ReactElement[] => {
  const found: React.ReactElement[] = []

  const handleTree = (node: React.ReactElement): void => {
    if (predicate(node)) {
      found.push(node)
      return
    }

    if (isComponent(node)) {
      // Do not go deeper into Morphs, ...
      if (ignore.includes(node.type)) {
        return
      }

      const resolved = node.type(node.props)
      // TODO: Maybe we should check if resolved is a ReactElement? Could maybe be string / ...?
      return handleTree(resolved as React.ReactElement)
    }

    if (node.props && node.props.children) {
      const childs = flattenDeep(
        Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children]
      )
      childs.forEach((child) => {
        if (child) {
          handleTree(child as React.ReactElement)
        }
      })
    }
  }

  handleTree(node)
  return found
}

type SlideAndProps = {
  slide: React.ReactElement
  props: { [key: string]: any }
}

// Does as it says. e.g.
// <ProofSlide color='false'>
//   resolves to -> <Slide header='test' />
//
//   the resulting props are {color: false, header: test, slide: the <Slide> component}
const getPropsRecursiveUntilSlideComponentIsEncountered = (
  node: React.ReactElement
): SlideAndProps => {
  const props = node.props
  const type = node.type as any

  if (type === RenderSlide) {
    return { ...props, slide: node }
  }

  let resolved
  if (typeof type === 'function') {
    resolved = (type as (arg: any) => React.ReactElement)({ ...props })
  } else if (
    // forward ref
    typeof type === 'object' &&
    type.$$typeof === Symbol.for('react.forward_ref') &&
    typeof type?.render === 'function'
  ) {
    resolved = type.render(props, (node as any)?.ref)
  } else {
    console.log('static analysis: type was not function ...', node, type)
  }

  const rest = getPropsRecursiveUntilSlideComponentIsEncountered(resolved)
  return {
    ...props,
    ...rest
  }
}

export type SlideInfo = {
  slide: React.ReactChild
  info: { [key: string]: any }
  steps: any[]
  animations: { start: string; end: string }[]
  allLaTeX: string[]
  presenterNotes: React.ReactNode
}
export type SlidesInfo = SlideInfo[]
export type SlidesInfoAndCitationMap = {
  slidesInfo: SlidesInfo
  citationMap: CitationMap
}

export function getSlidesInfo(
  slides: React.ReactElement[]
): SlidesInfoAndCitationMap {
  // TODO should probably make this a ES6 Map
  const mockContextes: [any, any][] = [
    [
      PresentationContext,
      {
        i: 0,
        slideIndex: 0,
        slidesInfo: slides.map(() => ({ info: {} }))
      }
    ],
    [
      CitationContext,
      {
        bibliography: [],
        citationMap: {}
      }
    ]
  ]

  // note that the steps prop is not yet okay: because the table of contents doesn't know yet how many sections there are, it cannot determine the number of steps ...
  let slideWithProps: SlideAndProps[] = withFakeDispatcher(
    mockContextes,
    () => {
      return slides.map(getPropsRecursiveUntilSlideComponentIsEncountered)
    }
  )

  // this adds the current section to each of the slides
  //
  // slide:   1234567
  // section: A   B
  //
  // gets transformed to
  //
  // slide:        1234567
  // section:      AAAABBB
  // sectionSlide: tffftff

  type Info = {
    section: string
    hideNavigation: boolean
    sectionSlide: boolean
    header: string | null
    [key: string]: any
  }

  const infos: Info[] = []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const { slide, steps, ...props } of slideWithProps as {
    slide: React.ReactElement
    section?: string
    hideNavigation?: boolean
    header?: string
    [key: string]: any
  }[]) {
    const accumulatedInfo = infos[infos.length - 1]
    const newInfo = {
      ...accumulatedInfo
    }

    for (const key in props) {
      newInfo[key] = props[key]
    }

    newInfo.sectionSlide = !!props.section
    newInfo.hideNavigation = !!props.hideNavigation

    if (props.section) {
      newInfo.section = props.section
    }

    if (props.header) {
      newInfo.header = props.header
    } else {
      newInfo.header = null
    }

    infos.push(newInfo)
  }

  // Now we add this info to the presentation context
  // Now the <TableOfContentsSlide /> knows how many sections there are, so it can calculate how many steps the slide is based on this.

  const citationMap = withFakeDispatcher(mockContextes, () => {
    return getCitations(slideWithProps.map((x) => x.slide))
  })

  mockContextes.find(
    (x) => x[0] === PresentationContext
  )![1].slidesInfo = infos.map((info) => ({ info }))

  mockContextes.find(
    (x) => x[0] === CitationContext
  )![1].citationMap = citationMap

  return withFakeDispatcher(mockContextes, () => {
    slideWithProps = slides.map(
      getPropsRecursiveUntilSlideComponentIsEncountered
    )
    const slidesInfo: SlideInfo[] = slideWithProps.map(
      ({ slide, ...props }: SlideAndProps, index: number): SlideInfo => ({
        slide,
        info: infos[index],
        steps: (props as { steps?: any[] }).steps || [null],
        ...animations(slide),
        presenterNotes: presenterNotes(slide)
      })
    )

    console.log(slidesInfo, citationMap)
    // GOAL: (be able to) pre fetch all the latex of all slides.
    // Problem: animate from lib/morph does some replaces on these strings that we should do as well before trying to compile this.
    // OR: move these replacements elsewhere
    return { slidesInfo, citationMap }
  })
}

const presenterNotes = (slide: React.ReactElement): React.ReactNode => {
  let tree: React.ReactElement
  if (!slide.props.steps || typeof slide.props.children !== 'function') {
    tree = slide
  } else {
    tree = slide.props.children(slide.props.steps[0])
  }

  const notes = findElementsInTree(
    tree,
    (node) => typeof node.type === 'function' && node.type === Notes
  )
  if (notes.length > 1) {
    console.error('On slide ', slide, 'you have more than one <Notes>!')
  }
  const note = notes[0]
  if (!note) return null
  return note.props.children
}

const animations = (slide: React.ReactElement) => {
  class MorphArray extends Array<string> {
    props?: { [key: string]: any }
  }

  const allLaTeX: string[] = []
  const morphs: { [key: string]: MorphArray } = {}

  const defaultResult = {
    animations: [],
    allLaTeX: []
  }

  if (typeof slide.props.children !== 'function') {
    // If type is not a function, we have no animations.
    // But we still can have static LaTeX!

    // This is copied from below. Maybe extract this ...
    findElementsInTree(
      slide,
      (node) => typeof node.type === 'function' && node.type === Morph
    ).forEach((node) => {
      // should also apply groups ...

      if (node.props.replace) {
        // No animations to consider, is replaced immediately
        // Is used for plain LaTeX (<Morph replace />)

        if (node.props.children) {
          allLaTeX.push(wrapMathBasedOnProps(node.props, node.props.children))
        }
      }
    })
    return {
      animations: [],
      allLaTeX
    }
  }

  if (!slide.props.steps) return defaultResult

  slide.props.steps.forEach((step: any) => {
    const tree = slide.props.children(step)

    findElementsInTree(
      tree,
      (node) => typeof node.type === 'function' && node.type === Morph
    ).forEach((node) => {
      // should also apply groups ...

      if (node.props.replace) {
        // No animations to consider, is replaced immediately
        // Is used for plain LaTeX (<Morph replace />)

        if (node.props.children) {
          allLaTeX.push(wrapMathBasedOnProps(node.props, node.props.children))
        }
        return
      }
      const id = JSON.stringify(((node as any) as { _source: any })._source)
      const contents = node.props.children
      morphs[id] = morphs[id] ? [...morphs[id], contents] : [contents]
      morphs[id].props = node.props

      // this is a bit fishy, setting a property of an array. Need it later to wrap the math correctly.
    })
  })

  const anim: { start: string; end: string }[] = []
  for (const key in morphs) {
    const formulas = morphs[key]
    formulas.forEach((formula: string, i: number) => {
      const start = formula
      const end = formulas[i + 1]
      if (i < formulas.length - 1 && start !== end) {
        anim.push({ start, end })

        if (start && end) {
          if (!formulas.props) {
            // This shouldn't happen
            return
          }
          // start and end not undefined
          const [startGrouped, endGrouped] = lookupAnimationGroups(start, end)
          allLaTeX.push(wrapMathBasedOnProps(formulas.props, startGrouped))
          allLaTeX.push(wrapMathBasedOnProps(formulas.props, endGrouped))
        }
      }
    })
  }

  return {
    animations: anim,
    allLaTeX: allLaTeX
  }
}

function getCitations(slides: React.ReactElement[]): CitationMap {
  const citationMap: CitationMap = {}

  slides.forEach((slide) => {
    let trees = [slide]
    if (typeof slide.props.children === 'function' && !!slide.props.steps) {
      trees = slide.props.steps.map((step: any) => slide.props.children(step))
    }

    trees.forEach((tree) => {
      findElementsInTree(
        tree,
        (node) => typeof node.type === 'function' && node.type === RenderCite
      ).forEach((cite) => {
        const id = cite.props.id
        if (!citationMap[id]) {
          const number = Math.max(0, ...Object.values(citationMap)) + 1
          citationMap[id] = number
        }
      })
    })
  })
  return citationMap
}
