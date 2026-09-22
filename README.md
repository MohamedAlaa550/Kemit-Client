# Kemit Client

واجهة كيميت العقارية مبنية بـ Angular 22 وTailwind CSS 4 وSSR، ومصممة مباشرة حول Controllers وDTOs الخاصة بـ Kemit ASP.NET Core API.

## التشغيل المحلي

```powershell
# Backend — من مجلد Kemit
dotnet run --project Kemit/Kemit.csproj --launch-profile https

# Frontend — من مجلد Kemit-Client
npm install
npm start
```

- Frontend: `http://localhost:4200`
- Backend API: `https://localhost:7289/api`
- يمكن تعديل عنوان الإنتاج في `src/environments/environment.production.ts`.

## تفعيل التسجيل باستخدام Google

1. أنشئ OAuth 2.0 Client من نوع **Web application** في Google Cloud Console.
2. أضف `http://localhost:4200` إلى **Authorized JavaScript origins**، وأضف نطاق الموقع الحقيقي عند النشر.
3. ضع نفس Client ID في `googleClientId` داخل:
   - `src/environments/environment.ts`
   - `src/environments/environment.production.ts`
4. خزّنه للـ API محليًا بدون وضعه في ملفات الأسرار:

```powershell
dotnet user-secrets set "JwtOptions:GoogleClientId" "YOUR_CLIENT_ID.apps.googleusercontent.com" --project ..\Kemit\Kemit\Kemit.csproj
```

في بيئة النشر استخدم متغير البيئة `JwtOptions__GoogleClientId`. الـ Client ID ليس سرًا، لكن يجب أن تكون قيمته واحدة في الواجهة والـ API حتى ينجح فحص `audience`.

## المعمارية

- `Core/Models`: عقود TypeScript المطابقة لـ backend DTOs.
- `Core/Services`: Auth وProjects وUnits وAdvertisements وDevelopers وFavorites وLocations.
- `Core/Interceptors`: JWT headers، loading، ومعالجة الأخطاء.
- `Core/Guards`: حماية صفحات الحساب والمفضلة ومسارات الضيف.
- `Shared/Components`: header/footer/cards/search/loading/toasts.
- `Features`: صفحات lazy-loaded حسب المجال.

## السلوك والأمان

- الحالة المشتركة مبنية على Angular Signals.
- جلسة المستخدم تعتمد على `HttpOnly + Secure + SameSite=None` cookies، ولا تُخزن JWT أو Refresh Token في `localStorage`.
- يتم تدوير Refresh Token تلقائيًا واستعادة الجلسة من الخادم عند إعادة تحميل الصفحة.
- الطلبات التي تستخدم Cookie authentication محمية بهيدر مخصص مع CORS credentials لتقليل مخاطر CSRF.
- النماذج لا تُرسل إلا إذا كانت صالحة، والزر يتعطل أثناء الإرسال.
- البحث اللحظي يستخدم `450ms debounce` و`distinctUntilChanged` و`switchMap` لإلغاء الطلب القديم.
- استعادة كلمة المرور محمية بـ cooldown في الواجهة وRate Limiting في الـ API: خمس محاولات لكل IP خلال 15 دقيقة.
- التطبيق يستخدم SSR/Prerender، metadata ديناميكية، canonical، robots، manifest، lazy loading، واحترام `prefers-reduced-motion`.

## التحقق

```powershell
npm run build
npm test
dotnet build Kemit/Kemit.csproj --no-restore
```
