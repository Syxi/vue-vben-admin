<script setup lang="ts">
import type { MenuForm, MenuQuery, MenuVO } from '#/api/system/sys/menu';

import { onMounted, reactive, ref } from 'vue';

import { IconPicker } from '@vben/common-ui';

import { Refresh } from '@element-plus/icons-vue';
import { Icon } from '@iconify/vue';
import { ElForm, ElMessage, ElMessageBox } from 'element-plus';

import {
  addMenuApi,
  deleteMenuApi,
  editMenuApi,
  getMenuDetailApi,
  menuOptionApi,
  selectMenuTreeApi,
} from '#/api/system/sys/menu';
import { MenuTypeEnum } from '#/enums/MenuTypesEnum';

defineOptions({
  name: 'Menu',
  inheritAttrs: false,
});

const queryFormRef = ref(ElForm);

const menuFormRef = ref(ElForm);

const loading = ref(false);

const dialog = reactive({
  title: '',
  visible: false,
});

// 查询参数
const queryParams = reactive<MenuQuery>({});

// 菜单表格数据
const menuTableData = ref<MenuVO[]>([]);

// 顶级菜单下拉选项
const menuOptionData = ref<OptionType[]>([]);

// 初始化菜单表单数据
const initialMenuFormData = ref<MenuForm>({
  menuId: undefined,
  parentId: '0',
  status: 1,
  menuType: MenuTypeEnum.MENU,
});

// 菜单表单数据
const formData = ref({ ...initialMenuFormData.value });

// 表单验证规则
const rules = reactive({
  parentId: [{ required: true, message: '请选择顶级菜单', trigger: 'blur' }],
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  menuType: [{ required: true, message: '请输入菜单类型', trigger: 'blur' }],
  routePath: [{ required: true, message: '请输入路由路径', trigger: 'blue' }],
  component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
});

// 选择表格的行菜单id
const selectedRowMenuId = ref<string | undefined>();

const buttonIcon = 'mdi:feather';

/**
 * 查询
 */
function handleQuery() {
  // 重置组件
  loading.value = true;
  selectMenuTreeApi(queryParams)
    .then((data) => {
      menuTableData.value = data;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function handleResetQuery() {
  queryFormRef.value.resetFields();
  handleQuery();
}

// 行点击事件
function onRowClick(row: MenuVO) {
  selectedRowMenuId.value = row.menuId;
}

/**
 * 打开表单窗口
 * @param parentId 父菜单id
 * @param menuId 菜单id
 */
async function handleDialogOpen(parentId?: string, menuId?: string) {
  dialog.visible = true;
  // 菜单下拉选项树
  await menuOptionTree();
  if (menuId) {
    dialog.title = '编辑菜单';
    const data = await getMenuDetailApi(menuId);
    initialMenuFormData.value = { ...data };
    formData.value = data;
  } else {
    dialog.title = '新增菜单';
    formData.value.parentId = parentId;
  }
}

/**
 * 关闭弹窗
 */
function closeDialog() {
  dialog.visible = false;
  resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
  menuFormRef.value.resetFields();
  menuFormRef.value.clearValidate();
  formData.value.menuId = undefined;
}

/**
 * 菜单类型切换事件处理
 */
function onMenuTypeChange() {
  // 如果菜单类型改变，清空路由路径，未改变在切换后还原路由路径
  if (
    formData.value.menuType !== initialMenuFormData.value.menuType &&
    formData.value.menuType === MenuTypeEnum.MENU
  ) {
    // 目录切换到菜单时，清空组件
    if (initialMenuFormData.value.menuType === MenuTypeEnum.CATALOG) {
      formData.value.routePath = '';
    } else {
      // 其他情况，保留原有的组件路径
      formData.value.routePath = initialMenuFormData.value.routePath;
      formData.value.component = initialMenuFormData.value.component;
    }
  }
}

/**
 * 提交表单
 */
function submitForm() {
  menuFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      const menuId = formData.value.menuId;
      if (menuId) {
        // 编辑菜单
        editMenuApi(formData.value).then(() => {
          ElMessage.success('修改菜单成功');
          closeDialog();
          handleQuery();
        });
      } else {
        // 新增菜单
        addMenuApi(formData.value).then(() => {
          ElMessage.success('新增菜单成功');
          closeDialog();
          handleQuery();
        });
      }
    }
  });
}

/**
 * 删除菜单
 */
function handleDelete(menuId: string) {
  if (!menuId) {
    ElMessage.warning('请勾选删除项');
    return false;
  }

  ElMessageBox.confirm('确定删除已选中的数据项?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteMenuApi(menuId).then(() => {
        ElMessage.success('删除成功');
        handleQuery();
      });
    })
    .catch(() => ElMessage.info('已取消删除'));
}

/**
 * 菜单下拉选项树
 */
async function menuOptionTree() {
  const data = await menuOptionApi();
  menuOptionData.value = data;
  menuOptionData.value = [{ value: '0', label: '顶级菜单', children: data }];
}

onMounted(() => {
  handleQuery();
  menuOptionTree();
});
</script>

<template>
  <div class="app-container">
    <div class="search-container">
      <ElForm ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item prop="menuName">
          <el-input
            v-model="queryParams.menuName"
            placeholder="菜单名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            搜索
          </el-button>

          <el-button type="primary" @click="handleResetQuery">
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>

          <el-button
            v-access:code="['sys:menu:add']"
            type="primary"
            @click="handleDialogOpen('0')"
          >
            <template #icon>
              <el-icon><Plus /></el-icon>
            </template>
            新增菜单
          </el-button>
        </el-form-item>
      </ElForm>
    </div>

    <el-card shadow="never" class="table-container">
      <el-table
        v-loading="loading"
        :data="menuTableData"
        highlight-current-row
        row-key="menuId"
        :expand-row-keys="['1']"
        @row-click="onRowClick"
        :tree-props="{
          children: 'children',
          hasChildren: 'hasChildren',
        }"
      >
        <el-table-column label="菜单名称" min-width="100">
          <template #default="scope">
            <span class="icon size-4">
              <Icon
                :icon="scope.row.icon ? scope.row.icon : buttonIcon"
                class="size-full"
              />
            </span>
            {{ scope.row.menuName }}
          </template>
        </el-table-column>

        <el-table-column label="类型" align="center" width="120">
          <template #default="scope">
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.CATALOG"
              type="primary"
            >
              目录
            </el-tag>
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.MENU"
              type="success"
            >
              菜单
            </el-tag>
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.BUTTON"
              type="danger"
            >
              按钮
            </el-tag>
            <el-tag
              v-if="scope.row.menuType === MenuTypeEnum.EXTLINK"
              type="info"
            >
              外链
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          label="路由名称"
          align="left"
          width="150"
          prop="routeName"
        />

        <el-table-column
          label="路由路径"
          align="left"
          width="150"
          prop="routePath"
        />

        <el-table-column
          label="组件路径"
          align="left"
          width="300"
          prop="component"
        />

        <el-table-column
          label="权限标识"
          align="center"
          width="200"
          prop="perm"
        />

        <el-table-column label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 1" type="success">显示</el-tag>
            <el-tag v-else type="info">隐藏</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="排序" align="center" width="80" prop="sort" />

        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="scope">
            <el-button
              v-if="
                scope.row.menuType === 'CATALOG' ||
                scope.row.menuType === 'MENU'
              "
              v-access:code="['sys:menu:add']"
              type="primary"
              link
              size="small"
              @click.stop="handleDialogOpen(scope.row.menuId, undefined)"
            >
              <el-icon><Plus /></el-icon>
              新增
            </el-button>

            <el-button
              v-access:code="['sys:menu:edit']"
              type="primary"
              link
              size="small"
              @click.stop="handleDialogOpen(undefined, scope.row.menuId)"
            >
              <el-icon><Edit /></el-icon>编辑
            </el-button>

            <el-button
              v-access:code="['sys:menu:delete']"
              type="primary"
              link
              size="small"
              @click.stop="handleDelete(scope.row.menuId)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog
      draggable
      v-model="dialog.visible"
      :title="dialog.title"
      destroy-on-close
      width="800px"
      center
      @close="closeDialog"
      :z-index="100"
    >
      <ElForm
        ref="menuFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            placeholder="选择上级菜单"
            v-model="formData.parentId"
            :data="menuOptionData"
            filterable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
        </el-form-item>

        <el-form-item>
          <el-radio-group
            v-model="formData.menuType"
            @change="onMenuTypeChange"
          >
            <el-radio value="CATALOG">目录</el-radio>
            <el-radio value="MENU">菜单</el-radio>
            <el-radio value="BUTTON">按钮</el-radio>
            <el-radio value="EXTLINK">外链</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.menuType === MenuTypeEnum.EXTLINK"
          label="外链"
          prop="routePath"
        >
          <el-input
            v-model="formData.routePath"
            placeholder="请输入外链完整路径"
          />
        </el-form-item>

        <el-form-item
          v-if="formData.menuType === MenuTypeEnum.MENU"
          prop="routeName"
        >
          <template #label>
            <div>
              路由名称
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  如果需要开启缓存，需保证页面 defineOptions 中的 name
                  与此处一致，建议使用驼峰。
                </template>
                <i-ep-QuestionFilled class="inline-block" />
              </el-tooltip>
            </div>
          </template>
          <el-input v-model="formData.routeName" placeholder="User" />
        </el-form-item>

        <el-form-item
          v-if="
            formData.menuType === MenuTypeEnum.CATALOG ||
            formData.menuType === MenuTypeEnum.MENU
          "
          label=""
          prop="routePath"
        >
          <template #label>
            <div>
              路由路径
              <el-tooltip placement="bottom" effect="light">
                <template>
                  定义应用中不同页面对应的 url 路径, 目录需要以 / 开头，
                  菜单项不可用。例如：系统管理目录 /system,
                  系统管理下的用户管理菜单 user。
                </template>
                <i-ep-QuestionFilled class="inline-block" />
              </el-tooltip>
            </div>
          </template>
          <el-input
            v-if="formData.menuType === MenuTypeEnum.CATALOG"
            v-model="formData.routePath"
            placeholder="system"
          />
          <el-input v-else v-model="formData.routePath" placeholder="user" />
        </el-form-item>

        <!-- 组件页面完整路径 -->
        <el-form-item
          v-if="formData.menuType === MenuTypeEnum.MENU"
          prop="component"
        >
          <template #label>
            <div>
              组件路径
              <el-tooltip placement="bottom" effect="light">
                <template>
                  组件页面完整路径，相对于 src/views/, 如
                  system/user/index,缺省后缀 .vue
                  <i-ep-QuestionFilled class="inline-block" />
                </template>
              </el-tooltip>
            </div>
          </template>
          <el-input
            v-model="formData.component"
            placeholder="system/user/index"
            style="width: 95%"
          >
            <template v-if="formData.menuType === MenuTypeEnum.MENU" #prepend>
              src/views/
            </template>
            <template v-if="formData.menuType === MenuTypeEnum.MENU" #append>
              .vue
            </template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="formData.menuType === MenuTypeEnum.MENU">
          <template #label>
            <div>
              路由参数
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  组件页面使用 `useRoute().query.参数名` 获取路由参数值。
                </template>
                <i-ep-QuestionFilled class="inline-block" />
              </el-tooltip>
            </div>
          </template>

          <div v-if="!formData.params || formData.params.length === 0">
            <el-button
              type="success"
              plain
              @click="formData.params = [{ key: '', value: '' }]"
            >
              添加路由参数
            </el-button>
          </div>

          <div v-else>
            <div v-for="(item, index) in formData.params" :key="index">
              <el-input
                v-model="item.key"
                placeholder="参数名"
                class="w-[100px]"
              />

              <span class="mx-1">=</span>

              <el-input
                v-model="item.value"
                placeholder="参数值"
                class="w-[100px]"
              />

              <el-icon
                class="color-[var(--el-color-success)] ml-2 cursor-pointer"
                style="vertical-align: -0.15em"
                v-if="
                  formData.params.indexOf(item) === formData.params.length - 1
                "
                @click="formData.params.push({ key: '', value: '' })"
              >
                <CirclePlusFilled />
              </el-icon>
              <el-icon
                class="color-[var(--el-color-danger)] ml-2 cursor-pointer"
                style="vertical-align: -0.15em"
                @click="
                  formData.params.splice(formData.params.indexOf(item), 1)
                "
              >
                <DeleteFilled />
              </el-icon>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="菜单状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="-1">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="
            formData.menuType === MenuTypeEnum.CATALOG ||
            formData.menuType === MenuTypeEnum.MENU
          "
          label="根目录始终显示"
        >
          <template #label>
            <div>
              是否始终显示
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  当设置为始终显示时，即使只有一个子菜单也会显示
                </template>
                <i-ep-QuestionFilled class="inline-block" />
              </el-tooltip>
            </div>
          </template>

          <el-radio-group v-model="formData.alwaysShow">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="-1">否</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="formData.menuType === MenuTypeEnum.MENU"
          label="是否缓存"
        >
          <el-radio-group v-model="formData.keepAlive">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="-1">否</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>

        <!--  v-if="formData.menuType == MenuTypeEnum.BUTTON
          || formData.menuType == MenuTypeEnum.MENU" -->
        <el-form-item
          label="权限标识"
          prop="perm"
          v-if="formData.menuType === MenuTypeEnum.BUTTON"
        >
          <el-input v-model="formData.perm" placeholder="sys:user:add" />
        </el-form-item>

        <el-form-item
          v-if="formData.menuType !== MenuTypeEnum.BUTTON"
          label="图标"
          prop="icon"
        >
          <IconPicker v-model="formData.icon" />
        </el-form-item>

        <el-form-item
          v-if="formData.menuType === MenuTypeEnum.CATALOG"
          label="跳转路由"
        >
          <el-input v-model="formData.redirect" placeholder="跳转路由" />
        </el-form-item>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="closeDialog">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.icon {
  display: inline-block;
  overflow: hidden;
  vertical-align: -0.2em; /* 因icon大小被设置为和字体大小一致，而span等标签的下边缘会和字体的基线对齐，故需设置一个往下的偏移比例，来纠正视觉上的未对齐效果 */
  outline: none;
}
</style>
