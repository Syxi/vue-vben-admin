import { requestClient } from '#/api/request';

/**
 * 文章查询对象
 */
export interface ArticleQuery extends PageQuery {
  title?: string;
  categoryName?: string;
  publish?: number;
}

/**
 * 文章表单
 * @returns
 */
export interface ArticleForm {
  articleId?: string;
  categoryName?: string;
  title?: string;
  author?: string;
  avatar?: string;
  introduction?: string;
  content?: string;
  readCount?: number;
  sort?: number;
  publish?: number;
  top?: number;
}

/**
 * 文章分页
 * @returns
 */
export interface ArticlePage {
  articleId: string;
  categoryName?: string;
  title?: string;
  author?: string;
  avatar?: string;
  introduction?: string;
  content?: string;
  readCount?: number;
  sort?: number;
  publish?: number;
  top?: number;
  createTime?: Date;
  updateTime?: Date;
}

/**
 * 文章分页类型声明
 */
export type ArticlePageResult = PageResult<ArticlePage[]>;

/**
 * 文章分页列表
 * @returns
 * @param articleQuery
 */
export async function selectArticlePageApi(articleQuery: ArticleQuery) {
  return requestClient.get<ArticlePageResult>('/api/article/page', {
    params: articleQuery,
  });
}

/**
 * 新增文章
 * @returns
 * @param articleForm
 */
export async function saveArticleApi(articleForm: ArticleForm) {
  return requestClient.post('/api/article/save', {
    data: articleForm,
  });
}

/**
 * 编辑文章
 * @returns
 * @param articleForm
 */
export async function updateArticleApi(articleForm: ArticleForm) {
  return requestClient.put('/api/article/update', {
    data: articleForm,
  });
}

/**
 * 文章详情
 * @returns
 * @param articleId
 */
export async function getArticleDetailApi(articleId: string) {
  return requestClient.get<ArticleForm>(`/api/article/detail/${articleId}`);
}

/**
 * 删除文章
 * @returns
 * @param articleIds
 */
export async function deleteArticleApi(articleIds: string[]) {
  return requestClient.delete('/api/article/delete', { data: articleIds });
}

/**
 * 门户首页阅读文章
 * @param articleId
 * @returns
 */
export async function readArticleApi(articleId: string) {
  return requestClient.get<ArticlePage>(
    `/api/article/portal/read/${articleId}`,
  );
}
