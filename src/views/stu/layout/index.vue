<script setup>
import {ref, onMounted} from 'vue';
import {ElMessageBox, ElMessage} from 'element-plus';
import { useRouter } from 'vue-router';
import { Document, HelpFilled, HomeFilled, Menu, Promotion, Tools, UserFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

//当前登录员工
const loginName = ref('');
const router = useRouter();
const userStore = useUserStore();

//钩子函数
onMounted(() => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'));
  if(loginUser && loginUser.name){
    loginName.value = loginUser.name;
  }
})

//退出登录
const logout = () => {
  //弹出确认框
  ElMessageBox.confirm('您确认退出登录吗?','提示',
    { confirmButtonText: '确认',cancelButtonText: '取消',type: 'warning'}
  ).then(async () => { //确认
    ElMessage.success('退出成功');
    userStore.logout();
    //跳转页面-登录
    router.push('/login');
  }).catch(() => { //取消
    ElMessage.info('您已取消退出');
  })
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- Header 区域 -->
      <el-header class="header">
        <span class="title">虚拟仿真物理实验系统管理平台</span>
        <span class="right_tool">
          <a href="javascript:;" @click="logout">
            <el-icon><SwitchButton /></el-icon> 退出登录 【{{loginName}}】
          </a>
        </span>
      </el-header>
      
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">
          <!-- 左侧菜单栏 -->
          <el-menu router>
            <!-- 首页菜单 -->
            <el-menu-item index="/stu/home">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>

            <!-- 实验菜单 -->
            <el-sub-menu index="/exp">
              <template #title>
                <el-icon><Menu /></el-icon> 实验管理
              </template>
              <el-menu-item index="/stu/exp">
                <el-icon><HelpFilled /></el-icon>实验资源
              </el-menu-item>
              <el-menu-item index="/stu/reservation">
                <el-icon><HelpFilled /></el-icon>预约实验
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>
        
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
      
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(to right, #00547d, #007fa4, #00aaa0, #00d072, #a8eb12);
}

.title {
  color: white;
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
}

.right_tool{
  float: right;
  line-height: 60px;
}

a {
  color: white;
  text-decoration: none;
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
