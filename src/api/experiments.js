/**
 * 实验资源API（数据全部来自数据库 resources 表）
 */
import request from "@/utils/request"

// 实验分类标签
export const EXP_TAGS = ['声学', '光学', '热学', '电学']

/**
 * 查询实验资源列表
 * @param {string} tag - 实验标签(声学/光学/热学/电学), 为空时查询全部
 * @returns {Promise}
 */
export const getExperimentsByTagApi = (tag) =>
  request.get('/common/exps', { params: { tag: tag || '' } })

/**
 * 新增实验资源 (管理员, 后端 /admin/res)
 * @param {Object} data - { title, tag, content, url }
 * @returns {Promise}
 */
export const addExperimentApi = (data) =>
  request.post('/admin/res', data)

/**
 * 修改实验资源 (管理员, 按旧名称定位)
 * @param {Object} data - { oldName, name, createTime }
 * @returns {Promise}
 */
export const updateExperimentApi = (data) =>
  request.post('/admin/res/update', data)

/**
 * 按名称删除实验资源 (管理员, 后端 /admin/res)
 * @param {string} name - 实验名称(title)
 * @returns {Promise}
 */
export const deleteExperimentApi = (name) =>
  request.delete('/admin/res', { params: { name } })

/**
 * 上传WebGL实验文件到服务器独立文件夹 (管理员)
 * @param {FormData} formData - 包含 file 字段的表单数据
 * @returns {Promise} 返回 { data: 可访问的url路径 }
 */
export const uploadWebglApi = (formData) =>
  request.post('/admin/res/upload-webgl', formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600000
  })
