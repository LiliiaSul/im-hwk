import {Component, HostListener, OnInit} from '@angular/core';
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {CategoryService} from "../../../shared/services/category.service";
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsUtil} from "../../../shared/utils/active-params.util";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {AppliedFilterType} from "../../../../types/applied-filter.type";
import {debounceTime} from "rxjs";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {FavoriteService} from "../../../shared/services/favorite.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {FavoriteType} from "../../../../types/favorite.type";
import {AuthService} from "../../../core/auth/auth.service";


@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  products: ProductType[] = [];
  categoriesWithTypes: CategoryWithTypeType[] = [];
  activeParams: ActiveParamsType = {types: []}; //хранение активных параметров фильтра
  appliedFilters: AppliedFilterType[] = [];
  sortingOpen = false;
  sortingOptions: { name: string, value: string }[] = [ //опции сортировки
    {name: 'От А до Я', value: 'az-asc'},
    {name: 'От Я до А', value: 'az-desc'},
    {name: 'По возрастанию цены', value: 'price-asc'},
    {name: 'По убыванию цены', value: 'price-desc'},
  ];
  pages: number[] = [];
  cart: CartType | null = null;
  favoriteProducts: FavoriteType[] | null = null;

  constructor(private productService: ProductService, private categoryService: CategoryService,
              private activatedRoute: ActivatedRoute, private router: Router, private cartService: CartService,
              private favoriteService: FavoriteService, private authService: AuthService) {
  }

  ngOnInit(): void {
    this.cartService.getCart() // сначала запрашиваем данные корзины
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.cart = data as CartType; //если данные корзины получены успешно, сохраняем их в переменную cart

        if (this.authService.getIsLoggedIn()) { //если пользователь авторизован, то будем делать запрос на получение данных избранного
          this.favoriteService.getFavorites() //после получения данных корзины запрашиваем данные избранного, чтобы при загрузке каталога сразу отображать, какие товары уже есть в избранном, и обрабатывать возможные ошибки при запросе избранного (например, если пользователь не авторизован)
            .subscribe(
              {
                next: (data) => {
                  if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
                    const error = (data as DefaultResponseType).message;
                    this.processCatalog(); //продолжаем загрузку каталога, чтобы пользователь все равно мог просматривать каталог и добавлять товары в корзину, даже если данные избранного не были получены из-за ошибки (например, пользователь не авторизован)
                    throw new Error(error); //выбрасываем ошибку
                  }

                  this.favoriteProducts = data as FavoriteType[]; //если ошибки нет, сохраняем данные избранного в переменную favoriteProducts
                  this.processCatalog(); //продолжаем загрузку каталога после получения данных избранного, чтобы отображать, какие товары уже есть в избранном
                },
                error: (error) => {
                  this.processCatalog(); //если при запросе избранного произошла ошибка (например, пользователь не авторизован), продолжаем загрузку каталога без данных избранного, чтобы пользователь все равно мог просматривать каталог и добавлять товары в корзину
                }
              });
        } else { //если пользователь не авторизован, просто продолжаем загрузку каталога без запроса данных избранного, чтобы пользователь все равно мог просматривать каталог и добавлять товары в корзину
          this.processCatalog();
        }
      });
  }


  processCatalog() { //метод для загрузки данных каталога, который вызывается после получения данных корзины и попытки получить данные избранного
    this.categoryService.getCategoriesWithTypes()
      .subscribe(data => {
        this.categoriesWithTypes = data; // Получаем массив категорий с типами из ответа сервера и сохраняем его в переменную categoriesWithTypes для отображения в шаблоне

        this.activatedRoute.queryParams
          .pipe(
            debounceTime(500) //добавляем оператор debounceTime для задержки обработки изменений query параметров на 500 миллисекунд, чтобы избежать слишком частых обновлений при быстром изменении параметров в URL
          )
          .subscribe(params => { //подписываемся на изменения query параметров в URL, чтобы обновлять активные фильтры при их изменении
            this.activeParams = ActiveParamsUtil.processParams(params); //обрабатываем query параметры с помощью утилитного класса ActiveParamsUtil и сохраняем результат в переменную activeParams для отображения в шаблоне

            this.appliedFilters = []; //очищаем массив примененных фильтров перед его заполнением на основе активных параметров
            this.activeParams.types.forEach(url => {
              for (let i = 0; i < this.categoriesWithTypes.length; i++) { //проходим по каждой категории в массиве категорий с типами
                const foundType = this.categoriesWithTypes[i].types.find(type => type.url === url); //находим тип в текущей категории, который соответствует URL типа из активных параметров
                if (foundType) { //если такой тип найден, добавляем его в массив примененных фильтров с его названием и URL параметром для возможности отображения и удаления этого фильтра в шаблоне
                  this.appliedFilters.push({
                    name: foundType.name,
                    urlParam: foundType.url
                  });
                }
              }
            });

            if (this.activeParams.heightFrom) {
              this.appliedFilters.push({
                name: 'Высота: от ' + this.activeParams.heightFrom + ' см',
                urlParam: 'heightFrom'
              });
            }
            if (this.activeParams.heightTo) {
              this.appliedFilters.push({
                name: 'Высота: до ' + this.activeParams.heightTo + ' см',
                urlParam: 'heightTo'
              });
            }
            if (this.activeParams.diameterFrom) {
              this.appliedFilters.push({
                name: 'Диаметр: от ' + this.activeParams.diameterFrom + ' см',
                urlParam: 'diameterFrom'
              });
            }
            if (this.activeParams.diameterTo) {
              this.appliedFilters.push({
                name: 'Диаметр: до ' + this.activeParams.diameterTo + ' см',
                urlParam: 'diameterTo'
              });
            }

            this.productService.getProducts(this.activeParams) //вызываем метод getProducts сервиса ProductService для получения продуктов на основе активных параметров фильтрации и сортировки
              .subscribe(data => {
                this.pages = []; //очищаем массив страниц перед его заполнением на основе общего количества страниц из ответа сервера
                for (let i = 1; i <= data.pages; i++) { //проходим от 1 до общего количества страниц, добавляя каждый номер страницы в массив pages для отображения пагинации в шаблоне
                  this.pages.push(i);
                }

                if (this.cart && this.cart.items.length > 0) { //если в корзине есть товары
                  this.products = data.items.map(product => { //проходим по каждому продукту из ответа сервера и добавляем ему свойство countInCart, которое показывает количество этого продукта в корзине, если он там есть
                    if (this.cart) {
                      const productInCart = this.cart.items.find(item => item.product.id === product.id); //находим товар в корзине, который соответствует текущему продукту из ответа сервера, сравнивая их ID
                      if (productInCart) {
                        product.countInCart = productInCart.quantity; //добавляем свойство countInCart к продукту и устанавливаем его значение равным количеству этого продукта в корзине
                      }
                    }

                    return product; //возвращаем продукт с добавленным свойством countInCart (если он есть в корзине) для сохранения его в массиве products
                  });
                } else {
                  this.products = data.items; //если корзина пуста, просто сохраняем массив продуктов из ответа сервера в переменную products для отображения в шаблоне
                }

                if (this.favoriteProducts) { //если есть товары в избранном
                  this.products = this.products.map(product => { //заменяем массив на новый
                    const productInFavorite = this.favoriteProducts?.find(item => item.id === product.id); //находим товар в избранном, который соответствует текущему продукту из массива products, сравнивая их ID
                    if (productInFavorite) { //если такой товар найден в избранном, добавляем к продукту новое свойство isInFavorite и устанавливаем его значение в true, чтобы отображать, что этот продукт находится в избранном пользователя
                      product.isInFavorite = true;
                    }
                    return product; //возвращаем продукт с добавленным свойством isInFavorite (если он есть в избранном) для сохранения его в массиве products
                  })
                }
              });
          });
      })
  }

  removeAppliedFilter(appliedFilter: AppliedFilterType) {
    if (appliedFilter.urlParam === 'heightFrom' || appliedFilter.urlParam === 'heightTo' ||
      appliedFilter.urlParam === 'diameterFrom' || appliedFilter.urlParam === 'diameterTo') { //если удаляемый фильтр относится к диапазону высоты или диаметра, удаляем соответствующий параметр из активных параметров
      delete this.activeParams[appliedFilter.urlParam];
    } else { //если удаляемый фильтр относится к типу продукта, удаляем его URL параметр из массива типов в активных параметрах
      this.activeParams.types = this.activeParams.types.filter(item => item !== appliedFilter.urlParam); //фильтруем массив типов, оставляя только те, которые не совпадают с URL параметром удаляемого фильтра
    }


    this.activeParams.page = 1; //при удалении фильтра сбрасываем номер страницы на 1, чтобы отображать результаты с первой страницы
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }

  toggleSorting() {
    this.sortingOpen = !this.sortingOpen;
  }

  sort(value: string) {
    this.activeParams.sort = value; //устанавливаем выбранный параметр сортировки в активных параметрах

    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }

  @HostListener('document:click', ['$event']) //метод для обработки кликов по документу, который вызывается при каждом клике на странице
  click(event: Event) {
    if (this.sortingOpen && (event.target as HTMLElement).className.indexOf('catalog-sorting') === -1) { //проверяем, что клик был вне области опций сортировки, и если это так, то закрываем список опций сортировки
      this.sortingOpen = false;
    }
  }

  openPage(page: number) { //устанавливаем выбранную страницу в активных параметрах
    this.activeParams.page = page;

    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }


  openPrevPage() { //если текущая страница больше 1, уменьшаем номер страницы на единицу
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;

      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      });
    }
  }

  openNextPage() {
    const currentPage = this.activeParams.page || 1;
    if (currentPage < this.pages.length) { //если текущая страница меньше общего количества страниц, увеличиваем номер страницы на единицу
      this.activeParams.page = currentPage + 1;

      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      });
    }
  }
}
