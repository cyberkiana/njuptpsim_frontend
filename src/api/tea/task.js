import request from '@/utils/request';

/**
 * 获取教师的实验任务列表
 * @param {string|number} teaId 教师ID
 * @returns {Promise} 实验任务列表
 */
export const getTeacherTasksApi = (teaId) =>
  request.get(`/tea/${teaId}/tasks`)

/**
 * 发布新的实验任务
 * @param {string|number} teaId 教师ID
 * @param {Object} data 表单数据 { clazzId, expId, startDate, endDate }
 * @returns {Promise} 发布结果
 */
export const publishTaskApi = (teaId, data) =>
  request.post(`/tea/${teaId}/tasks`, data)

/**
 * 获取所有可选的实验列表（用于选择框）
 * @returns {Promise} 实验列表 [{ id, title }]
 */
export const getExperimentsApi = () =>
  request.get('/common/exps')

/**
 * 删除实验任务
 * @param {string|number} teaId 教师ID
 * @param {string|number} taskId 任务ID
 * @returns {Promise} 删除结果
 */
export const deleteTaskApi = (teaId, taskId) =>
  request.delete(`/tea/${teaId}/tasks/${taskId}`)



// 按任务id获取任务详情(同一实验的多个任务数据相互区分)
export const getTaskDetailApi = (teaId, taskId) =>
  request.get(`/tea/${teaId}/tasks/${taskId}/detail`)

// 获取实验的学生完成情况
export const getExperimentStudentsApi = (teaId, taskId, clazzId) =>
  request.get(`/tea/${teaId}/tasks/${taskId}/clazzed/${clazzId}/stu`)