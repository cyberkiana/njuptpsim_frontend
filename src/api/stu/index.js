import request from '@/utils/request'


// 获取学生预约信息
export const getStudentReservationsApi = (stuId) =>
  request.get(`/stu/${stuId}/reservations`)

// 取消预约（day/slot 必须作为查询参数传递, 之前误传为 axios config 导致后端收不到参数）
export const deleteReservationApi = (stuId, id, day, slot) =>
  request.delete(`/stu/${stuId}/reservations/${id}`, { params: { day, slot } })

// 获取学生任务总表（包含已完成和未完成的实验）
export const getStudentTasksApi = (stuId) =>
  request.get(`/stu/${stuId}/tasks`)

/**
 * 获取指定日期的预约信息
 * @param {string} day - 日期，格式 YYYY-MM-DD
 * @returns {Promise}
 */
export const getReservationByDayApi = (day) => {
  return request.get(`/common/reservations/days/${day}`)
}

// 学生提交预约
export const addStuReservationApi = (stuId,day,slot) => request.post(`/stu/${stuId}/reservations`, {stuId,day,slot})

