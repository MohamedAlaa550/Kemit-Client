import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslationService } from '../I18n/translation.service';

@Injectable({ providedIn: 'root' })
export class ApiErrorMessageService {
  private readonly i18n = inject(TranslationService);

  message(error: HttpErrorResponse, isLogin = false): string {
    const fallback = this.statusMessage(error.status, isLogin);
    const serverMessage = this.extract(error.error);
    if (!serverMessage || this.isGenericValidationTitle(serverMessage)) return fallback;
    return this.i18n.locale() === 'ar'
      ? this.toArabic(serverMessage, error.status, isLogin)
      : this.toEnglish(serverMessage, fallback);
  }

  private extract(body: unknown): string | undefined {
    if (typeof body === 'string') {
      const value = body.trim();
      if (!value) return undefined;
      try { return this.extract(JSON.parse(value)) ?? value; } catch { return value; }
    }
    if (!body || typeof body !== 'object') return undefined;
    const record = body as Record<string, unknown>;
    const validation = this.extractValidationErrors(record['errors'] ?? record['Errors']);
    if (validation) return validation;
    for (const key of ['errorMessage', 'ErrorMessage', 'message', 'Message', 'detail', 'title']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return undefined;
  }

  private extractValidationErrors(errors: unknown): string | undefined {
    if (Array.isArray(errors)) {
      for (const item of errors) {
        if (typeof item === 'string' && item.trim()) return item.trim();
        if (item && typeof item === 'object') {
          const nested = item as Record<string, unknown>;
          const message = this.extractValidationErrors(nested['errors'] ?? nested['Errors']);
          if (message) return message;
        }
      }
    } else if (errors && typeof errors === 'object') {
      for (const value of Object.values(errors as Record<string, unknown>)) {
        const message = this.extractValidationErrors(value);
        if (message) return message;
      }
    }
    return undefined;
  }

  private toEnglish(message: string, fallback: string): string {
    return this.isGenericValidationTitle(message) ? fallback : message;
  }

  private toArabic(message: string, status: number, isLogin: boolean): string {
    const value = message.toLowerCase();
    const rules: Array<[RegExp, string]> = [
      [/confirm your email/, 'يجب تأكيد البريد الإلكتروني أولًا.'],
      [/invalid (email|phone number) or password|invalid email or password|incorrect password/, 'البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة.'],
      [/invalid phone number or password/, 'رقم الهاتف أو كلمة المرور غير صحيحة.'],
      [/account is temporarily locked/, 'الحساب مقفل مؤقتًا. حاول مرة أخرى لاحقًا.'],
      [/account is inactive/, 'هذا الحساب غير نشط. تواصل مع الدعم.'],
      [/duplicateemail|email .*already|already taken.*email/, 'البريد الإلكتروني مستخدم بالفعل. جرّب تسجيل الدخول أو استخدم بريدًا آخر.'],
      [/duplicateusername|username .*already|already taken.*user/, 'يوجد حساب مسجل بهذه البيانات بالفعل.'],
      [/password.*(uppercase|capital letter)/, 'يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم ورمز خاص.'],
      [/password.*(non-alphanumeric|special)/, 'يجب أن تحتوي كلمة المرور على رمز خاص.'],
      [/password.*(digit|number)/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.'],
      [/password.*lowercase/, 'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل.'],
      [/password.*(too short|more than 8|at least)/, 'يجب ألا تقل كلمة المرور عن 8 أحرف.'],
      [/password not matching|passwords? do not match/, 'كلمتا المرور غير متطابقتين.'],
      [/email.*not valid|invalid email|email address.*invalid/, 'أدخل بريدًا إلكترونيًا صحيحًا.'],
      [/first.?name.*required/, 'الاسم الأول مطلوب.'],
      [/last.?name.*required/, 'الاسم الأخير مطلوب.'],
      [/confirm.?password.*required/, 'تأكيد كلمة المرور مطلوب.'],
      [/password.*required/, 'كلمة المرور مطلوبة.'],
      [/email.*required/, 'البريد الإلكتروني مطلوب.'],
      [/required/, 'أكمل الحقول المطلوبة.'],
      [/valid egyptian mobile|phone number is invalid/, 'أدخل رقم موبايل مصريًا صحيحًا.'],
      [/whatsapp number is already registered/, 'رقم واتساب مسجل بالفعل.'],
      [/whatsapp number is already linked/, 'رقم واتساب مرتبط بحساب آخر بالفعل.'],
      [/phone number is already linked/, 'رقم الهاتف مرتبط بحساب آخر بالفعل.'],
      [/verification code is invalid or expired/, 'رمز التحقق غير صحيح أو انتهت صلاحيته.'],
      [/verification session is invalid or expired/, 'جلسة التحقق غير صالحة أو انتهت. اطلب رمزًا جديدًا.'],
      [/daily otp limit|too many verification requests/, 'تم تجاوز الحد المسموح لطلبات التحقق. حاول لاحقًا.'],
      [/wait before requesting another code/, 'انتظر قليلًا قبل طلب رمز جديد.'],
      [/whatsapp delivery is currently unavailable/, 'تعذر إرسال رسالة واتساب حاليًا. حاول لاحقًا.'],
      [/profile image must not exceed/, 'حجم الصورة الشخصية يجب ألا يتجاوز 2 ميجابايت.'],
      [/verify your whatsapp number before (publishing|purchasing)/, 'أكد رقم واتساب أولًا للمتابعة.'],
      [/you cannot rate yourself/, 'لا يمكنك تقييم نفسك.'],
      [/you cannot report your own advertisement/, 'لا يمكنك الإبلاغ عن إعلانك.'],
      [/details are required/, 'اكتب تفاصيل البلاغ.'],
      [/invalid report reason/, 'سبب البلاغ غير صالح.'],
      [/search query must contain at least two/, 'اكتب حرفين على الأقل للبحث.'],
      [/two free advertisements have been used/, 'استخدمت إعلانيك المجانيين. اختر باقة للمتابعة.'],
      [/selected package is expired/, 'الباقة المختارة منتهية أو لا تحتوي على إعلانات متبقية.'],
      [/invalid advertising plan/, 'الباقة الإعلانية المختارة غير صالحة.'],
      [/payment reference was not found/, 'لم يتم العثور على عملية الدفع.'],
      [/not found|endpoint with url/, 'المحتوى المطلوب غير موجود.'],
      [/invalid request origin/, 'تعذر التحقق من مصدر الطلب. أعد تحميل الصفحة وحاول مجددًا.'],
    ];
    return rules.find(([pattern]) => pattern.test(value))?.[1]
      ?? this.statusMessage(status, isLogin);
  }

  private statusMessage(status: number, isLogin: boolean): string {
    const ar = this.i18n.locale() === 'ar';
    const messages: Record<number, [string, string]> = {
      0: ['تعذر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.', 'Could not connect to the server. Check your connection and try again.'],
      400: ['راجع البيانات المدخلة وحاول مجددًا.', 'Please review the entered information and try again.'],
      401: isLogin
        ? ['البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة.', 'The email, phone number, or password is incorrect.']
        : ['تعذر تنفيذ الطلب. سنحافظ على جلستك ونحاول مجددًا.', 'The request could not be completed. We will keep your session active.'],
      403: ['ليس لديك صلاحية لتنفيذ هذا الإجراء.', 'You do not have permission to perform this action.'],
      404: ['المحتوى المطلوب غير موجود.', 'The requested content was not found.'],
      409: ['توجد بيانات مسجلة بالفعل بنفس القيم.', 'A record with the same details already exists.'],
      413: ['حجم الملفات المرفوعة كبير جدًا.', 'The uploaded files are too large.'],
      429: ['محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.', 'Too many attempts. Please wait and try again.'],
      500: ['حدث خطأ بالخادم. حاول مرة أخرى لاحقًا.', 'A server error occurred. Please try again later.'],
      502: ['الخدمة غير متاحة مؤقتًا. حاول لاحقًا.', 'The service is temporarily unavailable. Try again later.'],
      503: ['الخدمة غير متاحة مؤقتًا. حاول لاحقًا.', 'The service is temporarily unavailable. Try again later.'],
    };
    const pair = messages[status] ?? ['حدث خطأ غير متوقع. حاول مجددًا.', 'An unexpected error occurred. Please try again.'];
    return pair[ar ? 0 : 1];
  }

  private isGenericValidationTitle(message: string): boolean {
    return /one or more validation errors? (occurred|occurs)/i.test(message);
  }
}
