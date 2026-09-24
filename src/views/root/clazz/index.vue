<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import {
  queryPageApi,
  addApi,
  deleteByIdApi,
  changeTeacherApi,
  queryTotalNumApi,
  importClazzesApi,
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
  if (!result || !result.code) {
    ElMessage.error(result?.msg || "查询失败");
    return;       //如果没有返回值，直接返回     
  };

  // 统一提取列表
  let list = [];
  const data = result.data;
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
    total.value = r.data;
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
    const result = await changeTeacherApi(editForm.value);
    if (result && result.code) {
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
    if (result && result.code) {
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
  if (result && result.code) {
    ElMessage.success("删除成功");
    search();
  } else {
    ElMessage.error(result?.msg || "删除失败");
  }
};

// ==================== Excel批量导入 ====================
const importDialogVisible = ref(false);
const importFile = ref(null);
const importing = ref(false);
const importResult = ref(null);

const openImportDialog = () => {
  importFile.value = null;
  importResult.value = null;
  importDialogVisible.value = true;
};

const handleFileChange = (file) => {
  importFile.value = file.raw;
};

const submitImport = async () => {
  if (!importFile.value) {
    ElMessage.warning("请先选择 .xlsx 文件");
    return;
  }
  importing.value = true;
  try {
    const formData = new FormData();
    formData.append("file", importFile.value);
    const result = await importClazzesApi(formData);
    if (result && result.code) {
      importResult.value = result.data;
      ElMessage.success(`导入完成：成功 ${result.data.success} 条，失败 ${result.data.fail} 条`);
      search();
    } else {
      ElMessage.error(result?.msg || "导入失败");
    }
  } catch (e) {
    ElMessage.error("导入失败，请重试");
  } finally {
    importing.value = false;
  }
};

// 下载导入模板（public/templates 下的静态文件）
const templateFile = "/templates/班级导入模板.xlsx";

// 生命周期
// 进入界面默认无条件分页查询
onMounted(() => {
  search();
});
</script>

<template>
  <div>
    <h1>班级管理</h1>
    <div class="container">
      <el-form inline>
        <el-form-item label="班级编号">
          <el-input
            v-model="queryForm.id"
            placeholder="请输入班级编号"
            style="width: 150px"
            @keydown.enter="search"
          />
        </el-form-item>
        <el-form-item label="添加时间">
          <el-input
            v-model="queryForm.createTime"
            placeholder="支持部分关键字(可留空)"
            style="width: 150px"
            @keydown.enter="search"
          />
        </el-form-item>
        <el-form-item label="任课教师">
          <el-input 
            v-model="queryForm.teacher"
            placeholder="请输入老师姓名"
            style="width: 150px"
            @keydown.enter="search"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button native-type="reset">重置</el-button>
          <el-button type="success" @click="openAddDialog">新增班级</el-button>
          <el-button type="warning" @click="openImportDialog">Excel导入</el-button>
          <a :href="templateFile" download>
            <el-button link type="primary">下载模板</el-button>
          </a>
        </el-form-item>
      </el-form>
    </div>

    <div class="container">
      <el-table :data="clazzList" border style="width: 1150px">
        <el-table-column type="index" label="序号" width="100px" align="center" />
        <el-table-column
          label="班级编号"
          width="300px"
          align="center"
        >
          <template #default="{row}">
            <router-link class="link"
              :to="{name: 'clazzDetail', params: {id: row.id}}">{{ row.id }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="添加时间"
          width="350px"
          align="center"
        />
        <el-table-column
          prop="teacher"
          label="任课教师"
          width="200px"
          align="center"
        />
        <el-table-column label="操作" width="200px" align="center">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
            <el-button
              type="primary"
              size="small"
              style="margin-left: 8px"
              @click="openEditDialog(scope.row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="page">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :total="total"
          :current-page="queryForm.page"
          :page-size="queryForm.pageSize"
          :page-sizes="[5, 10, 20, 50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="新增班级" width="500px">
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="班级ID" prop="id">
          <el-input v-model="addForm.id" placeholder="请输入班级ID" />
        </el-form-item>
        <el-form-item label="添加时间" prop="createTime">
          <el-input v-model="addForm.createTime" placeholder="请输入添加时间" />
        </el-form-item>
        <el-form-item label="任课教师" prop="teacher">
          <el-input v-model="addForm.teacher" placeholder="请输入任课教师"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="submitAdd">确 定</el-button>
          <el-button @click="addDialogVisible = false">取 消</el-button>
        </span>
      </template>
    </el-dialog>
    <el-dialog v-model="editDialogVisible" title="编辑班级" width="500px">
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="班级ID" prop="id">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="添加时间" prop="createTime">
          <el-input
            v-model="editForm.createTime" disabled />
        </el-form-item>
        <el-form-item label="任课教师" prop="teacher">
          <el-input 
            v-model="editForm.teacher"
            placeholder="请输入任课教师"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="submitEdit">保 存</el-button>
          <el-button @click="editDialogVisible = false">取 消</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Excel批量导入班级对话框 -->
    <el-dialog v-model="importDialogVisible" title="Excel批量导入班级" width="560px" destroy-on-close>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px;">
        <p>列顺序：班级id | 年份(可选,默认当前年) | 教师姓名(可选,须为已有教师账号的姓名)</p>
        <p>首行为表头时自动跳过；单行失败不影响其他行。</p>
      </el-alert>
      <el-upload
        drag
        accept=".xlsx"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning('一次只能选择一个文件')"
      >
        <el-icon style="font-size: 40px; color: #909399;"><UploadFilled /></el-icon>
        <div>拖拽 .xlsx 文件到此处，或点击选择</div>
      </el-upload>
      <div v-if="importResult" class="import-result">
        <el-divider />
        <p>共 {{ importResult.total }} 行：成功 <b style="color:#67C23A">{{ importResult.success }}</b> 条，失败 <b style="color:#F56C6C">{{ importResult.fail }}</b> 条</p>
        <ul v-if="importResult.errors && importResult.errors.length">
          <li v-for="(err, i) in importResult.errors" :key="i" class="import-error">{{ err }}</li>
        </ul>
      </div>
      <template #footer>
        <div>
          <el-button @click="importDialogVisible=false">关闭</el-button>
          <el-button type="primary" :loading="importing" @click="submitImport">开始导入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.container {
  margin: 15px 0px;
}
.page {
  margin-top: 12px;
  text-align: right;
}

.link {
  color: inherit; /* 继承父元素颜色 */
  text-decoration: none; /* 默认无下划线 */
}
.link:hover {
  color: blue; /* 鼠标悬停时的颜色 */
  text-decoration: underline; /* 鼠标悬停时添加下划线 */
}

.import-result {
  margin-top: 4px;
}
.import-result ul {
  max-height: 140px;
  overflow-y: auto;
  margin: 6px 0 0;
  padding-left: 20px;
}
.import-error {
  color: #f56c6c;
  font-size: 13px;
  line-height: 20px;
}
</style>
