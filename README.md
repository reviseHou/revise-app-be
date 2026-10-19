# ReviseHOU Backend

Backend cho ứng dụng ôn tập ReviseHOU, gồm hai phần chạy chung một server NestJS:

| Phần | Đường dẫn | Dùng cho | Xác thực |
|---|---|---|---|
| **API** | `/api/*` | Ứng dụng frontend (React) | JWT Bearer token |
| **CMS** | `/cms/*` | Quản trị viên duyệt tài liệu, quản lý danh mục, người dùng | Session cookie |

Swagger của API: `/swagger`.

## Công nghệ

- NestJS 11, TypeScript, TypeORM, PostgreSQL 15
- CMS: Handlebars (`hbs`) render phía server, giao diện AdminLTE (Bootstrap 4), DataTables
- Đăng nhập Google OAuth (chỉ email `hou.edu.vn`), JWT cho API, `express-session` + `connect-pg-simple` cho CMS
- Upload tệp: multer + Cloudinary
- Chống CSRF: `csrf-sync`; thông báo: `connect-flash`

## Chạy dự án

### Yêu cầu
- Node.js 20 trở lên, pnpm 9
- Docker (để chạy PostgreSQL)

### Các bước

```bash
pnpm install
cp .env.example .env        # rồi điền giá trị, xem bảng bên dưới
docker compose up -d db     # bật PostgreSQL
pnpm dev                    # chạy ở chế độ watch
```

Trên Windows có thể chạy `start-dev.bat` (bật DB rồi chạy `pnpm dev`).

Sau khi chạy:
- CMS: http://localhost:4000/cms
- Swagger: http://localhost:4000/swagger

> Bảng trong DB do TypeORM tự tạo từ entity (`synchronize: true`), không cần chạy migration. Cấu hình này chỉ nên dùng khi phát triển.

### Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng server (mặc định 4000) |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Kết nối PostgreSQL |
| `SECRET_KEY` | Khoá ký access token (JWT) của API |
| `REFRESH_TOKEN_SECRET` | Khoá ký refresh token của API |
| `SESSION_SECRET` | Khoá ký cookie session của CMS. **Bắt buộc**, thiếu thì server không khởi động |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Đăng nhập Google |
| `FRONTEND_URL` | Địa chỉ frontend, nơi API chuyển hướng sau khi đăng nhập |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` | Upload tệp |

### Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy ở chế độ watch |
| `pnpm build` | Build ra `dist/` |
| `pnpm start:prod` | Chạy bản build |
| `pnpm lint` | ESLint (**có `--fix`**, tự sửa file) |
| `pnpm test` | Chạy test |

### Docker

`docker-compose.yml` gồm `db` (PostgreSQL), `api` (build từ `Dockerfile`) và `nginx` (cổng 8080). Khi deploy, nhớ đặt `SESSION_SECRET` và `NODE_ENV=production` (bật cookie `secure` và `trust proxy` cho CMS).

## Cấu trúc thư mục

```
src/
  main.ts                 Khởi động: session, view, CORS, Swagger, tiền tố /api
  app.module.ts           Module gốc, kết nối DB
  cms/                    Toàn bộ phần CMS
    controller/           Mỗi màn một controller (faculty, major, subject, document, user, role, permission, home, login)
    view/                 Giao diện .html (Handlebars)
      template/           Khung trang: default, header, sidebar, footer
      fragment/           Mảnh dùng lại: alert, phân trang, badge trạng thái
    config/               session.config.ts, view.config.ts
    util/                 cms.helper.ts, csrf.ts
    static/resources/     AdminLTE, jQuery, DataTables, cms.js, cms.css
    cms.decorator.ts      @CmsController, @CmsView, @CmsAction
    cms-session.guard.ts  Kiểm tra đã đăng nhập
    csrf.guard.ts         Kiểm tra CSRF cho POST
    flash-redirect.interceptor.ts  Chuyển hướng kèm thông báo
    error.filter.ts       Xử lý lỗi của CMS
    cms.permission.ts     Danh sách tên quyền
  domain/                 Nghiệp vụ và dữ liệu
    <tên>/entity/         Entity (bảng DB)
    <tên>/dto/            DTO (kiểm tra dữ liệu vào của API)
    <tên>/*.service.ts    Logic của API
    <tên>/*.bean.ts       Logic của CMS
    auth/, upload/        Đăng nhập, upload
    forms.ts              Kiểu dữ liệu form của CMS
    enums.ts              Trạng thái (ACTIVE, INACTIVE, PENDING, REJECTED)
```

## Hai phần API và CMS

- API và CMS dùng chung **entity**, `auth.module/service/controller`, `PermissionsGuard`, `@Permissions`, `main.ts` và `app.module.ts`. Sửa các file này sẽ ảnh hưởng cả hai.
- Logic riêng của CMS nằm trong `*.bean.ts`, logic riêng của API nằm trong `*.service.ts`.

## Luồng CMS

### Đăng nhập
1. Vào `/cms/login`, bấm đăng nhập bằng Google (`/api/auth/google?from=cms`).
2. Google gọi lại `/api/auth/google/callback`. Nhánh CMS kiểm tra email trường, tìm hoặc tạo user, rồi lưu `userId` vào session.
3. Tài khoản có vai trò `STUDENT` không được vào CMS.

### Mỗi request vào trang CMS
1. Session middleware đọc cookie `cms.sid` và nạp session từ DB (bảng `cms_sessions`).
2. `CmsSessionGuard` nạp user kèm vai trò và quyền. Chưa đăng nhập thì chuyển về `/cms/login`.
3. `CsrfGuard`: mọi POST phải có trường ẩn `_csrf` đúng.
4. `PermissionsGuard`: kiểm tra quyền khai báo ở `@CmsView` / `@CmsAction`. Quyền `*` được vào mọi nơi.
5. Controller gọi bean, trả dữ liệu cho view hoặc chuyển hướng.
6. Lỗi đi qua `CmsErrorFilter`.

### Thông báo
Sau thao tác, `FlashRedirectInterceptor` lưu thông báo thành công hoặc lỗi vào session (`connect-flash`) rồi chuyển hướng. Trang kế tiếp hiển thị một lần.

### Phân trang
Mặc định 10 dòng mỗi trang. Danh sách người dùng và tài liệu phân trang phía server (`PAGE_SIZE` trong `src/domain/paging.ts`). Các danh sách còn lại dùng DataTables phía client (`pageLength` trong `cms.js`).

## Thêm một màn mới vào CMS

Ví dụ thêm màn `course`:

1. Thêm quyền trong `src/cms/cms.permission.ts`, ví dụ `READ_COURSE`, `CREATE_COURSE`.
2. Tạo entity `src/domain/course/entity/course.entity.ts` và đăng ký vào `domain.module.ts`.
3. Tạo `src/domain/course/course.bean.ts` chứa logic truy vấn và kiểm tra dữ liệu.
4. Tạo `src/cms/controller/course.controller.ts`:

```ts
@CmsController('cms/courses')
export class CourseController {
  constructor(private readonly courseBean: CourseBean) {}

  @Get()
  @CmsView(CmsPermission.READ_COURSE, 'course/list')
  async showList() {
    return { courses: await this.courseBean.findAll() };
  }

  @Post()
  @CmsAction(CmsPermission.CREATE_COURSE, { to: '/cms/courses', onError: '/cms/courses/create' })
  async create(@Body() form: CourseForm) {
    const course = await this.courseBean.create(form);
    return `Đã tạo khoá học ${course.title}`;
  }
}
```

5. Tạo `src/cms/view/course/list.html` và `form.html`. Mọi `<form method="post">` phải có `<input type="hidden" name="_csrf" value="{{@root.csrfToken}}">`.
6. Đăng ký controller trong `cms.module.ts` và thêm mục vào `view/template/sidebar.html`.
7. Gán quyền mới cho vai trò trong trang **Vai trò** của CMS.

`@CmsAction` trả về chuỗi thì đó là thông báo thành công. Ném lỗi (ví dụ `BadRequestException`) thì chuyển hướng về `onError` kèm thông báo lỗi. Trong URL có thể dùng `:id` để lấy từ tham số của route.

## Phân quyền

- Mỗi vai trò (`roles`) có nhiều quyền (`permissions`). Tên quyền dùng ở `@CmsView`, `@CmsAction` và API `@Permissions`.
- Quyền `*` cho phép mọi thao tác. Vai trò `ADMIN` thường có quyền này.
- Quản lý vai trò và quyền ngay trong CMS ở mục **Vai trò** và **Quyền**.

## Lưu ý khi phát triển

- `pnpm lint` có `--fix` nên tự sửa file. Dùng `npx eslint <file>` nếu chỉ muốn xem lỗi.
- Hiện còn nhiều cảnh báo ESLint `no-unsafe-*` ở các file auth và service (do dùng kiểu `any`). Đây là cảnh báo kiểu, không ảnh hưởng chạy.
- Trên Node 24, `pnpm` 9.15.9 có thể lỗi khi chạy script cài đặt. Dùng `pnpm install --ignore-scripts` nếu gặp.
