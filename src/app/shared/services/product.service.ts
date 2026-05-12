import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {ProductType} from "../../../types/product.type";
import {ActiveParamsType} from "../../../types/active-params.type";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) {
  }

  getBestProducts(): Observable<ProductType[]> { // Получаем лучшие продукты с сервера
    return this.http.get<ProductType[]>(environment.api + 'products/best');
  }

  getProducts(params: ActiveParamsType): Observable<{ totalCount: number, pages: number, items: ProductType[] }> { // Получаем все продукты с сервера, включая общее количество и количество страниц для пагинации
    return this.http.get<{ totalCount: number, pages: number, items: ProductType[] }>(environment.api + 'products', {
      params: params
    });
  }

  searchProducts(query: string): Observable<ProductType[]> { // Получаем продукты, соответствующие поисковому запросу, с сервера
    return this.http.get<ProductType[]>(environment.api + 'products/search?query=' + query);
  }

  getProduct(url: string): Observable<ProductType> { // Получаем конкретный продукт по URL с сервера
    return this.http.get<ProductType>(environment.api + 'products/' + url);
  }
}
