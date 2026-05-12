import {Component, Input, OnInit} from '@angular/core';
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {ActiveParamsUtil} from "../../utils/active-params.util";

@Component({
  selector: 'category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent implements OnInit {

  @Input() categoryWithTypes: CategoryWithTypeType | null = null; // Получаем данные о категории с типами из родительского компонента через Input декоратор и сохраняем их в переменную categoryWithTypes для отображения в шаблоне
  @Input() type: string | null = null; // Получаем тип фильтра (например, 'height' или 'diameter') из родительского компонента через Input декоратор и сохраняем его в переменную type для отображения в шаблоне
  open = false; //управление состоянием открытости фильтра
  activeParams: ActiveParamsType = {types: []}; //хранение активных параметров фильтра

  from: number | null = null; //хранение значения "от" для фильтра
  to: number | null = null; //хранение значения "до" для фильтра

  get title(): string {
    if (this.categoryWithTypes) {
      return this.categoryWithTypes.name
    } else if (this.type) {
      if (this.type === 'height') {
        return 'Высота';
      } else if (this.type === 'diameter') {
        return 'Диаметр';
      }
    }

    return '';
  }

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => { //подписываемся на изменения query параметров в URL, чтобы обновлять активные параметры фильтра при изменении URL
      this.activeParams = ActiveParamsUtil.processParams(params); //устанавливаем в activeParams результат обработки query параметров с помощью утилитного метода processParams

      if (this.type) { //если тип фильтра определен, устанавливаем состояние открытости фильтра и значения "от" и "до" в зависимости от активных параметров фильтра для данного типа
        if (this.type === 'height') {
          this.open = !!(this.activeParams.heightFrom || this.activeParams.heightTo); //если один из параметров heightFrom или heightTo есть в активных параметрах фильтра, устанавливаем open в true, иначе в false
          this.from = this.activeParams.heightFrom ? +this.activeParams.heightFrom : null;
          this.to = this.activeParams.heightTo ? +this.activeParams.heightTo : null;
        } else if (this.type === 'diameter') {
          this.open = !!(this.activeParams.diameterFrom || this.activeParams.diameterTo);
          this.from = this.activeParams.diameterFrom ? +this.activeParams.diameterFrom : null;
          this.to = this.activeParams.diameterTo ? +this.activeParams.diameterTo : null;
        }
      } else { //если тип фильтра не определен, значит мы работаем с категориями
        if (params['types']) {
          this.activeParams.types = Array.isArray(params['types']) ? params['types'] : [params['types']]; //если в query параметрах есть параметр 'types', проверяем, является ли он массивом, и если нет, преобразуем его в массив, чтобы всегда работать с массивом типов в activeParams.types
        }

        if (this.categoryWithTypes && this.categoryWithTypes.types //если есть данные о категории с типами и массив типов не пустой, проверяем, есть ли в активных параметрах фильтра хотя бы один тип, который соответствует типу из категории, и если да, устанавливаем open в true
          && this.categoryWithTypes.types.length > 0 &&
          this.categoryWithTypes.types.some(type => this.activeParams.types.find(item => type.url === item))) {
          this.open = true;
        }
      }
    });
  }

  toggle() { //метод для переключения состояния открытости фильтра при клике на заголовок
    this.open = !this.open;
  }

  updateFilterParam(url: string, checked: boolean) { //изменяем значения фильтра
    if (this.activeParams.types && this.activeParams.types.length > 0) { //если есть выбранные типы в активных параметрах фильтра, проверяем, нужно ли добавить или удалить тип в зависимости от состояния флажка
      const existingTypeInParams = this.activeParams.types.find(item => item === url); //проверяем, есть ли уже тип в активных параметрах фильтра
      if (existingTypeInParams && !checked) { //если тип уже есть в активных параметрах фильтра и флажок не отмечен, удаляем его из активных параметров фильтра
        this.activeParams.types = this.activeParams.types.filter(item => item !== url);
      } else if (!existingTypeInParams && checked) { //если типа нет в активных параметрах фильтра и флажок отмечен, добавляем его в активные параметры фильтра
        this.activeParams.types = [...this.activeParams.types, url]; //создаем новый массив типов, добавляя новый тип к существующим типам в активных параметрах фильтра
      }
    } else if (checked) { //если нет выбранных типов в активных параметрах фильтра и флажок отмечен, устанавливаем активные параметры фильтра с новым типом
      this.activeParams.types = [url];
    }

    this.activeParams.page = 1; //при изменении фильтра сбрасываем номер страницы в активных параметрах фильтра на 1, чтобы при навигации к странице каталога отображались результаты с первой страницы
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams //передаем активные параметры фильтра в виде query параметров при навигации к странице каталога
    });
  }

  updateFilterParamFromTo(param: string, value: string) {
    if (param === 'heightFrom' || param === 'heightTo' || param === 'diameterFrom' || param === 'diameterTo') {
      if (this.activeParams[param] && !value) { //если значение для параметра уже есть в активных параметрах фильтра и новое значение пустое, удаляем его из активных параметров фильтра
        delete this.activeParams[param]
      } else { //если значение для параметра нет в активных параметрах фильтра или новое значение не пустое, устанавливаем его в активные параметры фильтра
        this.activeParams[param] = value;
      }

      this.activeParams.page = 1;
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      });
    }
  }
}
