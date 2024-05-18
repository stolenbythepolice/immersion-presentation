import React, { Fragment, useState, useEffect, useRef, useContext } from 'react'

import {
  RenderSlide,
  RenderPresentation,
  PresentationContext,
  PresentationProps
} from '../../Presentation'
import { RenderCite, RenderBibliography } from '../../Citations'

import Show from '../../Show'

import { SlideInfo } from '../../staticAnalysis'

// import sedes from './kuleuvensedes.svg'
/* import pointer from './pointer.png' */
//
import './styles.css'

import step from '../../step.macro.js'
import { range } from '../../utils.js'

export function Presentation(props: PresentationProps): React.ReactElement {
  const h = 900
  const w = 1200
  return (
    <RenderPresentation
      {...props}
      render={({ slides, slideIndex, slidesInfo }) => {
        const info = slidesInfo[slideIndex].info
        return (
          <div
            className='presentation inline-block relative flex-shrink-0 flex flex-col text-white bg-blue'
            style={{
              overflow: 'hidden',
              fontFamily: 'Computer Modern Sans',
              width: w,
              height: h
              // border: '1px solid white'
            }}
          >
            <div className='flex-grow relative'>{slides}</div>
            <div
              className='flex flex-col'
              style={{
                transition: '0.5s transform',
                transform: `translate(0px, ${info.hideNavigation ? 100 : 0}%)`
              }}
            >
              <div className='flex justify-between text-xs theme-font-open'>
                <div className='px-2 py-1'>
                  {info.sectionSlide ? '\xa0' : info.section}
                </div>
                <div className='px-2 py-1'>{slideIndex + 1}</div>
              </div>
              <div className='w-full inline-block' style={{ height: 2 }}>
                <div
                  className='h-full bg-green'
                  style={{
                    width: `${(slideIndex / (slidesInfo.length - 1)) * 100}%`,
                    transition: 'width 0.5s'
                  }}
                />
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

/* export function MousePointer(): React.ReactElement { */
/*   const [position, setPosition] = useState({ x: 0, y: 0 }) */
/*   const [hidden, setHidden] = useState(true) */
/*   const currentTimer = useRef(null) */
/*   useEffect(() => { */
/*     const setFromEvent = (e: MouseEvent) => { */
/*       setHidden(false) */
/*       clearTimeout(currentTimer.current) */
/*       currentTimer.current = setTimeout(() => setHidden(true), 1000) */
/*       setPosition({ x: e.clientX, y: e.clientY }) */
/*     } */
/*     window.addEventListener('mousemove', setFromEvent) */
/*     return () => { */
/*       window.removeEventListener('mousemove', setFromEvent) */
/*     } */
/*   }, []) */
/*   const { x, y } = position */
/*   const width = 8 */
/*   const height = 8 */
/*   return ( */
/*     <img */
/*       alt='' */
/*       width={width} */
/*       height={height} */
/*       src={pointer} */
/*       style={{ */
/*         display: hidden ? 'none' : 'inline', */
/*         position: 'fixed', */
/*         left: 0, */
/*         top: 0, */
/*         zIndex: 10, */
/*         pointerEvents: 'none', */
/*         transform: `translate(${x - width / 2}px, ${y - height / 2}px)` */
/*       }} */
/*     /> */
/*   ) */
/* } */

export function Slide({
  className,
  children,
  style: slideStyle,
  ...props
}: {
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
  [key: string]: any
}): React.ReactElement {
  return (
    <RenderSlide
      children={children}
      {...props}
      render={({ slidesInfo, children, i, style }) => {
        const info = slidesInfo[i].info
        return (
          <div
            className='slide'
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              right: 0,
              ...style
            }}
          >
            <div className='absolute inset-0 flex flex-col'>
              {info.header && (
                <div className='ml-6 mt-6 text-white font-semibold text-2xl flex items-center theme-font-open'>
                  <span
                    style={{
                      height: '2em',
                      width: '4px',
                      marginRight: '1em',
                      background: '#00D56F',
                      borderRadius: '2px'
                    }}
                  />
                  {info.header}
                </div>
              )}
              <div className={`flex-grow p-6 ${className}`} style={slideStyle}>
                {children}
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

export function SectionSlide({
  section,
  children
}: {
  section: string
  children: React.ReactNode
}): React.ReactElement {
  const { i = 0, slidesInfo = [] } = useContext(PresentationContext) || {}
  const numSlides = slidesInfo.length
  return (
    <Slide
      className='flex justify-center items-center text-3xl theme-font-open'
      hideNavigation
    >
      <div>
        <div>{section}</div>
        <div
          className='mt-3'
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            width: '16em',
            height: '4px',
            borderRadius: '2px'
          }}
        >
          <div
            className='h-full bg-green'
            style={{
              width: `${(i / (numSlides - 1)) * 100}%`,
              borderRadius: '2px'
            }}
          />
        </div>
      </div>
      {children}
    </Slide>
  )
}

// TOCO conclusion slide should clear section ...
export function ConclusionSlide({
  section,
  children
}: {
  section: string
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Slide
      hideNavigation
      className='flex justify-center items-center text-3xl theme-font-open'
    >
      <div>
        <div>{section}</div>
        <div
          className='bg-gray-300 mt-3'
          style={{
            width: '16em',
            height: '4px'
          }}
        >
          <div
            className='h-full bg-green'
            style={{
              width: `100%`
            }}
          />
        </div>
      </div>
      {children}
    </Slide>
  )
}

export function TitleSlide({
  title,
  names,
  names2,
  date,
  children
}: {
  title: React.ReactNode
  subtitle: React.ReactNode
  names: React.ReactNode
  names2: React.ReactNode
  date: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Slide
      className='flex flex-col items-stretch justify-between theme-font-open'
      steps={[0, 1, 2]}
      hideNavigation
    >
      {(step: number) => (
        <Fragment>
          <div className='flex-grow flex flex-col justify-center'>
            <Show when={step > 0}>
              <h1 className='text-4xl font-semibold text-green'>{title}</h1>
            </Show>
          </div>
          <Show when={step > 1}>
            <div className='text-sm flex items-end justify-between'>
              <div>
                <div>{names}</div>
                <div>{names2}</div>
              </div>
              <div>{date}</div>
            </div>
          </Show>
          {children}
        </Fragment>
      )}
    </Slide>
  )
}

export function TableOfContentsSlide({
  header,
  children
}: {
  header: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  const { slidesInfo = [] } = useContext(PresentationContext) || {}

  const sections: string[] = slidesInfo
    .map((i) => i.info.section)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)

  return (
    <Slide
      hideNavigation
      header={header}
      steps={sections.map((_, i) => i)}
      className='flex items-start'
    >
      {(step: number) => (
        <React.Fragment>
          <ol>
            {sections.map((section: string, i: number) => (
              <Show key={section} when={step >= i}>
                <li className='my-5'>{section}</li>
              </Show>
            ))}
          </ol>
          {children}
        </React.Fragment>
      )}
    </Slide>
  )
}

export function QuestionSlide({
  title = 'Questions?',
  children
}: {
  title: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Slide
      className='bg-blue text-gray-100 text-3xl flex items-center justify-center p-0'
      hideNavigation
    >
      {title}
      {children}
    </Slide>
  )
}

// TODO: svg object fit?
export function Figure({
  children,
  caption
}: {
  children: React.ReactNode
  caption: React.ReactNode
}): React.ReactElement {
  return (
    <div className='flex flex-col'>
      <div className='flex-grow'>{children}</div>
      {caption && (
        <div className='p-1'>
          <b>Figure:</b> {caption}
        </div>
      )}
    </div>
  )
}

export function List({
  children,
  step,
  ...props
}: {
  children: React.ReactNode
  step: number
  [key: string]: any
}): React.ReactElement {
  const childArray = React.Children.toArray(children)
  return (
    <ul {...props}>
      {childArray.map((child, i) => (
        <Show key={i} when={i < step || step === undefined}>
          {child}
        </Show>
      ))}
    </ul>
  )
}

export function Item({
  children,
  name,
  ...props
}: {
  children: React.ReactNode
  name?: React.ReactNode
  style?: React.CSSProperties
  [key: string]: any
}): React.ReactElement {
  if (name) {
    return (
      <li
        {...props}
        style={{
          ...(props.style || {}),
          listStyle: 'none'
        }}
      >
        <b>{name + ' '}</b>
        {children}
      </li>
    )
  } else {
    return <li {...props}>{children}</li>
  }
}

export function Cite({
  id,
  hidden
}: {
  id: string
  hidden?: boolean
}): React.ReactElement {
  return (
    <RenderCite
      id={id}
      render={({ text, number }) => {
        if (hidden) return <span />
        return <span title={text || 'Loading ...'}>[{number || '??'}]</span>
      }}
    />
  )
}

export function BibliographySlide(): React.ReactElement {
  const stride = 4
  return (
    <RenderBibliography
      render={(items) => {
        return (
          <Slide steps={range(Math.ceil(items.length / stride))}>
            {(step: number) => {
              if (!items) return <div>Loading</div>

              const start = stride * step
              const end = start + stride
              return (
                <ul className='list-none text-sm'>
                  {items.slice(start, end).map(({ id, n, html }) => {
                    return (
                      <li className='flex my-2' key={id}>
                        <span className='mr-2'>[{n}]</span>
                        <div className='inline-block'>
                          <span dangerouslySetInnerHTML={{ __html: html }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )
            }}
          </Slide>
        )
      }}
    />
  )
}

type BoxProps = {
  title?: string
  children: React.ReactNode
  className?: string
  smallTitle?: boolean
  style?: React.CSSProperties
}
export function Box({
  title,
  children,
  className,
  smallTitle,
  style
}: BoxProps): React.ReactElement {
  return (
    <div
      className={`theme-border theme-shadow ${className || ''}`}
      style={style}
    >
      <div className='p-2'>
        {title && (
          <span
            className={`pr-2 text-green font-semibold ${
              smallTitle ? 'text-xs block' : ''
            }`}
          >
            {title}.
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

export function Qed(
  props: React.HTMLProps<HTMLDivElement>
): React.ReactElement {
  return (
    <div className='flex justify-end' {...props}>
      <div className='inline-block w-2 h-2 bg-white m-1' />
    </div>
  )
}
