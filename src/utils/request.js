import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import router from '../router';
import { useUserStore } from '@/stores/user'
  

//创建axios实例对象
const request = axios.create({
  baseURL: '/api',
  timeout: 600000         //设置请求超时时间10min
})

//axios的请求 request 拦截器 - 获取localStorage中的token, 在请求头中增加token请求头
request.interceptors.request.use(
  (config) => { //成功回调
/*    const loginUser = JSON.parse(localStorage.getItem('loginUser'));
    if(loginUser && loginUser.token){
      config.headers.token = loginUser.token;
      config.headers["Authorization"] = `Bearer ${loginUser.token}`;
    }*/
    const userStore = useUserStore()
    let token = userStore.getToken()
    // 防御：历史版本曾把 token 用 JSON.stringify 包上引号存入，剥掉再发
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1)
    }
    console.log(token)
    const id = userStore.getId()

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
      config.headers["id"] = id || ''
    }
    // 标记请求发出时是否携带token：登出后残留在途请求(无token)的401不做登出提醒
    config._hadAuth = !!token
    return config;
  },
  (error) => { //失败回调
    return Promise.reject(error)
  }
)


//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  (error) => { //失败回调
    /*
    if(error.response.status == 401){ //全等
      //提示信息
      ElMessage.error('登录超时，请重新登录');
      //跳转到登录页面
      router.push('/login');
    }else {
      ElMessage.error('接口访问异常');
    }
      */

    // HTTP 状态码错误处理
    console.error('❌ 响应错误:', error);
    
    if (error.response.status) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          ElMessage.error(data.message || '请求参数错误');
          break;
        case 401:
          // 用户已主动退出(token已清空)后仍在途的请求，静默忽略，避免误弹"登录已过期"
          if (!error.config._hadAuth) {
            console.warn('未携带token的请求被401拒绝(登出后的残留请求)，已忽略:', error.config.url);
            break;
          }
          ElMessage.error('登录已过期，请重新登录');
          handleUnauthorized();
          break;
        case 403:
          ElMessage.error('没有权限访问该资源');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(data.message || `请求失败: ${status}`);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      ElMessage.error('网络连接异常，请检查网络');
    } else {
      // 请求配置出错
      ElMessage.error(error.message || '请求配置错误');
    }
    return Promise.reject(error)
  }
)

// 处理未授权（token 过期）
const handleUnauthorized = () => {
  const userStore = useUserStore();
  
  // 清除本地存储的 token
  userStore.logout();
  localStorage.removeItem('jwt_token');
  
  // 跳转到登录页
  ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
    confirmButtonText: '去登录',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    router.push('/login');
  });
};

export default request