import {Component, HostListener, inject, Input, OnInit} from '@angular/core';
import {AuthService} from "../../../core/auth/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {CartService} from "../../services/cart.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {ProductService} from "../../services/product.service";
import {ProductType} from "../../../../types/product.type";
import {environment} from "../../../../environments/environment";
import {FormControl} from "@angular/forms";
import {debounceTime} from "rxjs";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  searchField = new FormControl(); //создаем FormControl для поля поиска, который предоставляет нам Observable для отслеживания изменений значения в поле ввода
  products: ProductType[] = [];
  serverStaticPath = environment.serverStaticPath;
  showedSearch: boolean = false;

  count: number = 0;
  private _snackBar = inject(MatSnackBar);
  isLogged: boolean = false; //актуальное состояние авторизации, которое будет обновляться при изменении статуса авторизации в AuthService
  @Input() categories: CategoryWithTypeType[] = []; // Получаем категории с типами из родительского компонента LayoutComponent

  constructor(private authService: AuthService, private router: Router, private cartService: CartService,
              private productService: ProductService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.searchField.valueChanges //подписываемся на изменения Observable, которое будет слать нам события при каждом изменении значения в поле ввода
      .pipe(
        debounceTime(500) //добавляем оператор debounceTime для задержки обработки изменений query параметров на 500 миллисекунд, чтобы избежать слишком частых обновлений при быстром изменении параметров в URL
      )
      .subscribe(value => { //в value будет то значение, которое пользователь вводит в поле поиска
        if (value && value.length > 2) { //если значение не пустое и его длина больше 2 символов, то выполняем поиск продуктов
          this.productService.searchProducts(value)
            .subscribe(data => {
              this.products = data;
              this.showedSearch = true; //показываем результаты поиска
            });
        } else { //иначе очищаем список продуктов, чтобы не отображать результаты поиска
          this.products = [];
        }
      });
    this.getCartCount();

    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => { //подписываемся на изменения статуса авторизации в AuthService и обновляем локальное состояние isLogged при каждом изменении
      this.isLogged = isLoggedIn;
      this.getCartCount(); //при каждом изменении статуса авторизации обновляем количество товаров в корзине
    });


    this.cartService.count$ //подписываемся на изменения количества товаров в корзине и обновляем локальное состояние count при каждом изменении
      .subscribe(count => {
        this.count = count;
      })
  }

  getCartCount() {
    this.cartService.getCartCount() //метод для получения количества товаров в корзине
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.count = (data as { count: number }).count; //обновляем локальное состояние count при получении данных от сервера
      });
  }

  logout() {
    this.authService.logout()
      .subscribe({
        next: () => {
          this.doLogout();
        },
        error: () => {
          this.doLogout();
        }
      })
  }

  doLogout() {
    this.authService.removeTokens();
    this.authService.userId = null;
    this._snackBar.open('Вы вышли из системы');
    this.router.navigate(['/']);
  }


  selectProduct(url: string) { //метод для обработки выбора продукта из результатов поиска, который вызывается при клике на результат поиска
    this.router.navigate(['/product/' + url]);
    this.searchField.setValue('');
    this.products = []; //очищаем список продуктов после выбора продукта, чтобы не отображать результаты поиска
  }

  @HostListener('document:click', ['$event']) //метод для обработки кликов по документу, который вызывается при каждом клике на странице
  click(event: Event) {
    if (this.showedSearch && (event.target as HTMLElement).className.indexOf('search-product') === -1) { //проверяем, что клик был вне области результатов поиска, и если это так, то скрываем результаты поиска
      this.showedSearch = false;
    }
  }

}
