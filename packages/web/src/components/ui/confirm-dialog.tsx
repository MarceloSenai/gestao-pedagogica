"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

const defaultState: ConfirmState = {
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirmar",
  variant: "danger",
  onConfirm: () => {},
  onCancel: () => {},
};

let showConfirmFn:
  | ((opts: Omit<ConfirmState, "open">) => void)
  | null = null;

export function confirm(opts: {
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}): Promise<boolean> {
  return new Promise((resolve) => {
    showConfirmFn?.({
      title: opts.title ?? "Confirmar",
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? "Confirmar",
      variant: opts.variant ?? "danger",
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

export function ConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({ ...defaultState });
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    showConfirmFn = (opts) => {
      setState({ ...opts, open: true });
    };
    return () => {
      showConfirmFn = null;
    };
  }, []);

  useEffect(() => {
    if (state.open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [state.open]);

  const handleConfirm = () => {
    state.onConfirm();
    setState({ ...defaultState });
  };

  const handleCancel = () => {
    state.onCancel();
    setState({ ...defaultState });
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm p-0 max-w-md w-full"
      onClose={handleCancel}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] font-[family-name:var(--font-space-grotesk)]">
          {state.title}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {state.message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant={state.variant} size="sm" onClick={handleConfirm}>
            {state.confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
