import {Injectable} from '@angular/core';
import {Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  isShowed$ = new Subject<boolean>(); //Subject - это специальный тип Observable, который позволяет не только подписываться на него, но и отправлять ему новые значения. В данном случае, мы используем Subject для управления состоянием отображения загрузчика (loader).

  constructor() {
  }

  show() { // Метод show() вызывается для отображения загрузчика. Он отправляет значение true в Subject, что означает, что загрузчик должен быть показан.
    this.isShowed$.next(true);
  }

  hide() {
    this.isShowed$.next(false);
  }
}
