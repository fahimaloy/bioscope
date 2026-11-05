'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface IntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
  triggerOnce?: boolean
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): [React.RefObject<HTMLElement>, boolean] {
  const { threshold = 0, rootMargin = '0px', root = null, triggerOnce = true } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const elementRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      elementRef.current = node

      if (node) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsIntersecting(true)
              if (triggerOnce) {
                observerRef.current?.disconnect()
              }
            } else if (!triggerOnce) {
              setIsIntersecting(false)
            }
          },
          { threshold, rootMargin, root }
        )

        observerRef.current.observe(node)
      }
    },
    [threshold, rootMargin, root, triggerOnce]
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return [elementRef, isIntersecting]
}

export function useInView(
  options: IntersectionObserverOptions = {}
): { ref: React.RefObject<HTMLElement>; inView: boolean; entry: IntersectionObserverEntry | null } {
  const { threshold = 0, rootMargin = '0px', root = null, triggerOnce = true } = options
  const [inView, setInView] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const node = elementRef.current
    if (!node) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        setEntry(entry)

        if (entry.isIntersecting && triggerOnce) {
          observerRef.current?.disconnect()
        }
      },
      { threshold, rootMargin, root }
    )

    observerRef.current.observe(node)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [threshold, rootMargin, root, triggerOnce])

  return { ref: elementRef, inView, entry }
}