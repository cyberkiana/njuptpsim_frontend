import request from "@/utils/request";

//==================== 系统日志查询（管理员） ====================

//分页查询操作日志（sys_log_operation）
export const operationLogApi = (page, pageSize) =>
    request.get("/admin/logs/operation", { params: { page, pageSize } });

//分页查询登录日志（sys_log_login）
export const loginLogApi = (page, pageSize) =>
    request.get("/admin/logs/login", { params: { page, pageSize } });

//分页查询异常日志（sys_log_error）
export const errorLogApi = (page, pageSize) =>
    request.get("/admin/logs/error", { params: { page, pageSize } });

//分页查询管理员事件（sys_log_root_event）
export const rootEventLogApi = (page, pageSize) =>
    request.get("/admin/logs/rootEvent", { params: { page, pageSize } });

//==================== IP黑名单管理（管理员） ====================

//查询黑名单列表（含已解封）
export const blacklistApi = () => request.get("/admin/ipblacklist");

//解封黑名单记录
export const unbanIpApi = (id) => request.post(`/admin/ipblacklist/${id}/unban`);

//手动封禁IP
export const banIpApi = (data) => request.post("/admin/ipblacklist", data);
