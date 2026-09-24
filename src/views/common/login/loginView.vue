<script setup>
import { ref } from 'vue'
import { loginApi} from '@/api/login'
import { getAvatarApi } from '@/api/user'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const loginForm = ref({account:'', password:''})
const router = useRouter();     //控制路由，五星好评
const userStore = useUserStore();

// 登录
const login = async () => {
  const result = await loginApi(loginForm.value);
  ElMessage.info(JSON.stringify(result))
  if(result.code){ //成功
    //提示信息
    ElMessage.success('登录成功');
    //存储当前登录用户信息和token（token/id 本身就是字符串，不能再用 JSON.stringify 包引号）
    userStore.setUser(JSON.stringify(result.data));
    userStore.setToken(result.data.token);
    userStore.setId(result.data.id);
    ElMessage.success('存储成功');
    //拉取该用户的头像并缓存到本地, 供layout头部显示
    try {
      const avatarRes = await getAvatarApi(result.data.id);
      // 无论是否为空都要写入, 覆盖掉上一个登录用户残留的头像
      userStore.setAvatar(avatarRes?.data || '');
    } catch (e) {
      //头像拉取失败不影响登录流程
      console.log('拉取头像失败', e);
      userStore.setAvatar('');
    }
    //跳转页面 - 首页
    if(result.data.roleName==="admin"){
      router.push('/root/home');
    }else if(result.data.roleName==="teacher"){
      router.push('/tea/home');
    }else if(result.data.roleName==="student"){
      router.push('/stu/home');
    }

  }else { //失败
    ElMessage.error(result.data.msg);
  }
}

// 使用数组管理多个 ref
const inputRefs = ref([]);

// 聚焦下一个输入框
const focusNext = (index) => {
  const nextIndex = index + 1;
  console.log(inputRefs.value.length);
  if (nextIndex < inputRefs.value.length) {
    // 聚焦下一个输入框
    inputRefs.value[nextIndex]?.focus();
  } else {
    // 最后一个,执行功能函数
    login();
  }
}

const setInputRefs = (el, index) => {
  if (el) {
    inputRefs.value[index] = el
    console.log(`inputRefs[${index}] 已保存`, el)
  }
}

// 重置
const clear = () => {
  loginForm.value = {account:'', password:''};
}
</script>

<template>
  <div id="container">
    <div class="login-form">
      <el-form label-width="80px">
        <p class="title">虚拟仿真物理实验平台</p>
        <el-form-item label="用户名" prop="account">
          <el-input :ref="(el) => setInputRefs(el,0)" v-model="loginForm.account" placeholder="请输入用户名" @keydown.enter="focusNext(0)"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input :ref="(el) => setInputRefs(el,1)" type="password" v-model="loginForm.password" placeholder="请输入密码" @keydown.enter="focusNext(1)"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button class="button" type="primary" @click="login">登 录</el-button>
          <el-button class="button" type="info" @click="clear">重 置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
#container {
  padding: 10%;
  height: 410px;
  background-image: url('../../../assets/bg1.jpg');
  background-repeat: no-repeat;
  background-size: cover;
}

.login-form {
  max-width: 400px;
  padding: 30px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  background-color: white;
}

.title {
  font-size: 30px;
  font-family: '楷体';
  text-align: center;
  margin-bottom: 30px;
  font-weight: bold;
}

.button {
  margin-top: 30px;
  width: 120px;
}
</style>