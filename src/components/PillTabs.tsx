import { forwardRef, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

/* 膠囊分頁（關於我們、活動、需求媒合共用）。
   選中的深色底是一塊獨立的「滑塊」，切換分頁時會滑到新的選項，文字顏色跟著淡入淡出。
   樣式在 index.css「膠囊分頁」。 */

export const PillTabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { cols: number }>(
  ({ className = '', cols, children, ...props }, outer) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
    const [ready, setReady] = useState(false)

    useLayoutEffect(() => {
      const list = ref.current
      if (!list) return
      const update = () => {
        const a = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
        if (a) setBox({ x: a.offsetLeft, y: a.offsetTop, w: a.offsetWidth, h: a.offsetHeight })
      }
      update()
      // 第一次定位不要滑動，之後才加上過場
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
      const mo = new MutationObserver(update)
      mo.observe(list, { subtree: true, attributes: true, attributeFilter: ['data-state'] })
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
      ro?.observe(list)
      return () => { cancelAnimationFrame(raf); mo.disconnect(); ro?.disconnect() }
    }, [])

    return (
      <TabsPrimitive.List
        ref={el => { ref.current = el; if (typeof outer === 'function') outer(el); else if (outer) outer.current = el }}
        className={'pill-tabs' + (ready ? ' ready' : '') + ' ' + className}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        {...props}
      >
        <span
          className="pill-thumb"
          aria-hidden="true"
          style={box ? { width: box.w, height: box.h, transform: `translate(${box.x}px, ${box.y}px)` } : { opacity: 0 }}
        />
        {children}
      </TabsPrimitive.List>
    )
  },
)
PillTabsList.displayName = 'PillTabsList'

export const PillTab = forwardRef<ElementRef<typeof TabsPrimitive.Trigger>, ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className = '', ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={'pill-tab ' + className} {...props} />,
)
PillTab.displayName = 'PillTab'
