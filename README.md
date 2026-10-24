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
- Đăng nhập Google OAuth (chỉ email `hou.edu.vn`), JWT cho API, `express-session` + `connect-pg-simple` cho CMS (session lưu ở bảng `cms_sessions`, tự tạo)
- Upload tệp: multer, đẩy lên Cloudinary qua REST API
- Thông báo sau thao tác trên CMS: lưu tạm trong session (`session.info`)

## Chạy dự án lần đầu

Làm lần lượt từ trên xuống. Bỏ bước nào thường sẽ không đăng nhập được.

### 1. Cần cài sẵn

- Node.js 20 trở lên. Bật pnpm bằng `corepack enable` (hoặc dùng `npx pnpm@9.15.9` thay cho `pnpm`)
- Docker Desktop (để chạy PostgreSQL)
- Một **Google OAuth Client** trên [Google Cloud Console](https://console.cloud.google.com/apis/credentials): loại *Web application*, thêm *Authorized redirect URI* là `http://localhost:4000/api/auth/google/callback`
- Một tài khoản **Cloudinary** (lấy Cloud name, API key, API secret ở trang Dashboard) để upload tệp

### 2. Cài thư viện và tạo `.env`

```bash
pnpm install
cp .env.example .env
```

Mở `.env` và điền (giải thích từng biến ở bảng bên dưới):

```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=revise-app

SECRET_KEY=<chuỗi ngẫu nhiên bất kỳ>
REFRESH_TOKEN_SECRET=<chuỗi ngẫu nhiên khác>
SESSION_SECRET=<chuỗi ngẫu nhiên khác>

GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=revise-hou
```

### 3. Bật PostgreSQL

```bash
docker compose up -d db
```

> Chỉ bật service `db`. Đừng chạy `docker compose up -d` không kèm tên service khi đang code: lệnh đó bật cả `api` và `nginx`, và nếu máy đã có image `api` build từ code cũ thì nó chạy bản cũ (xem mục [Docker](#docker)).

### 4. Chạy server lần đầu để tạo bảng

```bash
pnpm dev
```

Đợi đến dòng `CMS: http://localhost:4000/cms` là TypeORM đã tự tạo toàn bộ bảng từ entity (`synchronize: true`, không cần migration). Tắt server (Ctrl + C) rồi làm bước 5.

### 5. Thêm dữ liệu ban đầu vào DB

DB mới chưa có vai trò, quyền và tài khoản quản trị nên chưa ai vào được CMS. Mở công cụ SQL vào DB `revise-app`, ví dụ:

```bash
docker exec -it course-db psql -U postgres -d revise-app
```

(hoặc dùng DBeaver / pgAdmin: host `localhost`, cổng `5432`, user và mật khẩu như trong `.env`).

Tên bảng và cột đều là snake_case số ít, đúng theo diagram: `"user"`, `role`, `permission`, `role_permission`, ... Bảng `user` trùng từ khoá của PostgreSQL nên luôn viết trong ngoặc kép `"user"`.

**5.1. Tạo 3 vai trò**

| Vai trò | Dùng cho |
|---|---|
| `ADMIN` | Quản trị viên, được gán đủ mọi quyền (vào mọi màn CMS) |
| `USER` | Gán tự động cho mọi tài khoản đăng nhập web lần đầu. Không vào được CMS |
| `LECTURER` | Giảng viên. Vào CMS để xem danh mục và duyệt tài liệu, bài kiểm tra (quyền gán ở bước 5.3) |

```sql
INSERT INTO role (code, name)
SELECT v.code, v.name FROM (VALUES
    ('ADMIN', 'Quản trị viên'), ('USER', 'Người dùng'), ('LECTURER', 'Giảng viên')
) AS v(code, name)
WHERE NOT EXISTS (SELECT 1 FROM role r WHERE r.code = v.code);
```

**5.2. Tạo danh sách quyền**

Mã quyền (`code`) phải khớp `src/cms/util/cms.permission.ts`. Không có quyền "tất cả": vai trò nào được làm gì thì gán đúng mã quyền đó.

```sql
INSERT INTO permission (code, name)
SELECT v.code, v.code FROM (VALUES
    ('READ_STATISTICS'),
    ('READ_FACULTY'), ('CREATE_FACULTY'), ('UPDATE_FACULTY'),
    ('READ_MAJOR'), ('CREATE_MAJOR'), ('UPDATE_MAJOR'),
    ('READ_SUBJECT'), ('CREATE_SUBJECT'), ('UPDATE_SUBJECT'),
    ('READ_DOCUMENT'), ('REVIEW_DOCUMENT'),
    ('READ_QUIZ'), ('REVIEW_QUIZ'),
    ('READ_USER'), ('ASSIGN_ROLE'),
    ('READ_ROLE'), ('CREATE_ROLE'), ('UPDATE_ROLE'), ('DELETE_ROLE'),
    ('READ_PERMISSION'), ('CREATE_PERMISSION')
) AS v(code)
WHERE NOT EXISTS (SELECT 1 FROM permission p WHERE p.code = v.code);
```

Cột `name` có thể sửa lại thành tên tiếng Việt dễ đọc trên CMS.

**5.3. Gán quyền cho `ADMIN` và `LECTURER`**

`ADMIN` có tất cả quyền. `LECTURER` xem danh mục, xem thống kê và duyệt tài liệu, bài kiểm tra; không tạo/sửa danh mục, không quản lý người dùng, vai trò, quyền.

```sql
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r JOIN permission p ON
     r.code = 'ADMIN'
  OR (r.code = 'LECTURER' AND p.code IN (
        'READ_STATISTICS', 'READ_FACULTY', 'READ_MAJOR', 'READ_SUBJECT',
        'READ_DOCUMENT', 'REVIEW_DOCUMENT', 'READ_QUIZ', 'REVIEW_QUIZ'))
WHERE NOT EXISTS (
    SELECT 1 FROM role_permission rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
```

**5.4. Tạo tài khoản quản trị**

Id của người dùng là mã tài khoản Google (Google `sub`), chỉ có khi người đó đăng nhập, nên không tạo trước bằng SQL được. Làm như sau:

1. Chạy server (bước 6), vào http://localhost:4000/cms → *Đăng nhập bằng Google* bằng email `hou.edu.vn` **của bạn**. Lần này sẽ báo "Tài khoản không có quyền vào CMS", nhưng tài khoản đã được tạo với vai trò `USER`.
2. Nâng tài khoản lên `ADMIN`:

```sql
UPDATE "user"
SET role_id = (SELECT id FROM role WHERE code = 'ADMIN')
WHERE email = 'email-cua-ban@students.hou.edu.vn';
```

3. Đăng nhập CMS lại.

**5.5. Kiểm tra**

```sql
SELECT u.email, r.code AS role FROM "user" u JOIN role r ON r.id = u.role_id;
```

Phải thấy email của bạn với vai trò `ADMIN`.

### 6. Chạy server và đăng nhập CMS

```bash
pnpm dev
```

Trên Windows có thể chạy `start-dev.bat` (tự bật DB rồi chạy `pnpm dev`).

- CMS: http://localhost:4000/cms → *Đăng nhập bằng Google* → chọn email của bạn (xem bước 5.4)
- Swagger: http://localhost:4000/swagger

Báo "Tài khoản không có quyền vào CMS" nghĩa là tài khoản đang có vai trò `USER`: chạy câu `UPDATE` ở bước 5.4.

### 7. Nhập danh mục

DB còn trống nên web chưa đăng được tài liệu hay tạo được bài kiểm tra. Trên CMS tạo lần lượt **Khoa → Ngành → Môn học** (môn phải thuộc một ngành, ngành phải thuộc một khoa).

Muốn cho giảng viên duyệt nội dung: vào **Vai trò** tạo vai trò mới (ví dụ `LECTURER`), gán các quyền `READ_DOCUMENT`, `REVIEW_DOCUMENT`, `READ_QUIZ`, `REVIEW_QUIZ`, rồi vào **Người dùng** đổi vai trò cho người đó (người đó phải đăng nhập web hoặc CMS ít nhất một lần để có tài khoản).

> `synchronize: true` làm TypeORM sửa bảng theo entity mỗi lần server khởi động, kể cả **xoá cột** không còn trong entity. Không để hai bản code khác nhau (ví dụ server dev và một image Docker cũ) cùng chạy trên một DB.

### Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng server (mặc định 4000) |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Kết nối PostgreSQL |
| `SECRET_KEY` | Khoá ký access token (JWT) của API |
| `REFRESH_TOKEN_SECRET` | Khoá ký refresh token của API (sống 12 giờ) |
| `SESSION_SECRET` | Khoá ký cookie session của CMS. **Bắt buộc**, thiếu thì server không khởi động |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Đăng nhập Google |
| `FRONTEND_URL` | Địa chỉ frontend: nơi API chuyển hướng sau khi đăng nhập, và được thêm vào danh sách CORS (ngoài `https://revise-hou.tech` và `http://localhost:5173`). Chạy FE ở `http://127.0.0.1:5173` thì đặt biến này thành địa chỉ đó |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER` | Upload tệp |

### Role mặc định của người dùng web

Web không phân quyền: ai đăng nhập bằng email trường cũng dùng được mọi API của web. Role chỉ dùng cho CMS.

Tài khoản đăng nhập web lần đầu được gán role `USER` (tìm theo `code = 'USER'` trong bảng `role`, tạo ở bước 5.1; thiếu role này thì đăng nhập lần đầu sẽ báo lỗi). Role này **không gắn permission** và **không vào được CMS** (`canEnterCms` chặn `USER`). Muốn cho ai vào CMS thì admin đổi role của người đó trên CMS.

### Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy ở chế độ watch |
| `pnpm build` | Build ra `dist/` |
| `pnpm start:prod` | Chạy bản build |
| `pnpm lint` | ESLint (**có `--fix`**, tự sửa file) |
| `pnpm test` | Chạy test |

### Docker

`docker-compose.yml` gồm `db` (PostgreSQL, container `course-db`), `api` (build từ `Dockerfile`, container `course-api`) và `nginx` (cổng 8080, chuyển tiếp vào `course-api:4000`). Khi deploy, nhớ đặt `SESSION_SECRET` và `NODE_ENV=production` (bật cookie `secure` và `trust proxy` cho CMS).

Image `api` chứa code **tại lúc build**, không tự cập nhật khi sửa code. Vì vậy:

- Chạy bản Docker thì luôn kèm `--build` để build lại từ code hiện tại:

  ```bash
  docker compose up -d --build api nginx
  ```

- Đang code bằng `pnpm dev` thì không chạy `api` cùng lúc. Nếu đang chạy thì tắt: `docker stop course-api course-nginx`.
- Không bao giờ để image cũ chạy trên DB đang dùng: với `synchronize: true`, image cũ sẽ xoá các cột mà entity cũ không có, mất luôn dữ liệu trong cột đó.

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
    util/                 cms.helper.ts, cms.auth.ts, cms.permission.ts (danh sách tên quyền)
    static/resources/     AdminLTE, jQuery, DataTables, cms.js, cms.css
    cms.decorator.ts      @CmsController, @CmsView, @CmsAction
    cms-session.guard.ts  Kiểm tra đã đăng nhập
    flash-redirect.interceptor.ts  Chuyển hướng kèm thông báo
    error.filter.ts       Xử lý lỗi của CMS
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

## API bài kiểm tra và bình luận (web)

Tất cả cần `Authorization: Bearer <accessToken>`. Bảng `quizzes`, `questions`, `answers`, `attempts`, `user_answers`, `comments` do TypeORM tự tạo (`synchronize: true`).

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/api/quizzes?subjectId=` | Danh sách bài kiểm tra `ACTIVE` có ít nhất 1 câu, kèm `questionCount`, `attemptCount` |
| GET | `/api/quizzes/:id` | Thông tin bài kiểm tra, **không** trả câu hỏi. Câu hỏi chỉ có khi đã bắt đầu lượt làm |
| POST | `/api/quizzes/:quizId/attempts` | Luôn tạo lượt làm mới. Mỗi lượt chỉ làm và nộp một lần, muốn làm lại thì tạo lượt khác |
| GET | `/api/quizzes/:quizId/attempts/me` | Lịch sử điểm của mình |
| GET | `/api/attempts/:id` | Câu hỏi, phương án và đáp án đã chọn (`selectedAnswerId`). Sau khi nộp mới có `isCorrect`, `explanation` |
| PUT | `/api/attempts/:id/answers` | Lưu một danh sách đáp án `{ answers: [{ questionId, answerId }] }` (FE gửi theo từng trang 10 câu), `answerId: null` để bỏ chọn |
| POST | `/api/attempts/:id/submit` | Nộp bài, có thể gửi kèm `{ answers: [...] }`. Chấm điểm thang 10 = số câu đúng / tổng số câu × 10, lưu `totalCorrect`, `score` |
| GET | `/api/comments?sourceType=DOCUMENT\|QUIZ&sourceId=` | Bình luận gốc mới nhất trước, mỗi bình luận kèm `replies` |
| POST | `/api/comments` | `{ sourceType, sourceId, content, parentId?, replyToUserId? }`. Trả lời một trả lời sẽ gắn vào bình luận gốc |
| PATCH | `/api/comments/:id` | Sửa nội dung, chỉ người viết |
| DELETE | `/api/comments/:id` | Xóa mềm (`INACTIVE`), chỉ người viết |

Hạn làm bài là `dateStarted + estimateMinute`, cho thêm 30 giây trễ mạng. Chỉ chủ lượt làm mới xem và sửa được lượt đó.

### Tạo bài kiểm tra

Ai đăng nhập web cũng tạo được. Bài mới ở trạng thái `PENDING`, chỉ hiện cho mọi người sau khi được duyệt trên CMS (`/cms/quizzes`, quyền `READ_QUIZ`, `REVIEW_QUIZ`; vai trò nào có 2 quyền này thì duyệt được).

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/api/quizzes/mine` | Bài của mình (mọi trạng thái trừ đã xóa), kèm `status`, `rejectReason` |
| POST | `/api/quizzes` | Tạo bài từ `QuizContext`: `{ name, description?, subjectId, estimateMinute (1–180), questions: [{ title, explanation?, answers: [{ title, isCorrect }] }] }`. Mỗi câu 2–6 phương án, đúng 1 phương án `isCorrect` |
| GET | `/api/quizzes/:id/edit` | Lấy lại `QuizContext` để sửa (có `isCorrect`), chỉ người tạo |
| PUT | `/api/quizzes/:id` | Sửa toàn bộ bài, đưa về `PENDING`. Bài đã có lượt làm thì trả 409 |
| DELETE | `/api/quizzes/:id` | Ẩn bài (`INACTIVE`), chỉ người tạo |

### Danh sách đã lưu

Bảng `saved_item` (`user_id`, `source_type` = `DOCUMENT` \| `QUIZ`, `source_id`), mỗi người lưu một nội dung một lần.

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/api/saved/keys` | Danh sách `{ sourceType, sourceId }` đã lưu, để FE tô nút Lưu |
| GET | `/api/saved` | `{ documents, quizzes }` đã lưu, chỉ nội dung còn `ACTIVE`, mới lưu trước |
| POST | `/api/saved` | Lưu `{ sourceType, sourceId }`, gọi lại không lỗi |
| DELETE | `/api/saved?sourceType=&sourceId=` | Bỏ lưu, gọi lại không lỗi |

## Luồng CMS

### Đăng nhập
1. Vào `/cms/login`, bấm đăng nhập bằng Google (`/api/auth/google?from=cms`).
2. Google gọi lại `/api/auth/google/callback`. Nhánh CMS kiểm tra email trường, tìm hoặc tạo user, rồi lưu `userId` vào session.
3. Tài khoản có vai trò `USER` không được vào CMS.

### Mỗi request vào trang CMS
1. Session middleware đọc cookie `cms.sid` và nạp session từ DB (bảng `cms_sessions`).
2. `CmsSessionGuard` nạp user kèm vai trò và quyền. Chưa đăng nhập thì chuyển về `/cms/login`.
3. `PermissionsGuard`: kiểm tra quyền khai báo ở `@CmsView` / `@CmsAction`. Vai trò phải có đúng mã quyền đó.
4. Controller gọi bean, trả dữ liệu cho view hoặc chuyển hướng.
5. Lỗi đi qua `CmsErrorFilter`.

### Thông báo
Sau thao tác, `FlashRedirectInterceptor` lưu thông báo thành công hoặc lỗi vào session (`session.info`) rồi chuyển hướng. Trang kế tiếp hiển thị một lần.

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

5. Tạo `src/cms/view/course/list.html` và `form.html`.
6. Đăng ký controller trong `cms.module.ts` và thêm mục vào `view/template/sidebar.html`.
7. Gán quyền mới cho vai trò trong trang **Vai trò** của CMS.

`@CmsAction` trả về chuỗi thì đó là thông báo thành công. Ném lỗi (ví dụ `BadRequestException`) thì chuyển hướng về `onError` kèm thông báo lỗi. Trong URL có thể dùng `:id` để lấy từ tham số của route.

## Phân quyền

- Mỗi vai trò (`role`) có nhiều quyền (`permission`) qua bảng `role_permission`. Mã quyền (`code`) dùng ở `@CmsView`, `@CmsAction` và API `@Permissions`.
- Không có quyền "tất cả". `ADMIN` được gán đủ từng quyền; thêm quyền mới thì nhớ gán cho `ADMIN`.
- **Khoa phụ trách:** khi đổi vai trò ở màn **Người dùng**, nếu vai trò có quyền `REVIEW_DOCUMENT` hoặc `REVIEW_QUIZ` thì hiện thêm ô *Khoa*. Chọn khoa thì người đó chỉ xem, duyệt và thống kê được tài liệu, bài kiểm tra thuộc khoa đó (lưu ở `user.faculty_id`). Để trống thì thấy mọi khoa. Danh mục Khoa/Ngành/Môn vẫn xem được hết.
- Quản lý vai trò và quyền ngay trong CMS ở mục **Vai trò** và **Quyền**.

## Lưu ý khi phát triển

- `pnpm lint` có `--fix` nên tự sửa file. Dùng `npx eslint <file>` nếu chỉ muốn xem lỗi.
- Hiện còn nhiều cảnh báo ESLint `no-unsafe-*` ở các file auth và service (do dùng kiểu `any`). Đây là cảnh báo kiểu, không ảnh hưởng chạy.
- Trên Node 24, `pnpm` 9.15.9 có thể lỗi khi chạy script cài đặt. Dùng `pnpm install --ignore-scripts` nếu gặp.
