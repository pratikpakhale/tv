'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

/**
 * Native `<dialog>` rather than a div: focus trapping, inerting the page behind
 * it, Esc to dismiss and top-layer stacking all come from the platform, and
 * none of them are worth reimplementing.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    else if (!open && node.open) node.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onCancel()
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-sm border border-line bg-surface p-0 text-paper backdrop:bg-ink/75 max-sm:mb-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-safe"
    >
      <div className="space-y-3 p-5">
        <h2 id={titleId} className="display text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-mist">{body}</p>
      </div>

      {/* A bottom sheet on phones: full-width buttons where the thumb is. */}
      <div className="grid grid-cols-2 gap-2 border-t border-line px-5 py-3 sm:flex sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="label h-11 rounded-xs border border-line px-3 text-2xs text-mist transition hover:border-mist/40 hover:text-paper active:scale-[0.97] sm:h-auto sm:py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="label h-11 rounded-xs bg-flare px-3 text-2xs text-ink transition hover:opacity-90 active:scale-[0.97] sm:h-auto sm:py-1.5"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
