import request from "@/utils/request";

// 分页查询课程资源列表
export const queryPageApi = (params) => request.get("/admin/res", { params });

// 新增课程资源
export const addApi = ({ name, createTime }) =>
  request.post("/admin/res", { name, createTime });

// 删除课程资源（按名称）
export const deleteByNameApi = (name) =>
  request.delete("/admin/res", { params: { name } });

// 修改课程资源信息
export const updateApi = ({ oldName, newName, createTime }) =>
  request.post("/admin/res/update", { oldName, newName, createTime });


