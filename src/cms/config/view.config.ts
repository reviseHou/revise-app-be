import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import helpers from 'handlebars-helpers';
import { PAGE_SIZE } from 'src/domain/paging';
import type { CmsRequest } from '../util/cms.helper';

const PAGES_SHOWN_EACH_SIDE = 3;

type BlockOptions = {
  fn: (context: unknown) => string;
  data: { root: { blocks?: Record<string, string> } };
};

export function setupViews(app: NestExpressApplication) {
  const viewDirectory = join(__dirname, '..', 'view');

  app.engine('html', hbs.__express.bind(hbs));
  app.setBaseViewsDir(viewDirectory);
  app.setViewEngine('html');
  app.set('view options', { layout: 'template/default' });
  app.useStaticAssets(join(__dirname, '..', 'static', 'resources'), {
    prefix: '/cms/resources',
  });
  hbs.registerPartials(join(viewDirectory, 'template'));
  hbs.registerPartials(join(viewDirectory, 'fragment'));

  helpers({ handlebars: hbs.handlebars });
  registerLayoutHelpers();
  registerListHelpers();
  registerFileHelpers();
  app.use('/cms', shareRequestWithViews);
}

function shareRequestWithViews(
  request: CmsRequest,
  response: { locals: Record<string, unknown> },
  next: () => void,
) {
  const [path, queryText] = request.originalUrl.split('?');
  const otherParams = new URLSearchParams(queryText);
  otherParams.delete('page');
  const otherQuery = otherParams.toString();

  response.locals.path = path;
  response.locals.pageBase = `${path}?${otherQuery}${otherQuery ? '&' : ''}`;
  response.locals.pageSize = PAGE_SIZE;
  response.locals.info = request.session.info;
  delete request.session.info;
  Object.defineProperty(response.locals, 'user', {
    enumerable: true,
    get: () => request.user,
  });
  next();
}

function registerLayoutHelpers() {
  hbs.registerHelper(
    'extend',
    function (this: unknown, name: string, options: BlockOptions) {
      const root = options.data.root;
      root.blocks = { ...root.blocks, [name]: options.fn(this) };
    },
  );
  hbs.registerHelper(
    'block',
    (name: string, options: BlockOptions) =>
      options.data.root.blocks?.[name] ?? '',
  );
}

const OFFICE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

const extensionOf = (url: string) =>
  url.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';

function registerFileHelpers() {
  hbs.registerHelper('previewUrl', (url: string) =>
    OFFICE_EXTENSIONS.includes(extensionOf(url))
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
      : url,
  );
  hbs.registerHelper('isImageFile', (url: string) =>
    IMAGE_EXTENSIONS.includes(extensionOf(url)),
  );
}

function registerListHelpers() {
  hbs.registerHelper(
    'userCountOf',
    (rows: { roleId: number | null; count: number }[], roleId: number) =>
      rows.find((row) => row.roleId === roleId)?.count ?? 0,
  );
  hbs.registerHelper('pageNumbers', (page: number, total: number) => {
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const firstShown = Math.max(1, page - PAGES_SHOWN_EACH_SIDE);
    const lastShown = Math.min(lastPage, page + PAGES_SHOWN_EACH_SIDE);
    const numbers: { number: number; active: boolean }[] = [];
    for (let number = firstShown; number <= lastShown; number++) {
      numbers.push({ number, active: number === page });
    }
    return numbers;
  });
}
