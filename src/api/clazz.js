// 本api用于管理员端查看班级信息

import request from "@/utils/request";

// 查询全部班级数据
//export const queryAllApi = () => request.get("/admin/clazz/getNoPage");

// 新增班级
export const addApi = (clazz) => request.post("/admin/clazzes", clazz);

// 根据ID删除班级
export const deleteByIdApi = (id) =>
  request.delete(`/admin/clazzes/${id}`);

// 分页查询班级列表
export const queryPageApi = (params) => request.get("/admin/clazzes", { params });

// 更改班级信息
export const changeTeacherApi = ({ id, createTime, teacher }) =>
  request.patch(`/admin/clazzes/${id}`, { teacher });

// 查询总条目数
export const queryTotalNumApi = (params) => request.get("/admin/clazzes/totalNum", {params});

// 查询班级内用户信息
export const queryStuApi = (id) => request.get(`/admin/clazzes/${id}/stus`);

// 将学生移除出班级
export const deleteStuFromClazzApi = (clazzId, stuId) => request.delete(`/admin/clazzes/${clazzId}/stus/${stuId}`);

/**
 * Excel批量导入班级
 * @param {FormData} formData - 包含 file 字段(.xlsx)的表单数据
 * @returns {Promise} 返回 { data: { total, success, fail, errors: [] } }
 */
export const importClazzesApi = (formData) =>
  request.post("/admin/clazzes/import", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
