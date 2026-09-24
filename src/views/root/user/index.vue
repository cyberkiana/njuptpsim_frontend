<script setup>
  import {ref, onMounted} from "vue";
  import {dayjs, ElMessage, ElMessageBox} from "element-plus";
  import {UploadFilled} from "@element-plus/icons-vue";
  import {
    queryTotalNumApi,
    queryPageApi,
    addApi,
    deleteByIdApi,
    editApi,
    importUsersApi,
    resetPasswordApi,
    clearAvatarApi,
    banUserApi,
    unbanUserApi,
    getUserBansApi,
  } from "@/api/user";

 defineOptions({ name: "UserIndex"})

const notPageChange = ref(true);

//查询用户信息
const queryUserForm = ref({
  id : "",
  name: "",
  roleId: "",
  page : 1,
  pageSize : 10,
});

const addForm = ref({
  id: "",
  name: "",
  roleId: "",
  account: "",
  password: "",
})

const editForm = ref({
  id: "",
  name: "",
  roleId: "",
  account: "",
})

 // 列表与分页查询
const userList = ref([]);
const total = ref(0);

// 新增表单对话
const addDialogVisible = ref(false);
// 修改表单对话
const editDialogVisible = ref(false);

const addFormRef = ref();
const editFormRef = ref();

// 新增规则
const rules = ref({
  id: [{ required: true, message: "请输入用户id", trigger: "blur"}],
  name: [{ required: true, message: "请输入用户姓名", trigger: "blur"}],
  roleId: [{ required: true, message: "请选择用户身份", trigger: "blur"}],
  account: [{required: true, message: "请输入账号", trigger: "blur"}],
});

// 账号封禁名单(封禁中)与全部记录
const banList = ref([])

const loadBans = async () => {
  try {
    const res = await getUserBansApi()
    banList.value = res?.data || []
  } catch (e) {
    console.error('获取封禁名单失败:', e)
  }
}

const isBanned = (userId) => banList.value.some(b => b.userId === userId && b.status === 1)

// 用户身份（与数据库 roles 表一致：1管理员 2教师 3学生）
const roles = ref([
  {value: 1, label: "管理员"},
  {value: 2, label: "教师"},
  {value: 3, label: "学生"}
]);

// ========== 封禁/解封账号 ==========
const banDialogVisible = ref(false)
const banTarget = ref(null)
const banReason = ref('')

const openBanDialog = (row) => {
  banTarget.value = row
  banReason.value = ''
  banDialogVisible.value = true
}

const submitBan = async () => {
  if (!banTarget.value) return
  try {
    const res = await banUserApi({ userId: banTarget.value.id, reason: banReason.value })
    if (res && res.code) {
      ElMessage.success(`账号 ${banTarget.value.id} 已封禁`)
      banDialogVisible.value = false
      search()
    } else {
      ElMessage.error(res?.msg || '封禁失败')
    }
  } catch (e) {
    ElMessage.error('封禁失败，请重试')
  }
}

const handleUnbanRow = async (row) => {
  //banList 已在 search()/loadBans() 加载, 直接复用避免整表重查
  const rec = banList.value.find(b => b.userId === row.id && b.status === 1)
  if (!rec) {
    ElMessage.error('未找到封禁记录')
    return
  }
  try {
    const r = await unbanUserApi(rec.id)
    if (r && r.code) {
      ElMessage.success(`账号 ${row.id} 已解封`)
      search()
    } else {
      ElMessage.error(r?.msg || '解封失败')
    }
  } catch (e) {
    ElMessage.error('解封失败，请重试')
  }
}
//用户查询
const search = async () => {
  await loadBans()
  const hasId = queryUserForm.value.id && queryUserForm.value.id.trim() !== "";
  const hasName = queryUserForm.value.name && queryUserForm.value.name.trim() !== "";
  const hasRole = queryUserForm.value.roleId
  const params = {
    page : queryUserForm.value.page,
    pageSize : queryUserForm.value.pageSize,
  };
  if(hasId) params.id = queryUserForm.value.id;
  if(hasName) params.name = queryUserForm.value.name;
  if(hasRole) params.roleId = queryUserForm.value.roleId;
  if(notPageChange.value) await getTotalNum();
  const result = await queryPageApi(params);
  if (!result || !result.code) {
    ElMessage.error(result?.msg || "查询失败");
    return;           
  };
  let list=[];
  const data = result.data;
  if(Array.isArray(data)){
    list = data;
  } else if (data && Array.isArray(data.records)) {
    list = data.records;
  } else if (data && Array.isArray(data.list)) {
    list = data.list;
  };
  console.log('list'+list)
  userList.value=list;
};

// 后端传入的用户身份格式化
const formatRoleType = (roleId) => {
  const roleNameMap = {
    1 : "管理员",
    2 : "教师",
    3 : "学生",
  }
  return roleNameMap[roleId] || roleId
}

const getTotalNum = async () => {
  const params = {
    id: queryUserForm.value.id.trim(),
    name: queryUserForm.value.name,
    roleId: queryUserForm.value.roleId,
  }
  const r = await queryTotalNumApi(params);
  total.value = r.data;
};

// 点击查询按钮
const handleSearch = () => {
  queryUserForm.page=1;
  search();
};

// 点击新增按钮
const openAddDialog = () => {
  addForm.value = {
    id: "",
    name: "",
    roleId: "",
  };
  addDialogVisible.value=true;
};

// 点击删除按钮
const handleDelete = async (row) => {
  try{
    await ElMessageBox.confirm(
      `确认删除id为${row.id}的用户吗`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      }
    );
  } catch (e) {
    return;
  }
  const r = await deleteByIdApi(row.id);
  if(r && r.code){
    ElMessage.success("删除成功");
    search();
  } else{
    ElMessage.error(r?.msg || "删除失败");
  }
};

// 点击编辑按钮
const openEditDialog = (row) => {
  editForm.value = {
    id: row.id,
    name: row.name,
    roleId: row.roleId,
    account: row.account,
  }
  editDialogVisible.value = true;
};

// 提交新增表单
const submitAdd = () => {
  if(!addForm.value) return;
  addFormRef.value.validate(
    async (valid) => {
      if(!valid){
        ElMessage.error("非法格式");
        return;
      }
      const r = await addApi({...addForm.value, createTime: dayjs().format("YYYY-MM-DD")});
      console.log(r);
      if(r && r.code){
        ElMessage.success("新增成功");
        addDialogVisible.value = false;
        search();
      } else {
        ElMessage.error(r?.msg || "新增失败");
      }
    }
  )
};

// 重置密码为初始密码123456，确认后立即生效
const handleResetPassword = async () => {
  try {
    await ElMessageBox.confirm(
      `确认将 ${editForm.value.id} 的密码重置为 123456 吗？重置后旧密码立即失效。`,
      "重置密码",
      { type: "warning", confirmButtonText: "重置", cancelButtonText: "取消" }
    )
  } catch (e) { return }
  try {
    const r = await resetPasswordApi(editForm.value.id)
    if (r && r.code) {
      ElMessage.success(`密码已重置为 123456`)
    } else {
      ElMessage.error(r?.msg || '重置失败')
    }
  } catch (e) {
    ElMessage.error('重置失败，请重试')
  }
}

// 删除用户头像，确认后立即生效
const handleClearAvatar = async () => {
  try {
    await ElMessageBox.confirm(
      `确认删除 ${editForm.value.id} 的头像吗？删除后立即生效。`,
      "删除头像",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    )
  } catch (e) { return }
  try {
    const r = await clearAvatarApi(editForm.value.id)
    if (r && r.code) {
      ElMessage.success('头像已删除')
    } else {
      ElMessage.error(r?.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败，请重试')
  }
}

// 提交修改表单
const submitEdit = async () => {
  if(!editForm.value) return;
  try{
    await editFormRef.value.validate();
    const r = await editApi({...editForm.value});
    if(r && r.code){
        ElMessage.success("修改成功");
        editDialogVisible.value = false;
        search();
      } else {
        ElMessage.error(r?.msg || "修改失败");
      }
  } catch(e) {
    ElMessage.error("表单验证失败", e);
    return;
  }
  
};

// ==================== Excel批量导入 ====================
const importDialogVisible = ref(false);
const importFile = ref(null);       // 选中的文件
const importing = ref(false);       // 上传中
const importResult = ref(null);     // { total, success, fail, errors: [] }

const openImportDialog = () => {
  importFile.value = null;
  importResult.value = null;
  importDialogVisible.value = true;
};

// 手动选择文件（不走自动上传）
const handleFileChange = (file) => {
  importFile.value = file.raw;
};

// 提交导入
const submitImport = async () => {
  if (!importFile.value) {
    ElMessage.warning("请先选择 .xlsx 文件");
    return;
  }
  importing.value = true;
  try {
    const formData = new FormData();
    formData.append("file", importFile.value);
    const r = await importUsersApi(formData);
    if (r && r.code) {
      importResult.value = r.data;
      ElMessage.success(`导入完成：成功 ${r.data.success} 条，失败 ${r.data.fail} 条`);
      search();
    } else {
      ElMessage.error(r?.msg || "导入失败");
    }
  } catch (e) {
    ElMessage.error("导入失败，请重试");
  } finally {
    importing.value = false;
  }
};

// 下载导入模板（public/templates 下的静态文件）
const templateFile = "/templates/用户导入模板.xlsx";

// 换页
const handlePageChange = (page) => {
  queryUserForm.value.page = page;
  notPageChange.value = false;
  search();
  notPageChange.value = true;
};

// 改变每页数量
const handleSizeChange = (pageSize) => {
  queryUserForm.value.pageSize = pageSize;
  queryUserForm.value.page = 1;
  notPageChange.value = false;
  search();
  notPageChange.value = true;
};


onMounted(() => {
  search();
});
</script>

<template>
  <div>
    <h1>用户管理</h1>
    <div class="container">
      <el-form inline>
        <el-form-item label="用户姓名">
          <el-input 
            v-model="queryUserForm.name"
            placeholder="请输入用户姓名"
            style="width: 150px;"
            @keydown.enter="search"
          />
        </el-form-item>
        <el-form-item label="用户id">
          <el-input 
            v-model="queryUserForm.id"
            placeholder="请输入用户id"
            style="width: 150px;"
            @keydown.enter="search"
          />
        </el-form-item>
        <el-form-item label="选择用户身份">
          <el-select v-model="queryUserForm.roleId" placeholder="请选择">
            <el-option label="请选择" value=""></el-option>
              <el-option
                v-for="role in roles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button native-type="reset">重置</el-button>
          <el-button type="success" @click="openAddDialog">新增</el-button>
          <el-button type="warning" @click="openImportDialog">Excel导入</el-button>
          <a :href="templateFile" download>
            <el-button link type="primary">下载模板</el-button>
          </a>
        </el-form-item>
      </el-form>
    </div>

    <div class="container">
      <el-table :data="userList" border style="width: 100%;">
        <el-table-column 
          label="姓名" 
          prop="name" 
          width="100px" 
          align="center"
        />
        <el-table-column
          label="id"
          prop="id"
          width="100px"
          align="center"
        />
        <el-table-column label="身份" prop="roleId" width="300px" align="center">
          <template #default="scope">
            <span>{{formatRoleType(scope.row.roleId)}}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="账号"
          prop="account"
          width="200px"
          align="center"
        />
        <el-table-column label="账号状态" width="100px" align="center">
          <template #default="scope">
            <el-tag :type="isBanned(scope.row.id) ? 'danger' : 'success'" size="small">
              {{ isBanned(scope.row.id) ? '封禁中' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createTime"
          width="100px"
          align="center"
        />
        <el-table-column label="操作" width="200px" align="center">
          <template #default="scope">
            <el-button v-if="!isBanned(scope.row.id)" type="warning" size="small" style="margin-left: 8px;" @click="openBanDialog(scope.row)">封禁</el-button>
            <el-button v-else type="success" size="small" @click="handleUnbanRow(scope.row)">解封</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            <el-button type="primary" size="small" style="margin-left: 8px;" @click="openEditDialog(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="page">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :total="total"
          :current-page="queryUserForm.page"
          :page-size="queryUserForm.pageSize"
          :page-sizes="[5,10,20,50]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <div>
      <el-dialog v-model="addDialogVisible" title="新增用户" width="500px">
        <el-form 
          ref="addFormRef"
          :model="addForm"
          :rules="rules"
          label-width="150px"
        >
          <el-form-item label="姓名" prop="name">
            <el-input v-model="addForm.name" placeholder="输入姓名"/>
          </el-form-item>
          <el-form-item label="id" prop="id">
            <el-input v-model="addForm.id" placeholder="输入id"/>
          </el-form-item>
          <el-form-item label="身份" prop="roleId">
            <el-select v-model="addForm.roleId" placeholder="选择用户身份">
              <el-option
                v-for="role in roles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="账号" prop="account">
            <el-input v-model="addForm.account" placeholder="输入账号"/>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="addForm.password" placeholder="输入密码"/>
          </el-form-item>
        </el-form>
        <template #footer>
          <div>
            <el-button @click="submitAdd" type="primary">确定</el-button>
            <el-button @click="addDialogVisible=false">取消</el-button>
          </div>
        </template>
      </el-dialog>
      <el-dialog v-model="editDialogVisible" title="修改用户信息" width="500px">
        <el-form 
          ref="editFormRef"
          :rules="rules"
          :model="editForm"
          width: 150px;
        >
          <el-form-item label="id" prop="id">
            <el-input v-model="editForm.id" disabled/>
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="editForm.name"/>
          </el-form-item>
          <el-form-item label="身份" prop="roleId">
            <el-select v-model="editForm.roleId">
              <el-option
                v-for="role in roles"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="账号" prop="account">
            <el-input v-model="editForm.account"/>
          </el-form-item>
        </el-form>
        <div class="edit-actions">
          <el-button type="warning" plain @click="handleResetPassword">重置密码为123456</el-button>
          <el-button type="danger" plain @click="handleClearAvatar">删除头像</el-button>
        </div>
        <template #footer>
          <div>
            <el-button @click="submitEdit" type="primary">确定</el-button>
            <el-button @click="editDialogVisible=false">取消</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 封禁账号对话框 -->
      <el-dialog v-model="banDialogVisible" :title="`封禁账号 ${banTarget?.id || ''}`" width="460px" destroy-on-close>
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px;"
          title="封禁后该账号无法登录，已登录的会话也会被强制拦截。" />
        <el-form label-width="90px">
          <el-form-item label="封禁原因">
            <el-input v-model="banReason" placeholder="输入封禁原因(可选)" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div>
            <el-button @click="banDialogVisible=false">取消</el-button>
            <el-button type="danger" @click="submitBan">确认封禁</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Excel批量导入用户对话框 -->
      <el-dialog v-model="importDialogVisible" title="Excel批量导入用户" width="560px" destroy-on-close>
        <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px;">
          <p>列顺序：用户id | 姓名 | 密码 | 角色(学生/教师/管理员，或数字3/2/1) | 账号(可选,默认同id) | 学院(可选)</p>
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
  </div>
</template>

<style scoped>
.edit-actions {
  margin: 4px 0 12px;
  display: flex;
  gap: 10px;
}

.container {
  margin: 15px 0px;
}
.page {
  margin-top: 12px;
  text-align: right;
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