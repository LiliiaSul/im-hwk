import {Injectable} from '@angular/core';
import {environment} from "../../../environments/environment";
import {Observable, Subject} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {CartType} from "../../../types/cart.type";
import {tap} from "rxjs";
import {DefaultResponseType} from "../../../types/default-response.type";

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private count: number = 0; //делаем приватное свойство count для хранения текущего количества товаров в корзине
  count$: Subject<number> = new Subject<number>; //используем Subject для того, чтобы другие компоненты могли подписаться на изменения количества товаров в корзине и обновлять свое состояние при каждом изменении

  constructor(private http: HttpClient) {
  }

  setCount(count: number) { //метод для обновления количества товаров в корзине
    this.count = count; //обновляем локальное состояние count
    this.count$.next(this.count); //отправляем новое значение count всем подписчикам, которые подписались на count$, чтобы они могли обновить свое состояние и отобразить актуальное количество товаров в корзине
  }


  getCart(): Observable<CartType | DefaultResponseType> { //метод для получения текущей корзины пользователя
    return this.http.get<CartType>(environment.api + 'cart', {withCredentials: true});
  }

  getCartCount(): Observable<{ count: number } | DefaultResponseType> { //метод для получения количества товаров в корзине
    return this.http.get<{ count: number }>(environment.api + 'cart/count', {withCredentials: true})
      .pipe( //используем оператор tap для обновления локального состояния count при получении данных от сервера
        tap(data => {
          if (!data.hasOwnProperty('error')) { //проверяем, что в ответе от сервера нет ошибки, если есть, то не обновляем count и не отправляем новое значение подписчикам
            this.setCount((data as { count: number }).count);
          }
        })
      );
  }

  updateCart(productId: string, quantity: number): Observable<CartType | DefaultResponseType> { //метод для обновления корзины, который принимает идентификатор продукта и количество
    return this.http.post<CartType>(environment.api + 'cart', {productId, quantity}, {withCredentials: true})
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) { //проверяем, что в ответе от сервера нет ошибки, если есть, то не обновляем count и не отправляем новое значение подписчикам
            let count = 0; //считаем общее количество товаров в корзине, суммируя количество каждого товара из массива items, который возвращается в ответе от сервера при обновлении корзины
            (data as CartType).items.forEach(item => {
              count += item.quantity;
            });
            this.setCount(count);
          }
        })
      );
  }
}
