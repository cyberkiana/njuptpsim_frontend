import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(localStorage.getItem('jwt_token') || '')
  const loginUser = ref(localStorage.getItem('loginUser') || '')
  const id = ref(localStorage.getItem('id') || '')
  const avatar = ref(localStorage.getItem('avatar') || '')
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  
  // Actions
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('jwt_token', newToken)
    console.log("以存储token")
    console.log(token.value)
  }

  function setUser(newLoginUser) {

    loginUser.value = newLoginUser
    localStorage.setItem('loginUser', newLoginUser)
    console.log("以存储user")
    console.log(loginUser.value)
  }

  function setId(newId){
    id.value = newId
    localStorage.setItem("id", newId)
    console.log("已储存id")
    console.log(id.value)
  }

  function setAvatar(newAvatar) {
    avatar.value = newAvatar || ''
    if (newAvatar) {
      localStorage.setItem('avatar', newAvatar)
    } else {
      localStorage.removeItem('avatar')
    }
  }
  
  function getToken(){
    return localStorage.getItem('jwt_token')
  }

  function getId(){
    return localStorage.getItem('id')
  }

  function getAvatar(){
    return avatar.value
  }

  // 获取解析后的登录用户对象
  function getLoginUserInfo(){
    try {
      const user = localStorage.getItem('loginUser')
      return user ? JSON.parse(user) : null
    } catch (e) {
      console.error('解析登录用户信息失败', e)
      return null
    }
  }

  function clear() {
    // localStorage 与内存响应式变量必须同步清空，
    // 否则换账号登录后内存里残留的 avatar/token 会串号显示
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('loginUser')
    localStorage.removeItem('avatar')
    token.value = ''
    loginUser.value = ''
    id.value = ''
    avatar.value = ''
  }
  
  function logout() {
    clear()
  }
  
  return {
    isLoggedIn,
    loginUser,
    avatar,
    setToken,
    logout,
    setUser,
    getToken,
    setId,
    getId,
    getAvatar,
    setAvatar,
    getLoginUserInfo,
  }
})
