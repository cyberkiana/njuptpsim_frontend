import request from "@/utils/request";

//查询每天预约信息汇总
export const reservationOfDayApi = (day) => request.get(`/common/reservations/days/${day}`);

//修改单一时段的最大人数
export const updateMaxApi = (id) => request.post(`/admin/reservations/${id}`);

//统一修改最大人数
export const batchUpdateMaxApi = (maxCount) => request.post(`/admin/reservations/maxCount/${maxCount}`);

//查询每一个时段的预约学生名单
export const stuReservationApi = (id) => request.get(`/admin/reservations/${id}/stus`);