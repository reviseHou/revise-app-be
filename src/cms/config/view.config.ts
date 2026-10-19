import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import helpers from 'handlebars-helpers';
import { PAGE_SIZE } from 'src/domain/paging';
import type { CmsRequest } from '../util/cms.helper';
import { generateToken } from '../util/csrf';

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
  app.use('/cms', shareRequestWithViews);
}

function shareRequestWithViews(
  request: CmsRequest,
  response: { locals: Record<string, unknown> },
  next: () => void,
) {
  const [path, queryText] = request.originalUrl.split('?');
  const otherParams = new URLSearchParams(queryText);
  ['page', 'success', 'error'].forEach((name) => otherParams.delete(name));
  const otherQuery = otherParams.toString();

  response.locals.path = path;
  response.locals.pageBase = `${path}?${otherQuery}${otherQuery ? '&' : ''}`;
  response.locals.pageSize = PAGE_SIZE;
  Object.defineProperty(response.locals, 'alert', {
    enumerable: true,
    get: () => readAlert(request),
  });
  Object.defineProperty(response.locals, 'csrfToken', {
    enumerable: true,
    get: () => generateToken(request),
  });
  Object.defineProperty(response.locals, 'user', {
    enumerable: true,
    get: () => request.user,
  });
  next();
}

function readAlert(request: CmsRequest) {
  const fromQuery = (name: string) => {
    const value = request.query[name];
    return typeof value === 'string' ? value : '';
  };
  return {
    success: request.flash('success')[0] ?? fromQuery('success'),
    error: request.flash('error')[0] ?? fromQuery('error'),
  };
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

function registerListHelpers() {
  hbs.registerHelper('percent', (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 100) : 0,
  );
  hbs.registerHelper(
    'userCountOf',
    (rows: { roleId: number | null; count: number }[], roleId: number) =>
      rows.find((row) => row.roleId === roleId)?.count ?? 0,
  );
  hbs.registerHelper(
    'hasPermission',
    (permissions: { id: number }[], permissionId: number) =>
      permissions.some((permission) => permission.id === permissionId),
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
