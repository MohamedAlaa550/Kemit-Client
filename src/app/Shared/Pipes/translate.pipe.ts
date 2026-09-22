import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../Core/I18n/translation.service';
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform { private i18n = inject(TranslationService); transform(key: string) { return this.i18n.translate(key); } }
