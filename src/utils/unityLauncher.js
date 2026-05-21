/**
 * Unity实验启动工具
 * 处理不同平台的Unity资源启动
 */

/**
 * 启动Unity实验
 * @param {Object} experiment - 实验对象
 * @param {string} platform - 平台类型：web, desktop, mobile
 */
export const launchUnityExperiment = (experiment, platform = 'web') => {
  console.log('启动Unity实验:', experiment.title)
  
  // 记录实验点击（用于数据分析）
  logExperimentClick(experiment.id)
  
  switch (platform) {
    case 'web':
      return launchWebGL(experiment)
    case 'desktop':
      return launchDesktop(experiment)
    case 'mobile':
      return launchMobile(experiment)
    default:
      throw new Error('不支持的平台类型')
  }
}

/**
 * 启动WebGL版本的Unity实验
 */
const launchWebGL = (experiment) => {
  if (!experiment.unityWebUrl) {
    throw new Error('该实验没有WebGL版本')
  }
  
  // 在新窗口或iframe中打开Unity WebGL
  const features = 'width=1200,height=800,resizable=yes,scrollbars=yes'
  window.open(experiment.unityWebUrl, '_blank', features)
  
  return {
    success: true,
    type: 'webgl',
    url: experiment.unityWebUrl
  }
}

/**
 * 启动桌面版Unity实验
 */
const launchDesktop = (experiment) => {
  if (!experiment.unityLocalPath) {
    throw new Error('该实验没有桌面版本')
  }
  
  // 使用自定义协议启动本地Unity应用
  const protocol = 'unitylaunch://'
  window.location.href = protocol + experiment.unityLocalPath
  
  // 备用方案：下载并启动本地应用
  setTimeout(() => {
    if (experiment.downloadUrl) {
      window.open(experiment.downloadUrl, '_blank')
    }
  }, 1000)
  
  return {
    success: true,
    type: 'desktop',
    path: experiment.unityLocalPath
  }
}

/**
 * 启动移动端Unity实验
 */
const launchMobile = (experiment) => {
  // 移动端特定处理
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)
  
  if (isIOS && experiment.iosAppUrl) {
    // iOS App Store或TestFlight
    window.location.href = experiment.iosAppUrl
  } else if (isAndroid && experiment.androidAppUrl) {
    // Android Google Play
    window.location.href = experiment.androidAppUrl
  } else {
    // 回退到WebGL
    return launchWebGL(experiment)
  }
}

/**
 * 记录实验点击数据
 */
const logExperimentClick = (experimentId) => {
  // 发送统计信息到后端
  const data = {
    experimentId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  }
  
  // 实际项目中发送到统计API
  console.log('实验点击统计:', data)
}

/**
 * 检查Unity环境支持
 */
export const checkUnitySupport = () => {
  const support = {
    webgl: 'WebGL' in window,
    wasm: 'WebAssembly' in window,
    webgl2: (() => {
      try {
        return !!document.createElement('canvas').getContext('webgl2')
      } catch {
        return false
      }
    })()
  }
  
  return support
}

/**
 * 获取最佳启动选项
 */
export const getBestLaunchOption = (experiment) => {
  const support = checkUnitySupport()
  
  if (support.webgl && experiment.unityWebUrl) {
    return 'web'
  } else if (experiment.unityLocalPath) {
    return 'desktop'
  } else if (experiment.downloadUrl) {
    return 'download'
  }
  
  return 'unsupported'
}