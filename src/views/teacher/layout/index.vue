<script setup>
import {ref, onMounted} from 'vue';
import {ElMessageBox, ElMessage} from 'element-plus';
import { useRouter } from 'vue-router';
import { Document, HelpFilled, HomeFilled, Menu, Promotion, Tools, UserFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { logoutApi } from '@/api/login';

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

//右上角下拉菜单命令处理: 个人中心 / 退出登录
const handleCommand = (command) => {
  if (command === 'userDetail') {
    //跳转个人中心(用户详情页, 可修改头像)
    router.push('/tea/userDetail');
  } else if (command === 'logout') {
    logout();
  }
}

//退出登录
const logout = () => {
  //弹出确认框
  ElMessageBox.confirm('您确认退出登录吗?','提示',
    { confirmButtonText: '确认',cancelButtonText: '取消',type: 'warning'}
  ).then(async () => { //确认
    //通知后端记录退出日志（失败不阻塞本地退出）
    logoutApi().catch(() => {});
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
          <!-- 用户头像 + 姓名下拉菜单: 个人中心 / 退出登录 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.avatar" class="header-avatar">
                <el-icon :size="20"><UserFilled /></el-icon>
              </el-avatar>
              <span class="user-name">{{loginName}}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="userDetail">
                  <el-icon><UserFilled /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </span>
      </el-header>
      
      <el-container>
        <!-- 左侧菜单 -->
        <el-aside width="200px" class="aside">
          <!-- 左侧菜单栏 -->
          <el-menu router>
            <!-- 首页菜单 -->
            <el-menu-item index="/tea/home">
              <el-icon><Promotion /></el-icon> 首页
            </el-menu-item>

            <!-- 实验管理菜单 -->
            <el-sub-menu index="/ttask">
              <template #title>
                <el-icon><Menu /></el-icon> 实验管理
              </template>
              <el-menu-item index="/tea/task">
                <el-icon><HelpFilled /></el-icon>发布实验
              </el-menu-item>
              <el-menu-item index="/tea/exp">
                <el-icon><HelpFilled /></el-icon>实验资源
              </el-menu-item>
              <el-menu-item index="/tea/data">
                <el-icon><HelpFilled /></el-icon>学生实验数据
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
  display: flex;
  align-items: center;
  height: 60px;
}

/* 头像 + 姓名下拉菜单区域 */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
  outline: none;
}

.header-avatar {
  background-color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
}

.arrow-icon {
  font-size: 12px;
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
