import request from "@/utils/request"

// ==================== 实验相关 ====================

/**
 * 根据实验id获取实验详情 (title, url, likes, easyCount, hardCount)
 * @param {number} expId - 实验ID
 * @returns {Promise}
 */
export const getExpDetailApi = (expId) =>
  request.get(`/common/exps/${expId}`)

/**
 * 点赞、十分简单、十分困难评价
 * @param {number} expId - 实验ID
 * @param {Object} params - { likes?, easyCount?, hardCount? } 如果不为null，值为1
 * @returns {Promise}
 */
export const updateEvaluationApi = (expId, params) =>
  request.post(`/common/exps/${expId}/evaluation`, params)

/**
 * 查询当前用户对某实验的评价类型
 * @param {number} expId - 实验ID
 * @returns {Promise} { data: 'likes'|'easy'|'hard'|null }
 */
export const getMyEvaluationApi = (expId) =>
  request.get(`/common/exps/${expId}/evaluation`)

/**
 * 学生完成WebGL实验并提交成绩（写入completions表）
 * @param {string} stuId - 学生ID
 * @param {number} expId - 实验ID
 * @param {number} [score] - 成绩(0~100, 默认100)
 * @returns {Promise}
 */
export const completeExpApi = (stuId, expId, score) =>
  request.post(`/stu/${stuId}/tasks/complete`, { expId, score })

// ==================== 评论相关 ====================

/**
 * 根据实验id获取评论列表 (返回 id, userName, avatar, time, content, likes)
 * @param {number} expId - 实验ID
 * @returns {Promise}
 */
export const getCommentsApi = (expId) =>
  request.get(`/common/exps/${expId}/comments`)

/**
 * 根据评论id获取回复列表 (返回 id, userName, avatar, time, content, likes, repliedUserName)
 * @param {number} expId - 实验ID
 * @param {number} commentId - 评论ID
 * @returns {Promise}
 */
export const getRepliesApi = (expId, commentId) =>
  request.get(`/common/exps/${expId}/comments/${commentId}/replies`)

// ==================== 管理员评论管理 ====================

/**
 * 管理员删除评论（软删除）
 * @param {number} commentId - 评论ID
 * @returns {Promise}
 */
export const deleteCommentAdminApi = (commentId) =>
  request.delete(`/admin/comments/${commentId}`)

/**
 * 管理员删除回复（软删除）
 * @param {number} commentId - 评论ID
 * @param {number} replyId - 回复ID
 * @returns {Promise}
 */
export const deleteReplyAdminApi = (commentId, replyId) =>
  request.delete(`/admin/comments/${commentId}/replies/${replyId}`)

/**
 * 管理员按时间范围搜索实验下的评论与回复 (返回命中的主评论id列表, 已去重按时间降序)
 * @param {number} resourceId - 实验ID
 * @param {string} start - 起始时间 yyyy-MM-dd HH:mm:ss (含)
 * @param {string} end - 结束时间 yyyy-MM-dd HH:mm:ss (不含)
 * @returns {Promise}
 */
export const searchCommentsAdminApi = (resourceId, start, end) =>
  request.get('/admin/comments/search', { params: { resourceId, start, end } })

/**
 * 发送评论
 * @param {number} expId - 实验ID
 * @param {Object} params - { userId, time, content }
 * @returns {Promise}
 */
export const postCommentApi = (expId, params) =>
  request.post(`/common/exps/${expId}/comments`, params)

/**
 * 发送回复
 * @param {number} expId - 实验ID
 * @param {number} commentId - 评论ID
 * @param {Object} params - { userId, time, content, repliedUserName? }
 * @returns {Promise}
 */
export const postReplyApi = (expId, commentId, params) =>
  request.post(`/common/exps/${expId}/comments/${commentId}/replies`, params)

/**
 * 点赞评论
 * @param {number} expId - 实验ID
 * @param {number} commentId - 评论ID
 * @param {Object} params - { likes }
 * @returns {Promise}
 */
export const likeCommentApi = (expId, commentId, params) =>
  request.post(`/common/exps/${expId}/comments/${commentId}/evaluation`, params)

/**
 * 点赞回复
 * @param {number} expId - 实验ID
 * @param {number} commentId - 评论ID
 * @param {number} replyId - 回复ID
 * @param {Object} params - { likes }
 * @returns {Promise}
 */
export const likeReplyApi = (expId, commentId, replyId, params) =>
  request.post(`/common/exps/${expId}/comments/${commentId}/replies/${replyId}/evaluation`, params)