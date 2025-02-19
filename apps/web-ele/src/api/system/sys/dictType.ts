import { requestClient } from '#/api/request';

/**
 * 字典类型查询对象
 */
export interface DictTypeQuery extends PageQuery {
  name?: string;
  typeCode?: string;
}

/**
 * 字典类型表达对象
 * @returns
 */
export interface DictTypeForm {
  typeCode?: string;
  id?: string;
  name?: string;
  sort?: number;
  remark?: string;
  status?: number;
}

/**
 * 字典类型分页
 * @returns
 */
export interface DictTypePage {
  typeCode: string;
  id: string;
  name: string;
  sort?: number;
  remark?: string;
  status?: number;
}

/**
 * 字典分页类型声明
 */
export type DictTypePageResult = PageResult<DictTypePage[]>;

/**
 * 字典类型分页列表
 * @returns
 * @param dictTypeQuery
 */
export async function selectDictTypePageApi(dictTypeQuery?: DictTypeQuery) {
  return requestClient.get<DictTypePageResult>('/api/dictType/page', {
    params: dictTypeQuery,
  });
}

/**
 * 新增字典类型
 * @returns
 * @param dictTypeForm
 */
export async function addDictTypeApi(dictTypeForm: DictTypeForm) {
  return requestClient.post('/api/dictType/add', {
    data: dictTypeForm,
  });
}

/**
 * 编辑字典类型
 * @returns
 * @param dictTypeForm
 */
export async function editDictTypeApi(dictTypeForm: DictTypeForm) {
  return requestClient.put('/api/dictType/edit', {
    data: dictTypeForm,
  });
}

/**
 * 字典详情
 * @param id
 * @returns
 */
export async function getDictTypeDetailApi(id: string) {
  return requestClient.get<DictTypeForm>(`/api/dictType/detail/${id}`);
}

/**
 * 删除字典
 * @returns
 * @param ids
 */
export async function deleteDictTypeApi(ids: string[]) {
  return requestClient.delete('/api/dictType/delete', {
    data: ids,
  });
}
