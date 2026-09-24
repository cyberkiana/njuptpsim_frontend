<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit } from '@element-plus/icons-vue'
import { getExperimentsByTagApi, addExperimentApi, updateExperimentApi, deleteExperimentApi, uploadWebglApi, EXP_TAGS } from '@/api/experiments'

// 加载状态
const loading = ref(false)

// 实验数据列表
const experiments = ref([])

// 初始化加载数据: 从后端查询全部实验资源
const loadExperiments = async () => {
  loading.value = true
  try {
    const res = await getExperimentsByTagApi('')
    experiments.value = res?.data || []
  } catch (error) {
    console.error('查询实验资源失败:', error)
    ElMessage.error('查询实验资源失败')
  } finally {
    loading.value = false
  }
}

// ==================== 删除实验 ====================
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除实验「${row.title}」吗?`, '提示',
    { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await deleteExperimentApi(row.title)
      if (res && res.code) {
        ElMessage.success('删除成功')
        await loadExperiments()
      } else {
        ElMessage.error(res?.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败，请重试')
    }
  }).catch(() => {
    ElMessage.info('您已取消删除')
  })
}

// ==================== 新增/修改实验对话框 ====================
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const saving = ref(false)

// 新增表单
const addForm = reactive({ title: '', tag: '', content: '', url: '' })
// 修改表单（oldName 定位原实验）
const editForm = reactive({ oldName: '', title: '', tag: '', content: '', url: '', coverImage: '' })

// 表单错误信息
const formErrors = reactive({ title: '', tag: '' })

const clearErrors = () => {
  formErrors.title = ''
  formErrors.tag = ''
}

// ==================== WebGL文件上传 ====================
const webglFile = ref(null)       // 选中的WebGL文件
const uploadingCover = ref(false)
const uploadingWebgl = ref(false) // 上传中

// 选择文件后立即上传到服务器独立文件夹, 返回url填入表单
// 选择头图后立即上传到服务器 /img 独立文件夹, 返回路径填入 coverImage
const handleCoverChange = async (file) => {
  uploadingCover.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    const res = await uploadCoverApi(formData)
    if (res && res.code) {
      addForm.coverImage = res.data
      ElMessage.success('头图上传成功')
    } else {
      ElMessage.error(res?.msg || '头图上传失败')
    }
  } catch (e) {
    ElMessage.error('头图上传失败')
  } finally {
    uploadingCover.value = false
  }
}
const handleWebglChange = async (file) => {
  webglFile.value = file.raw
  uploadingWebgl.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    const res = await uploadWebglApi(formData)
    if (res && res.code) {
      addForm.url = res.data
      ElMessage.success('WebGL文件上传成功')
    } else {
      ElMessage.error(res?.msg || '上传失败')
    }
  } catch (e) {
    ElMessage.error('WebGL文件上传失败')
  } finally {
    uploadingWebgl.value = false
  }
}

// 标签选项 = 固定标签 + 当前表单里来自数据库的标签, 保证编辑时数据库值不会被下拉框吞掉
const tagOptions = computed(() => {
  const set = new Set([...EXP_TAGS, addForm.tag, editForm.tag].filter(Boolean))
  return [...set]
})

// 打开新增对话框
const openAddDialog = () => {
  Object.assign(addForm, { title: '', tag: '', content: '', url: '', coverImage: '' })
  clearErrors()
  showAddDialog.value = true
}

// 打开修改对话框
// 编辑对话框: 一键更换头图 —— 上传到服务器 /img 后立即写库(update), 无需再点保存
const uploadingEditCover = ref(false)
const handleEditCoverChange = async (file) => {
  uploadingEditCover.value = true
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    const up = await uploadCoverApi(formData)
    if (!(up && up.code)) {
      ElMessage.error(up?.msg || '头图上传失败')
      return
    }
    const res = await updateExperimentApi({
      oldName: editForm.oldName,
      coverImage: up.data
    })
    if (res && res.code) {
      editForm.coverImage = up.data
      ElMessage.success('头图已更换并保存')
      await loadExperiments()
    } else {
      ElMessage.error(res?.msg || '头图保存失败')
    }
  } catch (e) {
    ElMessage.error('头图更换失败')
  } finally {
    uploadingEditCover.value = false
  }
}
const openEditDialog = (row) => {
  Object.assign(editForm, {
    oldName: row.title,
    title: row.title,
    tag: row.tag || '',
    content: row.content || '',
    url: row.url || '',
    coverImage: row.coverImage || ''
  })
  clearErrors()
  showEditDialog.value = true
}

const validate = (form) => {
  clearErrors()
  let isValid = true
  if (!form.title.trim()) {
    formErrors.title = '实验名称不能为空'
    isValid = false
  }
  if (!form.tag) {
    formErrors.tag = '请选择实验标签'
    isValid = false
  }
  return isValid
}

// 保存新增实验
const saveExperiment = async () => {
  if (!validate(addForm)) {
    ElMessage.warning('请完善表单信息')
    return
  }
  saving.value = true
  try {
    const res = await addExperimentApi({
      title: addForm.title,
      tag: addForm.tag,
      content: addForm.content,
      url: addForm.url,
      coverImage: addForm.coverImage
    })
    if (res && res.code) {
      ElMessage.success(`实验「${addForm.title}」新增成功`)
      showAddDialog.value = false
      await loadExperiments()
    } else {
      ElMessage.error(res?.msg || '新增失败')
    }
  } catch (error) {
    ElMessage.error('新增失败，请重试')
  } finally {
    saving.value = false
  }
}

// 保存修改实验
const saveEdit = async () => {
  if (!validate(editForm)) {
    ElMessage.warning('请完善表单信息')
    return
  }
  saving.value = true
  try {
    const res = await updateExperimentApi({
      oldName: editForm.oldName,
      name: editForm.title,
      createTime: null
    })
    if (res && res.code) {
      ElMessage.success(`实验「${editForm.title}」修改成功`)
      showEditDialog.value = false
      await loadExperiments()
    } else {
      ElMessage.error(res?.msg || '修改失败')
    }
  } catch (error) {
    ElMessage.error('修改失败，请重试')
  } finally {
    saving.value = false
  }
}

// 生命周期
onMounted(() => {
  loadExperiments()
})
</script>

<template>
  <div class="exp-manage-view">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1 class="page-title">实验资源管理</h1>
      <div class="header-buttons">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">增加实验</el-button>
        <el-button :icon="Refresh" @click="loadExperiments">刷新</el-button>
      </div>
    </div>

    <!-- 实验表格区域 -->
    <div class="table-section">
      <el-table :data="experiments" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="expId" label="ID" width="70" align="center" />
        <el-table-column label="头图" width="90" align="center">
          <template #default="{ row }">
            <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 56px; height: 36px; border-radius: 4px;" />
            <span v-else class="no-file">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="实验名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="content" label="实验描述" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.content || '未填写' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.tag" size="small" class="table-tag">{{ row.tag }}</el-tag>
            <span v-else class="no-file">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="likes" label="点赞" width="70" align="center" />
        <el-table-column prop="url" label="实验文件" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.url" class="file-url">{{ row.url }}</span>
            <span v-else class="no-file">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" @click="openEditDialog(row)">修改</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && experiments.length === 0" description="暂无实验资源" />
    </div>

    <!-- 新增实验对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="增加实验"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" label-width="90px" label-position="left">
        <el-form-item label="实验名称" required :error="formErrors.title">
          <el-input v-model="addForm.title" placeholder="输入实验名称" />
        </el-form-item>
        <el-form-item label="实验描述">
          <el-input v-model="addForm.content" type="textarea" :rows="2" placeholder="输入实验描述" />
        </el-form-item>
        <el-form-item label="实验标签" required :error="formErrors.tag">
          <el-select v-model="addForm.tag" placeholder="选择实验标签" style="width: 100%">
            <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="实验头图">
          <el-upload
            accept=".png,.jpg,.jpeg,.webp,.gif"
            :auto-upload="false"
            :limit="1"
            :show-file-list="false"
            :on-change="handleCoverChange">
            <el-button size="small" type="primary" plain :loading="uploadingCover">
              {{ uploadingCover ? '上传中...' : '上传实验头图' }}
            </el-button>
            <span class="upload-tip">存放于服务器 /img 文件夹，路径自动写入 coverImage</span>
          </el-upload>
        </el-form-item>
        <el-form-item label="实验文件">
          <el-input v-model="addForm.url" placeholder="上传WebGL文件自动生成, 或手动输入地址" />
          <el-upload
            class="webgl-upload"
            accept=".zip,.html,.wasm,.data,.js,.json,.png,.jpg"
            :auto-upload="false"
            :limit="1"
            :show-file-list="false"
            :on-change="handleWebglChange"
          >
            <el-button size="small" type="primary" plain :loading="uploadingWebgl">
              {{ uploadingWebgl ? '上传中...' : '上传WebGL文件' }}
            </el-button>
            <span class="upload-tip">上传后自动填入实验文件地址，存放于服务器独立文件夹</span>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveExperiment" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改实验对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="修改实验"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="90px" label-position="left">
        <el-form-item label="实验头图">
          <div class="cover-edit-row">
            <el-image v-if="editForm.coverImage" :src="editForm.coverImage" fit="cover"
              style="width: 96px; height: 60px; border-radius: 6px;" />
            <span v-else class="no-file">暂无头图</span>
            <el-upload
              accept=".png,.jpg,.jpeg,.webp,.gif"
              :auto-upload="false"
              :limit="1"
              :show-file-list="false"
              :on-change="handleEditCoverChange">
              <el-button size="small" type="primary" plain :loading="uploadingEditCover">
                {{ uploadingEditCover ? '更换中...' : '一键更换头图' }}
              </el-button>
            </el-upload>
            <span class="upload-tip">上传后立即保存到服务器并更新数据库</span>
          </div>
        </el-form-item>
        <el-form-item label="原名称">
          <el-input v-model="editForm.oldName" disabled />
        </el-form-item>
        <el-form-item label="实验名称" required :error="formErrors.title">
          <el-input v-model="editForm.title" placeholder="输入新的实验名称" />
        </el-form-item>
        <el-form-item label="实验描述">
          <el-input v-model="editForm.content" type="textarea" :rows="2" placeholder="输入实验描述" />
        </el-form-item>
        <el-form-item label="实验标签" required :error="formErrors.tag">
          <el-select v-model="editForm.tag" placeholder="选择实验标签" style="width: 100%">
            <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="实验文件">
          <el-input v-model="editForm.url" placeholder="输入后端实验文件地址(WebGL资源url)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.cover-edit-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.upload-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.exp-manage-view {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 页面标题区域 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

/* 表格区域 */
.table-section {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-tag {
  margin-right: 4px;
}

.file-url {
  color: #409eff;
}

.no-file {
  color: #909399;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .exp-manage-view {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .table-section {
    padding: 12px;
  }
}
</style>
