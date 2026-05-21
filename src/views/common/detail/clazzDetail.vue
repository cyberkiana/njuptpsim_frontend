<script setup>
import { ref, onMounted, defineOptions } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import { queryStuApi, deleteStuFromClazzApi } from "@/api/clazz";


const clazzDetail = ref([]);
// 获取当前路由信息
const route = useRoute();
const clazzId = route.params.id;

const searchStu = async (id) => {
  try{
    const r = await queryStuApi(id);
    clazzDetail.value = r.data.data;
  }catch (e){
    alert(e);
  }
}


const handleDelete = async (row) => {
  try{
    ElMessageBox.confirm(
      `确认从${id}班级中删除${row.name}吗？`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "确认",
        cancelButtonText: "取消"
      }
    )
  }catch(e){
    return;
  }
  const r =  await deleteStuFromClazzApi(clazzId, row.id);
  if(r && r.data.code){
    ElMessage.success("删除成功");
  }else{
    ElMessage.error(result?.msg || "删除失败");
  }
}

onMounted(() => {
    searchStu(clazzId);
});

</script>

<template>
  <div>
    <div class="title">
      <p>{{ clazzId }}班级学生表</p>
    </div>
    <div class="container">
      <el-table :data="clazzDetail" border style="width: 100%;">
        <el-table-column 
          label="姓名" 
          prop="name" 
          width="200px" 
          align="center"/>
        <el-table-column 
          label="学号" 
          prop="id" 
          width="200px" 
          align="center"/>
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
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>

</template>

<style scoped>
.container {
  margin: 15px 0px;
}
.title {
  font-size: medium;
}
</style>