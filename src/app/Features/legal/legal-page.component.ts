import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslationService } from '../../Core/I18n/translation.service';
import { SeoService } from '../../Core/Services/seo.service';

type LegalSection = { title: string; points: string[] };
type LegalContent = { eyebrow: string; title: string; intro: string; sections: LegalSection[] };

@Component({
  selector: 'app-legal-page',
  imports: [RouterLink],
  template: `
    <main class="legal-page">
      <div class="container">
        <a class="back-link" routerLink="/">{{ text('العودة للرئيسية', 'Back to home') }}</a>
        <header class="legal-hero">
          <span>{{ content().eyebrow }}</span>
          <h1>{{ content().title }}</h1>
          <p>{{ content().intro }}</p>
        </header>
        <div class="legal-sections">
          @for (section of content().sections; track section.title) {
            <section>
              <h2>{{ section.title }}</h2>
              <ul>
                @for (point of section.points; track point) { <li>{{ point }}</li> }
              </ul>
            </section>
          }
        </div>
        <aside class="contact-card">
          <div><strong>{{ text('هل لديك استفسار؟', 'Have a question?') }}</strong><p>{{ text('تواصل مع فريق كيميت عبر واتساب.', 'Contact the Kemet team on WhatsApp.') }}</p></div>
          <a href="https://wa.me/201100060960" target="_blank" rel="noopener noreferrer">{{ text('تواصل معنا', 'Contact us') }}</a>
        </aside>
      </div>
    </main>
  `,
  styleUrl: './legal-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalPageComponent {
  private readonly i18n = inject(TranslationService);
  private readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as 'terms' | 'privacy';
  readonly content = computed(() => this.getContent(this.kind, this.i18n.locale()));

  constructor() {
    const seo = inject(SeoService);
    if (this.kind === 'terms') {
      seo.updateLocalized('الشروط والأحكام | كيميت', 'Terms & Conditions | Kemet', 'تعرف على شروط استخدام منصة كيميت العقارية.', 'Read the terms for using the Kemet property platform.', '/terms');
    } else {
      seo.updateLocalized('سياسة الخصوصية | كيميت', 'Privacy Policy | Kemet', 'تعرف على كيفية تعامل كيميت مع بياناتك.', 'Learn how Kemet handles your information.', '/privacy');
    }
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }

  private getContent(kind: 'terms' | 'privacy', locale: 'ar' | 'en'): LegalContent {
    if (kind === 'terms') return locale === 'ar' ? TERMS_AR : TERMS_EN;
    return locale === 'ar' ? PRIVACY_AR : PRIVACY_EN;
  }
}

const TERMS_AR: LegalContent = {
  eyebrow: 'استخدام منصة كيميت', title: 'الشروط والأحكام',
  intro: 'باستخدام كيميت فإنك توافق على هذه الشروط المنظمة لتصفح العقارات ونشر الإعلانات والتواصل بين المستخدمين.',
  sections: [
    { title: 'الحساب واستخدام الموقع', points: ['يجب تقديم بيانات صحيحة عند إنشاء الحساب والمحافظة على سرية بيانات الدخول.', 'لا يجوز استخدام حساب شخص آخر أو إنشاء حسابات بهدف التضليل أو إساءة الاستخدام.', 'يلزم تأكيد رقم الهاتف قبل نشر إعلان عقاري لحماية المستخدمين وتقليل الإعلانات غير الموثوقة.'] },
    { title: 'الإعلانات العقارية', points: ['يتحمل المعلن مسؤولية صحة وصف العقار وسعره وصوره وموقعه ووسائل التواصل الخاصة به.', 'يجب أن تكون الصور مرتبطة بالعقار وألا تنتهك حقوق الآخرين.', 'يخضع الإعلان لمراجعة الإدارة قبل نشره، ويحق لكيميت قبوله أو رفضه أو طلب تعديله أو حذفه عند مخالفة الشروط.', 'يُمنع نشر العقارات الوهمية أو المعلومات المضللة أو المحتوى غير القانوني أو المكرر بصورة مزعجة.'] },
    { title: 'دور كيميت', points: ['كيميت منصة لعرض الإعلانات والمشروعات والوحدات العقارية، وليست طرفًا في عقد البيع أو الإيجار بين المستخدمين.', 'لا تضمن المنصة إتمام الصفقة أو دقة كل معلومة يقدمها المعلن؛ لذلك يجب التحقق من العقار والملكية والمستندات قبل الدفع أو التعاقد.', 'التواصل والمعاينة والتفاوض وإتمام المعاملة مسؤولية أطرافها.'] },
    { title: 'الباقات والمدفوعات', points: ['قد توفر كيميت باقات مدفوعة لزيادة ظهور الإعلان أو توفير مزايا إضافية وفق التفاصيل المعروضة وقت الشراء.', 'تتم عمليات الدفع عبر مزود دفع خارجي، وتخضع المعاملة كذلك لشروط مزود الخدمة.', 'مدة الباقة وعدد الإعلانات والمزايا هي الموضحة في صفحة الباقات عند الشراء.'] },
    { title: 'التعليق والتعديلات', points: ['يحق للإدارة تعليق الحساب أو الإعلان عند الاشتباه في الاحتيال أو مخالفة الشروط أو الإضرار بالمستخدمين.', 'قد يتم تحديث هذه الشروط لتناسب تطوير خدمات كيميت، ويُعد استمرار الاستخدام بعد نشر التحديث موافقة عليه.'] },
  ],
};

const TERMS_EN: LegalContent = {
  eyebrow: 'Using Kemet', title: 'Terms & Conditions',
  intro: 'By using Kemet, you agree to these terms governing property browsing, listing publication, and communication between users.',
  sections: [
    { title: 'Accounts and use', points: ['Provide accurate registration information and keep your sign-in details secure.', 'Do not use another person’s account or create accounts for deception or abuse.', 'Phone verification is required before posting a property listing to improve trust and safety.'] },
    { title: 'Property listings', points: ['Advertisers are responsible for the accuracy of property descriptions, prices, photos, locations, and contact details.', 'Images must relate to the property and must not violate another party’s rights.', 'Listings are reviewed before publication; Kemet may approve, reject, request changes to, or remove non-compliant listings.', 'Fake properties, misleading information, illegal content, and disruptive duplicate listings are prohibited.'] },
    { title: 'Kemet’s role', points: ['Kemet displays property listings, projects, and units; it is not a party to a sale or rental agreement.', 'Kemet cannot guarantee completion of a transaction or every claim made by an advertiser. Verify the property, ownership, and documents before paying or contracting.', 'Communication, viewing, negotiation, and completion of a transaction remain the parties’ responsibility.'] },
    { title: 'Plans and payments', points: ['Kemet may offer paid plans for greater listing visibility or additional features, as described at purchase.', 'Payments are processed by an external payment provider and are also subject to that provider’s terms.', 'Plan duration, listing allowance, and benefits are those displayed on the plans page at purchase.'] },
    { title: 'Suspension and updates', points: ['Kemet may suspend accounts or listings where fraud, a breach, or user harm is suspected.', 'These terms may change as Kemet develops. Continued use after publication of an update constitutes acceptance.'] },
  ],
};

const PRIVACY_AR: LegalContent = {
  eyebrow: 'خصوصيتك على كيميت', title: 'سياسة الخصوصية',
  intro: 'توضح هذه السياسة البيانات التي نستخدمها لتشغيل منصة كيميت وحماية الحسابات وتقديم خدمات الإعلانات العقارية.',
  sections: [
    { title: 'البيانات التي نجمعها', points: ['بيانات الحساب مثل الاسم والبريد الإلكتروني ورقم الهاتف والصورة الشخصية الاختيارية.', 'بيانات الإعلانات مثل وصف العقار وصوره وسعره وموقعه التقريبي وبيانات التواصل.', 'نشاط الحساب مثل المفضلة والتقييمات والبلاغات والإعلانات وحالة الباقات وعمليات الدفع.', 'بيانات تقنية ضرورية للأمان وتشغيل الجلسة، مثل ملفات تعريف الارتباط وعنوان الشبكة وسجلات الأخطاء.'] },
    { title: 'كيف نستخدم البيانات', points: ['إنشاء الحساب وتسجيل الدخول وتأمين الجلسة وتأكيد البريد أو رقم الهاتف.', 'نشر الإعلانات بعد مراجعتها وعرض نتائج البحث والمفضلة والمشروعات المناسبة.', 'تشغيل الباقات والمدفوعات وإرسال الإشعارات المتعلقة بالحساب أو مراجعة الإعلان.', 'منع الاحتيال والتحقيق في البلاغات وتحسين أداء كيميت وتجربة المستخدم.'] },
    { title: 'ما يظهر للآخرين', points: ['قد يظهر اسم المعلن وصورته ووسيلة التواصل وبيانات الإعلان للزوار لتسهيل الاستفسار عن العقار.', 'لا نعرض كلمة المرور أو رموز التحقق أو بيانات الجلسة للزوار.', 'لا تضع معلومات حساسة داخل وصف الإعلان أو صوره.'] },
    { title: 'الخدمات الخارجية', points: ['قد نستخدم خدمات موثوقة للبريد وواتساب وتسجيل الدخول عبر Google والدفع الإلكتروني والخرائط واستضافة الموقع.', 'تُرسل لهذه الجهات البيانات اللازمة لتنفيذ الخدمة فقط، وتخضع معالجتها لسياساتها والتزاماتها القانونية.', 'لا تبيع كيميت بياناتك الشخصية للمعلنين أو الوسطاء.'] },
    { title: 'الحماية والاحتفاظ وحقوقك', points: ['نستخدم وسائل تقنية وتنظيمية معقولة لحماية البيانات، ولا توجد وسيلة إلكترونية مضمونة بنسبة 100%.', 'نحتفظ بالبيانات للمدة اللازمة لتشغيل الحساب والوفاء بالالتزامات النظامية وتسوية النزاعات ومنع الاحتيال.', 'يمكنك تحديث بيانات حسابك، وطلب المساعدة بشأن بياناتك أو إغلاق الحساب بالتواصل معنا عبر واتساب.'] },
  ],
};

const PRIVACY_EN: LegalContent = {
  eyebrow: 'Your privacy on Kemet', title: 'Privacy Policy',
  intro: 'This policy explains the information used to operate Kemet, protect accounts, and provide property-listing services.',
  sections: [
    { title: 'Information we collect', points: ['Account details such as name, email, phone number, and optional profile photo.', 'Listing data such as property description, photos, price, approximate location, and contact details.', 'Account activity including favorites, ratings, reports, listings, plan status, and payment records.', 'Technical data needed for security and sessions, including cookies, network address, and error logs.'] },
    { title: 'How we use information', points: ['To create accounts, sign users in, secure sessions, and verify email or phone numbers.', 'To review and publish listings and provide search, favorites, and relevant project results.', 'To operate plans and payments and send account or listing-review notifications.', 'To prevent fraud, investigate reports, and improve Kemet’s performance and user experience.'] },
    { title: 'What others can see', points: ['An advertiser’s name, photo, contact method, and listing details may be shown to visitors to support property enquiries.', 'Passwords, verification codes, and session information are never displayed to visitors.', 'Do not include sensitive personal information in listing descriptions or images.'] },
    { title: 'External services', points: ['We may use trusted providers for email, WhatsApp, Google sign-in, electronic payments, maps, and hosting.', 'Only information necessary to perform the service is shared, and processing is subject to provider policies and legal obligations.', 'Kemet does not sell your personal information to advertisers or brokers.'] },
    { title: 'Security, retention, and your choices', points: ['We use reasonable technical and organizational safeguards, although no electronic system is 100% secure.', 'Information is retained as needed to operate accounts, meet legal obligations, resolve disputes, and prevent fraud.', 'You may update account details or contact us on WhatsApp for help with your data or account closure.'] },
  ],
};
