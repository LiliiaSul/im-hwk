import {Component, inject, Input, OnInit} from '@angular/core';
import {ProductType} from "../../../../types/product.type";
import {environment} from "../../../../environments/environment";
import {CartService} from "../../services/cart.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {AuthService} from "../../../core/auth/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FavoriteService} from "../../services/favorite.service";
import {Router} from "@angular/router";

@Component({
  selector: 'product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent implements OnInit {
  @Input() product!: ProductType; //информация о продукте, которая будет передаваться из родительского компонента
  serverStaticPath = environment.serverStaticPath; //путь к статическим файлам на сервере, который будет использоваться для отображения изображений продуктов
  count: number = 1; //количество продукта, которое пользователь может выбрать для добавления в корзину
  @Input() isLight: boolean = false; //стиль карточки продукта (облегченный или обычный), который будет передаваться из родительского компонента
  @Input() countInCart: number | undefined = 0; //количество данного продукта, которое уже находится в корзине или это 0, если продукт еще не добавлен в корзину.
  private _snackBar = inject(MatSnackBar);

  constructor(private cartService: CartService, private authService: AuthService,
              private favoriteService: FavoriteService, private router: Router) {
  }

  ngOnInit(): void {
    if (this.countInCart && this.countInCart > 1) { //если продукт уже был добавлен в корзину ранее и его количество больше 1, устанавливаем начальное значение count равным количеству данного продукта в корзине, чтобы отображать актуальное количество продукта при загрузке компонента
      this.count = this.countInCart;
    }
  }

  addToCart() { //добавление товара в корзину
    this.cartService.updateCart(this.product.id, this.count)
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.countInCart = this.count; //актуальное количество данного продукта в корзине после добавления
      });
  }

  updateCount(value: number) {
    this.count = value; //обновляем количество продукта, которое пользователь выбрал для добавления в корзину
    if (this.countInCart) { //делаем запрос на обновление корзины только если продукт уже находится в корзине, чтобы избежать лишних запросов при изменении количества до добавления в корзину
      this.cartService.updateCart(this.product.id, this.count)
        .subscribe(data => {
          if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
            throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
          }

          this.countInCart = this.count;
        });
    }
  }

  removeFromCart() {
    this.cartService.updateCart(this.product.id, 0)
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.countInCart = 0; //обновляем количество данного продукта в корзине на 0, так как он был удален из корзины
        this.count = 1; //сбрасываем количество продукта обратно на 1, так как по умолчанию при добавлении в корзину количество равно 1
      });
  }

  updateFavorite() { //метод для добавления или удаления товара из избранного
    if (!this.authService.getIsLoggedIn()) { //проверяем, авторизован ли пользователь, так как добавление в избранное доступно только для авторизованных пользователей
      this._snackBar.open('Для добавления в избранное необходимо авторизоваться');
      return;
    }

    if (this.product.isInFavorite) { //если товар уже находится в избранном
      this.favoriteService.removeFavorite(this.product.id) //делаем запрос на удаление товара из избранного по его id
        .subscribe(data => {
          if (data.error) {
            //..
            throw new Error(data.message); //выбрасываем ошибку, если что-то пошло не так при удалении товара из избранного
          }
          this.product.isInFavorite = false;
        })
    } else {
      this.favoriteService.addFavorite(this.product.id) //делаем запрос на добавление товара в избранное по его id
        .subscribe(data => {
          if ((data as DefaultResponseType).error != undefined) {
            throw new Error((data as DefaultResponseType).message);
          }

          this.product.isInFavorite = true;
        });
    }
  }


  navigate() { //
    if (this.isLight) { // если карточка продукта отображается в облегченной версии (isLight = true), то при клике на карточку происходит навигация на страницу с подробной информацией о продукте, используя его URL (this.product.url) для формирования маршрута
      this.router.navigate(['/product/' + this.product.url]);
    }
  }

}
