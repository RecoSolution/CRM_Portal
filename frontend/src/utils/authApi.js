import api from './api'

export const registerUser = (data) => api.post('/auth/register', data)
export const verifyOtp    = (data) => api.post('/auth/verify-otp', data)
export const resendOtp    = (data) => api.post('/auth/resend-otp', data)

export const loginUser = (data) => api.post('/auth/login', data)

export const forgotPassword  = (data) => api.post('/auth/forgot-password', data)
export const verifyResetOtp  = (data) => api.post('/auth/verify-reset-otp', data)
export const resendResetOtp  = (data) => api.post('/auth/resend-reset-otp', data)
export const resetPassword   = (data) => api.post('/auth/reset-password', data)

export const getMe          = ()     => api.get('/auth/me')
export const setupProfile   = (data) => api.post('/auth/setup-profile', data)
export const uploadAvatar   = (formData) =>
  api.post('/auth/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const removeAvatar   = ()     => api.delete('/auth/remove-avatar')