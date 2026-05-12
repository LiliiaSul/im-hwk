import { Component, OnInit } from '@angular/core';
import {LoaderService} from "../../services/loader.service";

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
  isShowed: boolean = false;

  constructor(private loaderService: LoaderService) { }

  ngOnInit(): void {
    this.loaderService.isShowed$ // Подписываемся на Observable isShowed$ из LoaderService, чтобы получать обновления о том, когда нужно показать или скрыть загрузчик.
      .subscribe((isShowed: boolean) => {
        this.isShowed = isShowed; // Когда приходит новое значение, мы обновляем переменную isShowed, которая используется в шаблоне для управления отображением загрузчика.
      })
  }

}
