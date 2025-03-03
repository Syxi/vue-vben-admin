import { requestClient } from '#/api/request';

export interface OrganizationVO {
  /* 组织id */
  id?: string;

  /* 组织名称 */
  organName?: string;

  /* 组织编码 */
  organCode?: string;

  /* 组织类型 */
  organType?: number;

  /* 父节点id */
  parentId?: string;

  /* 父节点路径 */
  treePath?: string;

  /* 组织图标 */
  organImg?: string;

  /* 组织简介 */
  organIntroduction?: string;

  /* 组织联系电话 */
  organPhone?: string;

  /* 组织地址 */
  organAddress?: string;

  /* 备注 */
  remark?: string;

  /* 排序 */
  sort?: number;

  /* 状态 */
  status?: number;

  /* 创建时间 */
  createTime?: Date;

  /* 更新时间 */
  updateTime?: Date;

  /* 子组织 */
  children?: OrganizationVO[];
}

export interface OrganizationForm {
  /* 组织id */
  id?: string;

  /* 组织名称 */
  organName?: string;

  /* 组织编码 */
  organCode?: string;

  /* 组织类型 */
  organType?: number;

  /* 父节点id */
  parentId?: string;

  /* 父节点路径 */
  treePath?: string;

  /* 组织图标 */
  organImg?: string;

  /* 组织简介 */
  organIntroduction?: string;

  /* 组织联系电话 */
  organPhone?: string;

  /* 组织地址 */
  organAddress?: string;

  /* 备注 */
  remark?: string;

  /* 排序 */
  sort?: number;

  /* 状态 */
  status?: number;

  /* 创建时间 */
  createTime?: Date;

  /* 更新时间 */
  updateTime?: Date;
}

export interface OrganizationQuery {
  keyWord?: string;
}

/**
 *
 * @returns 组织树
 */
export async function orgTreeApi(organizationQuery: OrganizationQuery) {
  return requestClient.get<OrganizationVO[]>('/api/organization/tree', {
    params: organizationQuery,
  });
}

/**
 * 组织下拉树
 * @returns
 */
export async function orgOptionTreeApi() {
  return requestClient.get<OptionType[]>('/api/organization/option');
}

/**
 * 获取组织树详情
 * @param id
 * @returns
 */
export async function getOrgDetailApi(id: string) {
  return requestClient.get<OrganizationVO>(`/api/organization/detail/${id}`);
}

/**
 * 新增组织
 * @returns
 * @param organizationForm
 */
export async function addOrgApi(organizationForm: OrganizationForm) {
  return requestClient.post('/api/organization/add', organizationForm);
}

/**
 * 编辑组织
 */
export async function editOrgApi(organizationForm: OrganizationForm) {
  return requestClient.put('/api/organization/edit', organizationForm);
}

/**
 * 删除组织
 * @param id
 * @returns
 */
export async function deleteOrgApi(id: string) {
  return requestClient.delete(`/api/organization/${id}`);
}
