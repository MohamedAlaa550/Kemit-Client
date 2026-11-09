import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../Core/I18n/translation.service';

const arabicNames: Record<string, string> = {
  Cairo: 'القاهرة', 'Nasr City': 'مدينة نصر', Heliopolis: 'مصر الجديدة', Maadi: 'المعادي', 'New Cairo': 'القاهرة الجديدة', Shubra: 'شبرا', Helwan: 'حلوان', 'Ain Shams': 'عين شمس', 'El Marg': 'المرج', Mokattam: 'المقطم', 'Badr City': 'مدينة بدر',
  Giza: 'الجيزة', Dokki: 'الدقي', Mohandessin: 'المهندسين', '6 October': 'السادس من أكتوبر', 'Sheikh Zayed': 'الشيخ زايد', Haram: 'الهرم', Faisal: 'فيصل', Imbaba: 'إمبابة', 'Bulaq El Dakrour': 'بولاق الدكرور', Kerdasa: 'كرداسة', Badrashein: 'البدرشين',
  Alexandria: 'الإسكندرية', Montaza: 'المنتزه', 'Sidi Gaber': 'سيدي جابر', Miami: 'ميامي', Stanley: 'ستانلي', Smouha: 'سموحة', Agami: 'العجمي', 'Borg El Arab': 'برج العرب', Gleem: 'جليم', Bacchus: 'باكوس', Mandara: 'المندرة',
  Dakahlia: 'الدقهلية', Mansoura: 'المنصورة', Talkha: 'طلخا', 'Mit Ghamr': 'ميت غمر', Belqas: 'بلقاس', Sherbin: 'شربين', Aga: 'أجا', Dekernes: 'دكرنس', Sinbillawin: 'السنبلاوين', Gamasa: 'جمصة', Manzala: 'المنزلة',
  'Red Sea': 'البحر الأحمر', Hurghada: 'الغردقة', Safaga: 'سفاجا', 'El Quseir': 'القصير', 'Marsa Alam': 'مرسى علم', 'Ras Gharib': 'رأس غارب', Shalateen: 'الشلاتين',
  Beheira: 'البحيرة', Damanhur: 'دمنهور', 'Kafr El Dawwar': 'كفر الدوار', Rashid: 'رشيد', Edku: 'إدكو', 'Abu Hummus': 'أبو حمص', 'Itay El Barud': 'إيتاي البارود', 'Kom Hamada': 'كوم حمادة', Delengat: 'الدلنجات', Nubaria: 'النوبارية', 'Hosh Issa': 'حوش عيسى',
  Fayoum: 'الفيوم', Ibshway: 'إبشواي', Tamiya: 'طامية', Senuris: 'سنورس', 'Yousef El Seddik': 'يوسف الصديق', Etsa: 'إطسا',
  Gharbia: 'الغربية', Tanta: 'طنطا', 'El Mahalla El Kubra': 'المحلة الكبرى', 'Kafr El Zayat': 'كفر الزيات', Zefta: 'زفتى', Samanoud: 'سمنود', Basyoun: 'بسيون', Qutur: 'قطور', Santa: 'السنطة',
  Ismailia: 'الإسماعيلية', Fayed: 'فايد', 'Qantara East': 'القنطرة شرق', 'Qantara West': 'القنطرة غرب', 'Abu Suwir': 'أبو صوير', 'Tell El Kebir': 'التل الكبير',
  Menoufia: 'المنوفية', 'Shibin El Kom': 'شبين الكوم', 'Sadat City': 'مدينة السادات', Ashmoun: 'أشمون', Menouf: 'منوف', Quesna: 'قويسنا', 'El Bagour': 'الباجور', Tala: 'تلا', 'Berket El Sab': 'بركة السبع',
  Minya: 'المنيا', Mallawi: 'ملوي', 'Beni Mazar': 'بني مزار', Samalut: 'سمالوط', Maghagha: 'مغاغة', 'Abu Qurqas': 'أبو قرقاص', Matai: 'مطاي', 'Deir Mawas': 'دير مواس',
  Qaliubiya: 'القليوبية', Banha: 'بنها', 'Shubra El Kheima': 'شبرا الخيمة', Qalyub: 'قليوب', 'El Khanka': 'الخانكة', 'Kafr Shukr': 'كفر شكر', Toukh: 'طوخ', 'Shebin El Qanater': 'شبين القناطر',
  'New Valley': 'الوادي الجديد', Kharga: 'الخارجة', Dakhla: 'الداخلة', Farafra: 'الفرافرة', Paris: 'باريس', Balat: 'بلاط',
  Suez: 'السويس', Arbaeen: 'الأربعين', Ataqa: 'عتاقة', Ganayen: 'الجناين',
  Aswan: 'أسوان', 'Kom Ombo': 'كوم أمبو', Edfu: 'إدفو', Daraw: 'دراو', 'Nasr El Nuba': 'نصر النوبة', 'Abu Simbel': 'أبو سمبل',
  Assiut: 'أسيوط', 'New Assiut': 'أسيوط الجديدة', Dairut: 'ديروط', Manfalut: 'منفلوط', Abnoub: 'أبنوب', 'El Badari': 'البداري', Qusiya: 'القوصية', 'Abu Tig': 'أبو تيج', 'Sahel Selim': 'ساحل سليم',
  'Beni Suef': 'بني سويف', 'El Wasta': 'الواسطى', Nasser: 'ناصر', Ehnasia: 'إهناسيا', Biba: 'ببا', Samasta: 'سمسطا', 'El Fashn': 'الفشن',
  'Port Said': 'بورسعيد', 'Port Fouad': 'بورفؤاد', 'El Arab': 'العرب', 'El Dawahy': 'الضواحي', 'El Ganoub': 'الجنوب',
  Damietta: 'دمياط', 'Ras El Bar': 'رأس البر', Faraskur: 'فارسكور', 'Kafr Saad': 'كفر سعد', Zarqa: 'الزرقا', 'New Damietta': 'دمياط الجديدة',
  Sharqia: 'الشرقية', Zagazig: 'الزقازيق', '10th of Ramadan': 'العاشر من رمضان', Belbeis: 'بلبيس', 'Minya El Qamh': 'منيا القمح', 'Abu Hammad': 'أبو حماد', Faqous: 'فاقوس', 'Kafr Saqr': 'كفر صقر', Husseiniya: 'الحسينية',
  'South Sinai': 'جنوب سيناء', 'Sharm El Sheikh': 'شرم الشيخ', Dahab: 'دهب', Nuweiba: 'نويبع', Taba: 'طابا', 'Tor Sinai': 'طور سيناء', 'Saint Catherine': 'سانت كاترين',
  'Kafr El Sheikh': 'كفر الشيخ', Desouk: 'دسوق', Baltim: 'بلطيم', Fuwwah: 'فوه', Motobas: 'مطوبس', 'Sidi Salem': 'سيدي سالم', Biyala: 'بيلا',
  Matrouh: 'مطروح', 'Marsa Matrouh': 'مرسى مطروح', 'El Alamein': 'العلمين', 'Sidi Barrani': 'سيدي براني', Siwa: 'سيوة', Dabaa: 'الضبعة', Salloum: 'السلوم',
  Luxor: 'الأقصر', Esna: 'إسنا', Armant: 'أرمنت', Tod: 'الطود', Qurna: 'القرنة', 'New Tiba': 'طيبة الجديدة',
  Qena: 'قنا', Qus: 'قوص', 'Nag Hammadi': 'نجع حمادي', Dishna: 'دشنا', 'Abu Tesht': 'أبو تشت', Farshut: 'فرشوط', Naqada: 'نقادة',
  'North Sinai': 'شمال سيناء', Arish: 'العريش', 'Sheikh Zuweid': 'الشيخ زويد', Rafah: 'رفح', 'Bir El Abd': 'بئر العبد', Hasana: 'الحسنة', Nakhl: 'نخل',
  Sohag: 'سوهاج', 'New Sohag': 'سوهاج الجديدة', Akhmim: 'أخميم', 'New Akhmim': 'أخميم الجديدة', Girga: 'جرجا', Tahta: 'طهطا', Tama: 'طما', Juhayna: 'جهينة', 'El Maragha': 'المراغة', 'Dar El Salam': 'دار السلام',
  'El Shorouk': 'الشروق', '15 May City': 'مدينة 15 مايو', 'New Administrative Capital': 'العاصمة الإدارية الجديدة', 'Capital Gardens': 'حدائق العاصمة',
  'October Gardens': 'حدائق أكتوبر', 'New 6 October': '6 أكتوبر الجديدة', 'New Sphinx': 'سفنكس الجديدة', 'Sheikh Zayed Extension': 'امتداد الشيخ زايد', 'New Warraq': 'الوراق الجديدة',
  'New Borg El Arab': 'برج العرب الجديدة', 'New Mansoura': 'المنصورة الجديدة', 'New Rashid': 'رشيد الجديدة', 'New Fayoum': 'الفيوم الجديدة', 'New Ismailia': 'الإسماعيلية الجديدة',
  'New Minya': 'المنيا الجديدة', 'New Mallawi': 'ملوي الجديدة', Obour: 'العبور', 'New Obour': 'العبور الجديدة', 'New Suez': 'السويس الجديدة',
  'New Aswan': 'أسوان الجديدة', 'New Toshka': 'توشكى الجديدة', 'Nasser City (West Assiut)': 'مدينة ناصر (غرب أسيوط)',
  'New Beni Suef': 'بني سويف الجديدة', 'New Fashn': 'الفشن الجديدة', 'Salam City (East Port Said)': 'مدينة سلام (شرق بورسعيد)',
  'New Salhia': 'الصالحية الجديدة', 'New Alamein': 'العلمين الجديدة', 'New Ras El Hekma': 'رأس الحكمة الجديدة', 'New Luxor': 'الأقصر الجديدة',
  'New Qena': 'قنا الجديدة', 'West Qena': 'غرب قنا', 'New Rafah': 'رفح الجديدة',
};

const englishNames = new Map(Object.entries(arabicNames).map(([english, arabic]) => [arabic, english]));

export function localizedLocationName(value: string | null | undefined, locale: 'ar' | 'en'): string {
  if (!value) return '';
  const direct = locale === 'ar' ? arabicNames[value] : englishNames.get(value);
  if (direct) return direct;
  return value.split(/([،,])/).map(part => {
    const trimmed = part.trim();
    if (!trimmed || part === '،' || part === ',') return part;
    const translated = locale === 'ar' ? arabicNames[trimmed] : englishNames.get(trimmed);
    return translated ? part.replace(trimmed, translated) : part;
  }).join('');
}

@Pipe({ name: 'locationName', standalone: true, pure: false })
export class LocationNamePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(value: string | null | undefined): string {
    return localizedLocationName(value, this.i18n.locale());
  }
}
