import {Component, OnInit} from '@angular/core';
import {CategoryService} from "../services/category.service";
import {CategoryWithTypeType} from "../../../types/category-with-type.type";

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  categories: CategoryWithTypeType[] = []; // массив для хранения категорий с типами

  constructor(private categoryService: CategoryService) {
  }

  ngOnInit(): void {
    this.categoryService.getCategoriesWithTypes() // получаем категории с типами из сервиса
      .subscribe((categories: CategoryWithTypeType[]) => {
        this.categories = categories.map(item => { //проходим по каждому элементу массива категорий
          return Object.assign({typesUrl: item.types.map(item => item.url)}, item) // добавляем новое поле typesUrl, которое содержит массив URL типов для каждой категории
        });
      });
  }

}
