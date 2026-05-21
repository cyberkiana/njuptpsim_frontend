import request from "@/utils/request";

export const queryTotalNumApi = (params) => request.get("/admin/user/getTotalNum", {params});

export const addApi = (data) => request.post("/admin/user/addUser", data);

export const editApi = (user) => request.post("/admin/user/editUser", user);

export const queryPageApi = (params) => request.get("/admin/user/getByPage", {params});

export const deleteByIdApi = (id) => request.delete("/admin/user/deleteById", {params: {id}});

