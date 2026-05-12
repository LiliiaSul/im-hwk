import {Component, inject, OnInit} from '@angular/core';
import {OwlOptions} from "ngx-owl-carousel-o";
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {ActivatedRoute} from "@angular/router";
import {environment} from "../../../../environments/environment";
import {CartService} from "../../../shared/services/cart.service";
import {FavoriteService} from "../../../shared/services/favorite.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {FavoriteType} from "../../../../types/favorite.type";
import {AuthService} from "../../../core/auth/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CartType} from "../../../../types/cart.type";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  count: number = 1; //связано с компонентом CountSelectorComponent для отображения и изменения количества товара на странице
  recommendedProducts: ProductType[] = [];
  product!: ProductType;
  serverStaticPath = environment.serverStaticPath;
  private _snackBar = inject(MatSnackBar);

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    margin: 24,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 2
      },
      740: {
        items: 3
      },
      940: {
        items: 4
      }
    },
    nav: false
  }

  constructor(private productService: ProductService, private activatedRoute: ActivatedRoute,
              private cartService: CartService, private favoriteService: FavoriteService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => { // Получаем URL продукта из параметров маршрута и запрашиваем его данные с сервера
      this.productService.getProduct(params['url']) // делаем запрос на получение данных о конкретном продукте по его URL, который был получен из параметров маршрута
        .subscribe((data: ProductType) => {
          this.product = data; // Устанавливаем сразу данные о конкретном продукте, независимо от того, есть ли он в корзине или избранном

          this.cartService.getCart() //получаем данные корзины пользователя при инициализации компонента
            .subscribe(cartData => {
              if ((cartData as DefaultResponseType).error !== undefined) { //если есть ошибка
                throw new Error((cartData as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
              }

              const cartDataResponse = cartData as CartType; //если все хорошо, то сохраняем данные корзины в переменную

              if (cartDataResponse) { //если данные корзины успешно получены
                const productInCart = cartDataResponse.items.find(item => item.product.id === this.product.id); //ищем в корзине пользователя товар, который соответствует отображаемому продукту на странице, по его id
                if (productInCart) { //если такой товар найден в корзине
                  this.product.countInCart = productInCart.quantity; //добавляем к данным о продукте новое свойство countInCart, которое будет хранить количество данного продукта в корзине пользователя
                  this.count = this.product.countInCart; //устанавливаем значение счетчика количества товара на странице равным количеству данного продукта в корзине, чтобы отображать актуальное количество при загрузке страницы, если продукт уже находится в корзине пользователя
                }
              }
            });

          if (this.authService.getIsLoggedIn()) { //осуществляем запрос, если только пользователь залогинен
            this.favoriteService.getFavorites() //получаем избранные товары
              .subscribe(data => {
                if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
                  const error = (data as DefaultResponseType).message;
                  throw new Error(error); //выбрасываем ошибку
                }

                const products = data as FavoriteType[]; //если все хорошо, то сохраняем товары в переменную
                const currentProductExists = products.find(item => item.id === this.product.id); //ищем в списке избранных товаров товар, который соответствует отображаемому продукту на странице, по его id, чтобы определить, находится ли данный продукт в избранном пользователя
                if (currentProductExists) { //если такой товар найден в избранном
                  this.product.isInFavorite = true;
                }
              });
          }
        })
    });

    this.productService.getBestProducts()
      .subscribe((data: ProductType[]) => {
        this.recommendedProducts = data;
      });
  }

  updateCount(value: number) { //Принимает новое значение счетчика количества товара из дочернего компонента CountSelectorComponent
    this.count = value; //Обновляем значение счетчика количества товара в родительском компоненте DetailComponent
    if (this.product.countInCart) { //делаем запрос на обновление корзины только если продукт уже находится в корзине, чтобы избежать лишних запросов при изменении количества до добавления в корзину
      this.cartService.updateCart(this.product.id, this.count)
        .subscribe(data => {
          if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
            throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
          }

          this.product.countInCart = this.count;
        });
    }
  }

  addToCart() {
    this.cartService.updateCart(this.product.id, this.count)
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.product.countInCart = this.count;
      });
  }

  removeFromCart() {
    this.cartService.updateCart(this.product.id, 0)
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.product.countInCart = 0; //обновляем количество данного продукта в корзине на 0, так как он был удален из корзины
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

}
