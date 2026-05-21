<script setup>
  import {ref, onMounted} from "vue";
  import {dayjs, ElMessage, ElMessageBox} from "element-plus";
  import {
    queryTotalNumApi,
    queryPageApi,
    addApi,
    deleteByIdApi,
    editApi,
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
  password: "",
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
  password: [{required: true, message: "请输入密码", trigger: "blur"}],
});

// 用户身份
const roles = ref([
  {value: 1, label: "管理员"},
  {value: 2, label: "教师"},
  {value: 3, label: "学生"}
]);

//用户查询
const search = async () => {
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
    password: row.password,
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

// 提交修改表单
const submitEdit = async () => {
  if(!editForm.value) return;
  try{
    await editFormRef.value.validate();
    const r = await editApi(...editForm.value);
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
        <el-table-column
          label="密码"
          prop="password"
          width="200px"
          align="center"
        />
        <el-table-column
          label="创建时间"
          prop="createTime"
          width="100px"
          align="center"
        />
        <el-table-column label="操作" width="200px" align="center">
          <template #default="scope">
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
          <el-form-item label="密码" prop="password">
            <el-input v-model="editForm.password"/>
          </el-form-item>
        </el-form>
        <template #footer>
          <div>
            <el-button @click="submitEdit" type="primary">确定</el-button>
            <el-button @click="editDialogVisible=false">取消</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
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
</style>