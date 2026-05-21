<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  queryPageApi,
  addApi,
  deleteByIdApi,
  changeTimeApi,
  queryTotalNumApi,
} from "@/api/clazz";

defineOptions({ name: "ClazzIndex" });

// 判断是否为调整分页或者调整页码，是就不重复总条目数查询
const notPageChange = ref(true);

// 列表与分页
const clazzList = ref([]);
const total = ref(0);
const queryForm = ref({
  id: "",
  createTime: "",
  teacher: "",
  page: 1,
  pageSize: 10,
});

// 条件查询
const search = async () => {
  const hasId = queryForm.value.id && String(queryForm.value.id).trim() !== "";
  const hasTime = queryForm.value.createTime && String(queryForm.value.createTime).trim() !== "";
  const hasTeacher = queryForm.value.teacher && String(queryForm.value.teacher).trim() !== "";
  const params = {
    page: queryForm.value.page,
    pageSize: queryForm.value.pageSize,
  };
  if (hasId) params.id = String(queryForm.value.id).trim();
  if (hasTime) params.createTime = String(queryForm.value.createTime).trim();
  if (hasTeacher) params.teacher = String(queryForm.value.teacher).trim();
  if (notPageChange.value) await getTotalNum();
  const result = await queryPageApi(params);
  if (!result || !result.data.code) {
    ElMessage.error(result?.msg || "查询失败");
    return;       //如果没有返回值，直接返回     
  };

  // 统一提取列表
  let list = [];
  const data = result.data.data;
  if (Array.isArray(data)) {
    list = data;
  } else if (data && Array.isArray(data.records)) {
    list = data.records;
  } else if (data && Array.isArray(data.list)) {
    list = data.list;
  };
  clazzList.value = list;
/* 前端分页，已弃用
  if (hasId || hasTime) {
    const keywordId = hasId ? String(queryForm.value.id).trim() : "";
    const keywordTime = hasTime
      ? String(queryForm.value.createTime).trim()
      : "";
    const filtered = list.filter((item) => {
      const idStr = item?.id != null ? String(item.id) : "";
      const timeStr = item?.createTime != null ? String(item.createTime) : "";
      const idOk = keywordId ? idStr.includes(keywordId) : true;
      const timeOk = keywordTime ? timeStr.includes(keywordTime) : true;
      return idOk && timeOk;
    });
    total.value = filtered.length;
    const start = (queryForm.value.page - 1) * queryForm.value.pageSize;
    const end = start + queryForm.value.pageSize;
    clazzList.value = filtered.slice(start, end);
  } else {
    // 无过滤条件，沿用后端分页
    clazzList.value = list;
  }
*/
};


//查询总条目数
const getTotalNum = async () => {
  const params = {
    id: queryForm.value.id.trim(),
    createTime: queryForm.value.createTime.trim(),
    teacher: queryForm.value.teacher.trim()
  };
    const r = await queryTotalNumApi(params);
    total.value = r.data.data;
};

//默认第一页开始查询
const handleSearch = () => {
  queryForm.value.page = 1;
  search();
};

// 调整页码
const handlePageChange = (p) => {
  queryForm.value.page = p;
  notPageChange.value=false;
  search();
  notPageChange.value=true;
};
//调整分页数
const handleSizeChange = (ps) => {
  queryForm.value.pageSize = ps;
  queryForm.value.page = 1;
  notPageChange.value=false;
  search();
  notPageChange.value=true;
};

// 新增对话框与表单
const addDialogVisible = ref(false);  //控制对话框是否隐藏，ref响应式变量，false初始值代表默认隐藏
const addFormRef = ref();           //表单引用保存
const addForm = ref({
  id: "",
  createTime: "",
  teacher: "",
});

//表单认证规则，红字提醒
const rules = {
  id: [{ required: true, message: "请输入班级ID", trigger: "blur" }],   //blur：失去焦点后显示message
  createTime: [{ required: true, message: "请输入添加时间", trigger: "blur" }],
  teacher: [{ required: true, message: "请输入任课老师", trigger: "blur"}],
};

// 编辑对话框与表单
const editDialogVisible = ref(false);
const editFormRef = ref();
const editForm = ref({
  id: "",
  createTime: "",
  teacher: "",
});

const openEditDialog = (row) => {   //用户点开某行row
  editForm.value = {                //当前行传入
    id: row.id,
    createTime: row.createTime,
    teacher: row.teacher,
  };
  editDialogVisible.value = true;
};

const submitEdit = async () => {
  if (!editFormRef.value) return;
  editFormRef.value.validate(async (valid) => {
    if (!valid) return;
    const result = await changeTimeApi({ ...editForm.value });
    if (result && result.data.code) {
      ElMessage.success("修改成功");
      editDialogVisible.value = false;
      search();
    } else {
      ElMessage.error(result?.msg || "修改失败");
    }
  });
};

const openAddDialog = () => {
  addForm.value = { id: "", createTime: "", teacher: ""};
  addDialogVisible.value = true;
};

const submitAdd = () => {
  if (!addFormRef.value) return;
  addFormRef.value.validate(async (valid) => {          //合法性
    if (!valid) {
      ElMessage.error("非法格式");
      return;
    }
    const result = await addApi({ ...addForm.value });   // 展开运算符，将 addForm.value 对象中的所有属性展开并传递给 addApi 函数
    if (result && result.data.code) {
      ElMessage.success("新增成功");
      addDialogVisible.value = false;
      search();
    } else {
      ElMessage.error(result?.msg || "新增失败");
    }
  });
};

// 删除班级
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认删除班级ID为 ${row.id} 的记录吗？`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      }
    );
  } catch (e) {
    return; // 用户取消
  }
  const result = await deleteByIdApi(row.id);
  if (result && result.data.code) {
    ElMessage.success("删除成功");
    search();
  } else {
    ElMessage.error(result?.msg || "删除失败");
  }
};

// 生命周期
// 进入界面默认无条件分页查询
onMounted(() => {
  search();
});
</script>

<template>
  <div class="page-wrapper">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">📚</span>
          班级管理
        </h1>
        <p class="page-subtitle">管理班级信息、教师分配与数据统计</p>
      </div>
      <div class="header-decoration"></div>
    </div>

    <!-- 搜索区域 -->
    <div class="search-card">
      <div class="card-header">
        <span class="card-icon">🔍</span>
        <span class="card-title">查询条件</span>
      </div>
      <el-form inline class="search-form">
        <el-form-item label="班级编号">
          <el-input
            v-model="queryForm.id"
            placeholder="请输入班级编号"
            class="search-input"
            @keydown.enter="search"
          >
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="添加时间">
          <el-input
            v-model="queryForm.createTime"
            placeholder="支持部分关键字(可留空)"
            class="search-input"
            @keydown.enter="search"
          >
            <template #prefix>
              <el-icon><Calendar /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="任课教师">
          <el-input
            v-model="queryForm.teacher"
            placeholder="请输入老师姓名"
            class="search-input"
            @keydown.enter="search"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" class="btn-search">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button native-type="reset" class="btn-reset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="openAddDialog" class="btn-add">
            <el-icon><Plus /></el-icon>
            新增班级
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-card">
      <div class="card-header">
        <span class="card-icon">📋</span>
        <span class="card-title">班级列表</span>
        <el-tag type="info" effect="plain" class="count-tag">共 {{ total }} 条</el-tag>
      </div>
      <el-table
        :data="clazzList"
        border
        stripe
        highlight-current-row
        class="data-table"
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="80" align="center">
          <template #default="{ $index }">
            <span class="index-badge">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="班级编号" min-width="200" align="center">
          <template #default="{ row }">
            <router-link
              class="link-id"
              :to="{ name: 'clazzDetail', params: { id: row.id } }"
            >
              <el-tag effect="plain" type="primary" class="id-tag">
                {{ row.id }}
              </el-tag>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="添加时间" min-width="250" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <el-icon><Clock /></el-icon>
              <span>{{ row.createTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="teacher" label="任课教师" min-width="180" align="center">
          <template #default="{ row }">
            <div class="teacher-cell">
              <el-avatar :size="28" class="teacher-avatar">
                {{ row.teacher?.charAt(0) || '?' }}
              </el-avatar>
              <span class="teacher-name">{{ row.teacher }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              plain
              class="action-btn"
              @click="handleDelete(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <el-button
              type="primary"
              size="small"
              plain
              class="action-btn"
              @click="openEditDialog(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page="queryForm.page"
          :page-size="queryForm.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 新增对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增班级"
      width="500px"
      class="custom-dialog"
      destroy-on-close
    >
      <div class="dialog-icon">➕</div>
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="rules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="班级ID" prop="id">
          <el-input v-model="addForm.id" placeholder="请输入班级ID" class="dialog-input">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="添加时间" prop="createTime">
          <el-input v-model="addForm.createTime" placeholder="请输入添加时间" class="dialog-input">
            <template #prefix>
              <el-icon><Calendar /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="任课教师" prop="teacher">
          <el-input v-model="addForm.teacher" placeholder="请输入任课教师" class="dialog-input">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitAdd" class="btn-confirm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑班级"
      width="500px"
      class="custom-dialog"
      destroy-on-close
    >
      <div class="dialog-icon">✏️</div>
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="班级ID" prop="id">
          <el-input v-model="editForm.id" disabled class="dialog-input disabled">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="添加时间" prop="createTime">
          <el-input
            v-model="editForm.createTime"
            placeholder="请输入添加时间"
            class="dialog-input"
          >
            <template #prefix>
              <el-icon><Calendar /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="任课教师" prop="teacher">
          <el-input
            v-model="editForm.teacher"
            placeholder="请输入任课教师"
            class="dialog-input"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false" class="btn-cancel">取 消</el-button>
          <el-button type="primary" @click="submitEdit" class="btn-confirm">保 存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 页面整体背景 */
.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  box-sizing: border-box;
}

/* 页面头部 */
.page-header {
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 20px;
  padding: 32px 40px;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header-decoration {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 36px;
}

.page-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

/* 卡片样式 */
.search-card,
.table-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.search-card:hover,
.table-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.card-icon {
  font-size: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.count-tag {
  margin-left: auto;
  font-size: 12px;
}

/* 搜索表单 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.search-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4a5568;
}

.search-input {
  width: 180px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

/* 按钮样式 */
.btn-search {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-search:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-reset {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-reset:hover {
  background-color: #f7fafc;
  transform: translateY(-2px);
}

.btn-add {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
}

/* 数据表格 */
.data-table {
  border-radius: 12px;
  overflow: hidden;
}

.data-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
}

.data-table :deep(.el-table__header th) {
  background: transparent;
  font-weight: 600;
  color: #4a5568;
  padding: 16px 0;
}

.data-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.data-table :deep(.el-table__row:hover) {
  background-color: #f8f9ff !important;
  transform: scale(1.002);
}

/* 序号徽章 */
.index-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

/* 链接样式 */
.link-id {
  text-decoration: none;
  transition: all 0.3s ease;
}

.id-tag {
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.link-id:hover .id-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  transform: scale(1.05);
}

/* 时间单元格 */
.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #4a5568;
}

.time-cell .el-icon {
  color: #667eea;
}

/* 教师单元格 */
.teacher-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.teacher-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 12px;
}

.teacher-name {
  font-weight: 500;
  color: #2d3748;
}

/* 操作按钮 */
.action-btn {
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}

/* 分页 */
.pagination-wrapper {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.custom-pagination :deep(.el-pagination__total) {
  color: #4a5568;
  font-weight: 500;
}

.custom-pagination :deep(.el-pagination__sizes) {
  margin-right: 16px;
}

.custom-pagination :deep(.el-pager li) {
  border-radius: 8px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.custom-pagination :deep(.el-pager li:hover) {
  transform: translateY(-2px);
}

.custom-pagination :deep(.el-pager li.active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 对话框样式 */
.custom-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.custom-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 24px;
  margin: 0;
}

.custom-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.custom-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 30px 24px;
}

.dialog-icon {
  text-align: center;
  font-size: 48px;
  margin-bottom: 20px;
}

.dialog-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4a5568;
}

.dialog-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.dialog-input.disabled :deep(.el-input__wrapper) {
  background-color: #f7fafc;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 16px;
  }

  .page-header {
    padding: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .search-card,
  .table-card {
    padding: 16px;
  }

  .search-input {
    width: 100%;
  }
}
</style>
