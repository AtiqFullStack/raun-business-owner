import { create } from 'zustand'

export type ToastType = 'success' | 'error'

type ToastState = {
  message: string
  type: ToastType
  visible: boolean
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

export const useToast = create<ToastState>(set => ({
  message: '',
  type: 'success',
  visible: false,
  showToast: (message, type = 'success') => {
    set({
      message,
      type,
      visible: true,
    })
  },
  hideToast: () => {
    set({
      visible: false,
    })
  },
}))
