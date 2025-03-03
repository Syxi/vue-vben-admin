import { requestClient } from '#/api/request';

/**
 * 字典类型查询对象
 */
export interface DictValueQuery extends PageQuery {
  name?: string;
  typeCode?: string;
}

export interface DictValueForm {
  name?: string;
  value?: string;
  id?: string;
  remark?: string;
  sort?: number;
  status?: number;
  typeCode?: string;
}

export interface DictValuePage {
  name?: string;
  value?: string;
  id?: string;
  remark?: string;
  sort?: number;
  status?: number;
  typeCode?: string;
}

export type DictValuePageResult = PageResult<DictValuePage[]>;

/**
 * 字典项分页列表
 * @returns
 * @param dictValueQuery
 */
export async function selectDictValuePageApi(dictValueQuery: DictValueQuery) {
  return requestClient.get<DictValuePageResult>('/api/dictValue/page', {
    params: dictValueQuery,
  });
}

/**
 * 字典项下拉选项
 * @returns
 */
export async function dictValueOptionApi(typeCode: string) {
  return requestClient.get<DictValueForm>(`/api/dictValue/option/${typeCode}`);
}

/**
 * 新增字典项
 * @returns
 * @param dictValueForm
 */
export async function addDictValueApi(dictValueForm: DictValueForm) {
  return requestClient.post('/api/dictValue/add', dictValueForm);
}

/**
 * 编辑字典项
 * @returns
 * @param dictValueForm
 */
export async function editDictValueApi(dictValueForm: DictValueForm) {
  return requestClient.put('/api/dictValue/edit', dictValueForm);
}

/**
 * 删除字典项
 * @returns
 * @param ids
 */
export async function deleteDictValuesApi(ids: string[]) {
  return requestClient.delete('/api/dictValue/delete', ids);
}

/**
 * 字典项详情
 * @param {number} id id
 * @returns
 */
export async function getDictValueDetailApi(id: string) {
  return requestClient.get<DictValueForm>(`/api/dictValue/detail/${id}`);
}

/**
 * 字典下拉选项
 * @param typeCode
 */
export async function getDictOptionsApi(typeCode: string) {
  return requestClient.get<OptionType[]>(`/api/dictValue/option/${typeCode}`);
}
