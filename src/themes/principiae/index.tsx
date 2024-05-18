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
            className='presentation inline-block relative flex-shrink-0 flex flex-col text-black'
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
              <div className='flex justify-end text-xs theme-gray'>
                <div className='px-2 py-1'>{slideIndex + 1}</div>
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}

/* export function MousePointer(): React.ReactElement { */

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
                <div className='ml-6 mt-6 theme-dark-gray font text-2xl flex lucida'>
                  {typeof info.header == 'string'
                    ? info.header
                        .split(/(\|\|)/g)
                        .map((e: string) => (e === '||' ? <br /> : e))
                    : info.header}
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

export function OverviewSlide({
  image,
  title,
  section,
  children,
  styles = {
    title: { color: '#918F90' },
    section: { color: '#767374' },
    activeSection: { color: '#E39000' }
  }
}: {
  title?: React.ReactNode
  image?: React.ReactNode
  section?: string
  children?: React.ReactNode
  styles?: {
    title?: React.CSSProperties
    activeSection?: React.CSSProperties
    section?: React.CSSProperties
  }
}): React.ReactElement {
  const { slidesInfo = [] } = useContext(PresentationContext) || {}

  const sections = slidesInfo
    .map((i) => [i.info.section, i.info])
    .filter((v) => !!v[0])
    .filter((v, i, a) => a.map((w) => w[0]).indexOf(v[0]) === i)
    .map((v) => v[1])

  title = title || slidesInfo[0].info.title
  image = image || slidesInfo[0].info.image
  styles = slidesInfo[0].info.styles || styles

  return (
    <Slide
      hideNavigation
      className='flex flex-col items-stretch lucida'
      style={{
        padding: '120px'
      }}
    >
      <div className='flex-grow'>
        <div style={{ fontSize: '2.5rem', ...styles.title }}>{title}</div>
      </div>
      <div className='flex items-stretch'>
        {image}
        <div
          className='ml-10 flex flex-col justify-between'
          style={{ fontSize: '90%' }}
        >
          {sections.map((s) => (
            <div
              key={s.section}
              className='my-2'
              style={{
                ...(section && s.section == section
                  ? styles.activeSection
                  : styles.section)
              }}
            >
              <span className='inline-block mb-2'>{s.section}</span>
              <br />
              <span className='opacity-75'>{s.sectionsubtitle || ''}</span>
            </div>
          ))}
        </div>
      </div>
      {children}
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
      <div className='inline-block w-3 h-3 m-1 border-2 border-black' />
    </div>
  )
}
