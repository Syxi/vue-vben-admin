import { Dictionary } from '#/components/dictionary';
import { ImageUpload } from '#/components/image-upload';
import { ImagesUpload } from '#/components/images-upload';
import { WangEditor } from '#/components/wang-editor/index';

// 注册自定义组件
export function registerComponents(app: any) {
  app.component('dictionary', Dictionary);
  app.component('image-upload', ImageUpload);
  app.component('images-upload', ImagesUpload);
  app.component('wang-editor', WangEditor);
}
