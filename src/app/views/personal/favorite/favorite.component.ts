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
  count: number = 1;
  countInCart: number = 0; //количество данного продукта в корзине

  constructor(private favoriteService: FavoriteService, private cartService: CartService) {
  }

  ngOnInit(): void {
    this.favoriteService.getFavorites() //получаем избранные товары
      .subscribe(data => {

        this.cartService.getCart() //получаем данные корзины, чтобы узнать, какие товары из избранного уже есть в корзине и сколько их там
          .subscribe(cartData => {
            if ((cartData as DefaultResponseType).error !== undefined) { //если есть ошибка
              const error = (cartData as DefaultResponseType).message;
              throw new Error(error); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
            }

            const cartDataResponse = cartData as CartType; //сохраняем данные корзины

            if (cartDataResponse) { //если данные корзины получены успешно, то ищем в ней товары из избранного, чтобы отобразить информацию о количестве этих товаров в корзине
              const favoritesInCart = cartDataResponse.items.find(item => item.product.id === this.products[0].id);
              if (favoritesInCart) { //если товар из избранного найден в корзине
                this.countInCart = favoritesInCart.quantity; // добавляем к нему информацию о количестве в корзине
                this.count = this.countInCart;
              }
            }
          });


        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          const error = (data as DefaultResponseType).message;
          throw new Error(error); //выбрасываем ошибку
        }

          this.products = data as FavoriteType[]; //если все хорошо, сохраняем избранные товары в переменную
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

        this.countInCart = this.count; //актуальное количество данного продукта в корзине после добавления
      });
  }

  removeFromCart(product: FavoriteType) {
    this.cartService.updateCart(product.id, 0) //удаляем товар из корзины, устанавливая его количество в 0
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.countInCart = 0;
        this.count = 1;
      });
  }

  updateCount(value: number, product: FavoriteType) {
    this.count = value;
    if (this.countInCart) { //если товар уже есть в корзине, то обновляем его количество
      this.cartService.updateCart(product.id, this.count)
        .subscribe(data => {
          if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
            throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
          }

          this.countInCart = this.count;
        });
    }
  }

}
