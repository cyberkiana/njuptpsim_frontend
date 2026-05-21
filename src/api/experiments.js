/**
 * 实验资源数据API
 * 包含模拟数据和实际API调用方法
 */

// 模拟实验数据
export const mockExperiments = [
  {
    id: 1,
    title: '物理实验1',
    description: '通过Unity模拟物体在重力作用下的自由落体运动，观察不同质量物体的下落规律',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    tags: ['物理', '力学', '基础'],
    duration: '20分钟',
    difficulty: '入门',
    isNew: true,
    unityWebUrl: 'https://unity-experiments.com/physics/free-fall',
    unityLocalPath: 'experiments://physics/freefall'
  },
  {
    id: 2,
    title: '物理实验2',
    description: '模拟酸碱中和反应过程，观察PH值变化和热量释放现象',
    coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop',
    tags: ['物理', '电学', '实验'],
    duration: '30分钟',
    difficulty: '中级',
    isHot: true,
    unityWebUrl: 'https://unity-experiments.com/chemistry/acid-base'
  },
  {
    id: 3,
    title: '物理实验3',
    description: '使用VR技术进入虚拟细胞内部，观察细胞器和细胞结构',
    coverImage: 'https://images.unsplash.com/photo-1516549655669-df565bc4d4d5?w=400&h=300&fit=crop',
    tags: ['物理', '电学', '电子'],
    duration: '45分钟',
    difficulty: '高级',
    unityWebUrl: 'https://unity-experiments.com/biology/cell-vr'
  },
  {
    id: 4,
    title: '物理实验4',
    description: '可视化展示各种排序算法的执行过程，理解算法原理',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w-400&h=300&fit=crop',
    tags: ['物理', '热学', '实验'],
    duration: '25分钟',
    difficulty: '中级',
    unityLocalPath: 'experiments://programming/sorting'
  },
  {
    id: 5,
    title: '物理实验5',
    description: '模拟光线在不同介质中的传播，观察折射和反射现象',
    coverImage: 'https://images.unsplash.com/photo-1534796636918-6a8c0be14515?w=400&h=300&fit=crop',
    tags: ['物理', '光学', '实验'],
    duration: '35分钟',
    difficulty: '中级',
    unityWebUrl: 'https://unity-experiments.com/physics/optics'
  },
  {
    id: 6,
    title: '物理实验6',
    description: '通过AR技术将分子结构投影到现实空间，进行多角度观察',
    coverImage: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop',
    tags: ['物理', '声学', '原子'],
    duration: '40分钟',
    difficulty: '高级',
    isNew: true
  },
  {
    id: 7,
    title: '物理实验7',
    description: '模拟生态系统中不同生物之间的食物链关系，观察能量流动',
    coverImage: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=400&h=300&fit=crop',
    tags: ['物理', '光学', '模拟'],
    duration: '50分钟',
    difficulty: '高级',
    unityWebUrl: 'https://unity-experiments.com/biology/ecosystem'
  },
  {
    id: 8,
    title: '物理实验8',
    description: '搭建虚拟电路，学习串联和并联电路的基本原理',
    coverImage: 'https://images.unsplash.com/photo-1629654291660-3c98113a0438?w=400&h=300&fit=crop',
    tags: ['物理', '电路', '基础'],
    duration: '30分钟',
    difficulty: '入门',
    isHot: true
  },
  // 可以继续添加更多模拟数据...
]

// 实际API调用函数
export const getExperiments = async (params = {}) => {
  try {
    // 实际项目中调用真实API
    // const response = await axios.get('/api/experiments', { params })
    // return response.data
    
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: mockExperiments,
          message: '成功'
        })
      }, 500)
    })
  } catch (error) {
    console.error('获取实验数据失败:', error)
    throw error
  }
}

export const searchExperiments = async (keyword) => {
  // 搜索实验资源
  const filtered = mockExperiments.filter(exp =>
    exp.title.includes(keyword) ||
    exp.description.includes(keyword) ||
    exp.tags.some(tag => tag.includes(keyword))
  )
  return filtered
}

export const getExperimentById = async (id) => {
  return mockExperiments.find(exp => exp.id === id)
}