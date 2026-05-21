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