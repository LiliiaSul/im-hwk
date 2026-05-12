import {Component, OnInit} from '@angular/core';
import {OwlOptions} from "ngx-owl-carousel-o";
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {environment} from "../../../../environments/environment";
import {DefaultResponseType} from "../../../../types/default-response.type";

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  extraProducts: ProductType[] = [];
  cart: CartType | null = null;
  serverStaticPath = environment.serverStaticPath;
  totalAmount: number = 0;
  totalCount: number = 0;

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

  constructor(private productService: ProductService, private cartService: CartService) {
  }

  ngOnInit(): void {
    this.productService.getBestProducts()
      .subscribe((data: ProductType[]) => {
        this.extraProducts = data;
      });

    this.cartService.getCart() // Получаем данные корзины
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.cart = data as CartType; // в ответ придет либо объект с пустым массивом товаров, либо с товарами, которые есть в корзине
        this.calculateTotal();
      })
  }

  calculateTotal() { // Считаем общую сумму и количество товаров в корзине
    this.totalAmount = 0; // Изначально обнуляем общую сумму и количество товаров
    this.totalCount = 0;

    if (this.cart) {
      this.cart.items.forEach(item => {
        this.totalAmount += item.quantity * item.product.price;
        this.totalCount += item.quantity;
      });
    }
  }

  updateCount(id: string, count: number) { //изменяем количество товара в корзине
    if (this.cart) { // Проверяем, что корзина не пустая, так как если она пустая, то изменять количество товара в ней нет смысла
      this.cartService.updateCart(id, count) // Отправляем запрос на сервер для изменения количества товара в корзине
        .subscribe(data => {
          if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
            throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
          }

          this.cart = data as CartType; // В ответ придет обновленная корзина, которую мы сохраняем в переменную cart
          this.calculateTotal(); // После изменения количества товара в корзине, пересчитываем общую сумму и количество товаров в корзине
        })
    }
  }
}
