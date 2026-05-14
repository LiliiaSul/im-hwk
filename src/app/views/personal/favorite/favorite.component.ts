import {Component, OnInit} from '@angular/core';
import {FavoriteService} from "../../../shared/services/favorite.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {FavoriteType} from "../../../../types/favorite.type";
import {environment} from "../../../../environments/environment";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {
  products: FavoriteType[] = [];
  serverStaticPath = environment.serverStaticPath; //путь к статическим файлам на сервере
  count: number = 1; //количество товара, которое пользователь хочет добавить в корзину

  constructor(private favoriteService: FavoriteService, private cartService: CartService) {
  }

  ngOnInit(): void {
    this.favoriteService.getFavorites() //получаем избранные товары
      .subscribe(data => {

        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          const error = (data as DefaultResponseType).message;
          throw new Error(error); //выбрасываем ошибку
        }

        this.products = data as FavoriteType[]; //если все хорошо, сохраняем избранные товары в переменную

        this.cartService.getCart() //получаем данные корзины, чтобы узнать, какие товары из избранного уже есть в корзине и сколько их там
          .subscribe(cartData => {
            if ((cartData as DefaultResponseType).error !== undefined) { //если есть ошибка
              const error = (cartData as DefaultResponseType).message;
              throw new Error(error); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
            }

            const cartDataResponse = cartData as CartType; //сохраняем данные корзины

            if (cartDataResponse && cartDataResponse.items) { //если данные корзины получены успешно, проходим по каждому товару из избранного и проверяем, есть ли он в корзине
              this.products.forEach(product => {
                const favoriteInCart = cartDataResponse.items.find(item => item.product.id === product.id);
                if (favoriteInCart) {
                  product.countInCart = favoriteInCart.quantity; //если товар из избранного найден в корзине, сохраняем его количество в корзине в свойство countInCart этого товара
                }
              });
            }
          });
      });
  }

  removeFromFavorites(id: string) { //удаляем товар из избранного
    this.favoriteService.removeFavorite(id)
      .subscribe(data => {
        if (data.error) {
          //..
          throw new Error(data.message); //выбрасываем ошибку, если что-то пошло не так при удалении товара из избранного
        }

        this.products = this.products.filter(item => item.id != id); //обновляем список товаров, удаляя из него товар с указанным id
      })
  }

  addToCart(product: FavoriteType) {
    this.cartService.updateCart(product.id, this.count) //добавляем товар в корзину
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }
        product.countInCart = this.count;
      });
  }

  removeFromCart(product: FavoriteType) {
    this.cartService.updateCart(product.id, 0) //удаляем товар из корзины, устанавливая его количество в 0
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        product.countInCart = 0;
        this.count = 1;
      });
  }

  updateCount(value: number, product: FavoriteType) {
    this.count = value; //обновляем значение счетчика количества товара в родительском компоненте FavoriteComponent
    if (product.countInCart) { //если товар уже есть в корзине, обновляем его количество
      this.cartService.updateCart(product.id, this.count)
        .subscribe(data => {
          if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
            throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
          }
          product.countInCart = this.count;
        });
    }
  }
}
