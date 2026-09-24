import request from "@/utils/request";

//查询每天预约信息汇总
export const reservationOfDayApi = (day) => request.get(`/common/reservations/days/${day}`);

//修改单一时段的最大人数
export const updateMaxApi = (id, maxCount) => request.post(`/admin/reservations/${id}/max-count`, null, { params: { maxCount } });

//统一设置未来时段的最大允许人数
export const batchUpdateMaxApi = (maxCount) => request.post(`/admin/reservations/batch-max-count`, null, { params: { maxCount } });

//查询每一个时段的预约学生名单
export const stuReservationApi = (id) => request.get(`/admin/reservations/${id}/stus`);

//设置某时段是否允许预约（isActive: 1允许 0禁止）
export const updateActiveApi = (id, isActive) =>
    request.patch(`/admin/reservations/${id}/active`, null, { params: { isActive } });