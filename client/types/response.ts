export type APIResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
}
