import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(localStorage.getItem('jwt_token') || '')
  const loginUser = ref(localStorage.getItem('loginUser') || '')
  const id = ref(localStorage.getItem('id') || '')
  
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
  
  function getToken(){
    return localStorage.getItem('jwt_token')
  }

  function getId(){
    return localStorage.getItem('id')
  }

  function clear() {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('loginUser')
  }
  
  function logout() {
    clear()
  }
  
  return {
    isLoggedIn,
    loginUser,
    setToken,
    logout,
    setUser,
    getToken,
    setId,
    getId,
  }
})