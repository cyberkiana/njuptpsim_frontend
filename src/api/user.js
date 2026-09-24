import request from "@/utils/request";

export const queryTotalNumApi = (params) => request.get("/admin/user/getTotalNum", {params});

export const addApi = (data) => request.post("/admin/user/addUser", data);

export const editApi = (user) => request.post("/admin/user/editUser", user);

export const queryPageApi = (params) => request.get("/admin/user/getByPage", {params});

export const deleteByIdApi = (id) => request.delete("/admin/user/deleteById", {params: {id}});

/**
 * Excel批量导入用户
 * @param {FormData} formData - 包含 file 字段(.xlsx)的表单数据
 * @returns {Promise} 返回 { data: { total, success, fail, errors: [] } }
 */
export const importUsersApi = (formData) =>
  request.post("/admin/user/import", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

// ==================== 用户头像相关 ====================

/**
 * 上传头像图片文件至后端服务器存储, 返回可访问的头像url
 * @param {FormData} formData - 包含 avatar 文件的表单数据
 * @returns {Promise} 返回 { data: url }
 */
export const uploadAvatarApi = (formData) =>
  request.post("/common/user/avatar/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

/**
 * 将头像url更新到数据库中保存
 * @param {Object} data - { id, avatar }
 * @returns {Promise}
 */
export const updateAvatarApi = (data) =>
  request.post("/common/user/avatar/update", data);

/**
 * 根据用户id查询头像url
 * @param {number} id - 用户ID
 * @returns {Promise} 返回 { data: url }
 */
export const getAvatarApi = (id) =>
  request.get("/common/user/avatar", {params: {id}});

// ==================== 账号封禁相关 ====================

/**
 * 查询全部账号封禁记录（封禁中+已解封）
 * @returns {Promise} 返回 { data: [{ id, userId, reason, status, ... }] }
 */
export const getUserBansApi = () => request.get('/admin/userbans')

/**
 * 封禁账号
 * @param {Object} data - { userId: 账号id, reason: 封禁原因(可选) }
 * @returns {Promise}
 */
export const banUserApi = (data) => request.post('/admin/userbans', data)

/**
 * 解封指定封禁记录
 * @param {number} id - 封禁记录id
 * @returns {Promise}
 */
export const unbanUserApi = (id) => request.post(`/admin/userbans/${id}/unban`)

/**
 * 重置用户密码为初始密码123456
 * @param {string} id - 用户ID
 */
export const resetPasswordApi = (id) => request.post('/admin/user/resetPassword', null, { params: { id } })

/**
 * 删除用户头像
 * @param {string} id - 用户ID
 */
export const clearAvatarApi = (id) => request.post('/admin/user/clearAvatar', null, { params: { id } })

// ==================== 个人中心 ====================

/**
 * 修改自己的密码（后端从登录令牌识别当前用户，无法指定他人）
 * @param {Object} data - { oldPassword, newPassword }
 */
export const changePasswordApi = (data) =>
  request.post("/common/user/password", data);
