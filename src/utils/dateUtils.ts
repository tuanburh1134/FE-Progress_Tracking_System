/**
 * Các hàm tiện ích xử lý ngày tháng.
 *
 * Sử dụng Intl API của browser thay vì thư viện nặng như moment.js.
 */

/**
 * Định dạng date string sang định dạng Việt Nam (dd/MM/yyyy).
 *
 * @param dateString - ISO date string hoặc Date object
 * @returns Chuỗi ngày theo định dạng dd/MM/yyyy
 *
 * @example
 * formatDate('2024-01-15') // => '15/01/2024'
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Định dạng datetime string với cả giờ phút.
 *
 * @param dateString - ISO datetime string
 * @returns Chuỗi ngày giờ theo định dạng Việt Nam
 *
 * @example
 * formatDateTime('2024-01-15T10:30:00') // => '15/01/2024, 10:30'
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Tính số ngày còn lại đến deadline.
 *
 * @param deadline - Deadline date string
 * @returns Số ngày còn lại (âm nếu đã quá hạn)
 *
 * @example
 * getDaysRemaining('2024-12-31') // => 365 (tùy ngày hiện tại)
 */
export const getDaysRemaining = (deadline: string | null | undefined): number | null => {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Trả về nhãn thân thiện cho số ngày còn lại.
 *
 * @param days - Số ngày (từ getDaysRemaining)
 * @returns Chuỗi mô tả thân thiện
 *
 * @example
 * formatDaysRemaining(0)   // => 'Hôm nay'
 * formatDaysRemaining(-2)  // => 'Quá hạn 2 ngày'
 * formatDaysRemaining(5)   // => 'Còn 5 ngày'
 */
export const formatDaysRemaining = (days: number | null): string => {
  if (days === null) return '—'
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Còn 1 ngày'
  return `Còn ${days} ngày`
}

/**
 * Chuyển date string sang định dạng input[type=date] (yyyy-MM-dd).
 *
 * @param dateString - Date string bất kỳ
 * @returns Chuỗi theo định dạng yyyy-MM-dd cho HTML date input
 */
export const toInputDateFormat = (dateString: string | null | undefined): string => {
  if (!dateString) return ''
  return dateString.split('T')[0]
}
