/**
 * Các hàm tiện ích validate dữ liệu form.
 * Dùng chung cho các form trong toàn ứng dụng.
 */

/**
 * Kiểm tra email hợp lệ.
 *
 * @param email - Chuỗi email cần kiểm tra
 * @returns true nếu hợp lệ
 *
 * @example
 * isValidEmail('test@gmail.com') // => true
 * isValidEmail('not-an-email')   // => false
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Kiểm tra password đủ mạnh (tối thiểu 6 ký tự).
 *
 * @param password - Mật khẩu cần kiểm tra
 * @returns Thông báo lỗi hoặc null nếu hợp lệ
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Mật khẩu không được để trống'
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
  return null
}

/**
 * Kiểm tra username hợp lệ (chỉ chữ, số, dấu gạch dưới).
 *
 * @param username - Username cần kiểm tra
 * @returns Thông báo lỗi hoặc null nếu hợp lệ
 */
export const validateUsername = (username: string): string | null => {
  if (!username) return 'Tên đăng nhập không được để trống'
  if (username.length < 3) return 'Tên đăng nhập phải có ít nhất 3 ký tự'
  if (username.length > 50) return 'Tên đăng nhập không quá 50 ký tự'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
  }
  return null
}

/**
 * Kiểm tra deadline phải sau startDate.
 *
 * @param startDate - Ngày bắt đầu (yyyy-MM-dd)
 * @param deadline  - Deadline (yyyy-MM-dd)
 * @returns Thông báo lỗi hoặc null nếu hợp lệ
 */
export const validateDateRange = (
  startDate: string,
  deadline: string
): string | null => {
  if (!startDate || !deadline) return null
  if (new Date(deadline) <= new Date(startDate)) {
    return 'Deadline phải sau ngày bắt đầu'
  }
  return null
}
