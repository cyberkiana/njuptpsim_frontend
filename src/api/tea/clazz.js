import request from '@/utils/request'

/**
 * 获取教师所教的班级列表
 * @param {string|number} teaId 教师ID
 * @returns {Promise} 班级列表 [{ id, name, studentCount }]
 */
export const getTeacherClazzesApi = (teaId) =>
  request.get(`/tea/${teaId}/clazzes`)

// 获取班级的实验任务列表
export const getClazzExperimentsApi = (teaId, clazzId) =>
  request.get(`/tea/${teaId}/clazzes/${clazzId}`)