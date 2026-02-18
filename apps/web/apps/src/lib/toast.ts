/**
 * Centralized toast helper — wraps sonner's toast API
 * so every call site uses the same style & duration.
 *
 * Usage:
 *   import { showToast } from '@/lib/toast'
 *   showToast.success('Distribution created.')
 *   showToast.error('Login failed. Check credentials.')
 */
import { toast } from 'sonner'

export const showToast = {
  /** Green check-mark toast */
  success(message: string) {
    toast.success(message, { duration: 3000 })
  },

  /** Red X toast */
  error(message: string) {
    toast.error(message, { duration: 4500 })
  },

  /** Neutral / info toast */
  info(message: string) {
    toast(message, { duration: 3000 })
  },

  /** Shows a loading toast that can be resolved later */
  loading(message: string) {
    return toast.loading(message)
  },

  /** Dismiss a specific toast by id */
  dismiss(id: string | number) {
    toast.dismiss(id)
  },
}

export default showToast
