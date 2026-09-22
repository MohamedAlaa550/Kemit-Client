import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './Shared/Components/header/header.component';
import { FooterComponent } from './Shared/Components/footer/footer.component';
import { LoadingComponent } from './Shared/Components/loading/loading.component';
import { ToastComponent } from './Shared/Components/toast/toast.component';
import { TranslatePipe } from './Shared/Pipes/translate.pipe';
@Component({selector:'app-root',imports:[RouterOutlet,HeaderComponent,FooterComponent,LoadingComponent,ToastComponent,TranslatePipe],templateUrl:'./app.html',styleUrl:'./app.css',changeDetection:ChangeDetectionStrategy.OnPush}) export class App {}
