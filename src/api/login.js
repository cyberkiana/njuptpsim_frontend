import request from "@/utils/request";

//登录
export const loginApi = (data) => request.post("/common/login", data);

//退出登录（后端记录退出日志）
export const logoutApi = () => request.post("/common/logout");