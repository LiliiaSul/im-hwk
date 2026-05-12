import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {CategoryType} from "../../../types/category.type";
import {environment} from "../../../environments/environment";
import {TypeType} from "../../../types/type.type";
import {map} from "rxjs";
import {CategoryWithTypeType} from "../../../types/category-with-type.type";

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {
  }

  getCategories(): Observable<CategoryType[]> { //получаем нужные категории для header
    return this.http.get<CategoryType[]>(environment.api + 'categories');
  }

  getCategoriesWithTypes(): Observable<CategoryWithTypeType[]> {
    return this.http.get<TypeType[]>(environment.api + 'types') // получаем все типы с категориями из ответа сервера
      .pipe(
        map((items: TypeType[]) => {
          const array: CategoryWithTypeType[] = []; // создаем новый массив для хранения категорий с типами
          items.forEach((item: TypeType) => { // проходим по каждому типу из ответа сервера
            const foundItem = array.find(arrayItem => arrayItem.url === item.category.url); // ищем в новом массиве категорию, которая соответствует категории типа из ответа сервера

            if (foundItem) { // если категория уже есть в новом массиве, то добавляем тип к этой категории
              foundItem.types.push({
                id: item.id,
                name: item.name,
                url: item.url,
              });
            } else { // если категории нет в новом массиве, то создаем новую категорию и добавляем к ней тип
              array.push({
                id: item.category.id,
                name: item.category.name,
                url: item.category.url,
                types: [
                  {
                    id: item.id,
                    name: item.name,
                    url: item.url,
                  }]
              });
            }
          });

          return array;
        })
      );
  }

}
