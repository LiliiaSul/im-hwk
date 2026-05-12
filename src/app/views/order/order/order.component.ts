import {Component, ElementRef, inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CartService} from "../../../shared/services/cart.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {CartType} from "../../../../types/cart.type";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {DeliveryType} from "../../../../types/delivery.type";
import {FormBuilder, Validators} from "@angular/forms";
import {PaymentType} from "../../../../types/payment.type";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {OrderService} from "../../../shared/services/order.service";
import {OrderType} from "../../../../types/order.type";
import {HttpErrorResponse} from "@angular/common/http";
import {UserService} from "../../../shared/services/user.service";
import {UserInfoType} from "../../../../types/user-info.type";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  deliveryType: DeliveryType = DeliveryType.delivery; // по умолчанию выбран тип доставки "Доставка"
  deliveryTypes = DeliveryType; // для отображения всех вариантов доставки в шаблоне
  paymentTypes = PaymentType;

  orderForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    fatherName: [''],
    phone: ['', Validators.required],
    paymentType: [PaymentType.cardToCourier, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
    comment: ['']
  });

  cart: CartType | null = null;
  totalAmount: number = 0;
  totalCount: number = 0;
  private _snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @ViewChild('popup') popup!: TemplateRef<ElementRef>; // ссылка на попап из шаблона для отображения его при создании заказа
  dialogRef: MatDialogRef<any> | null = null; // ссылка на открытый попап, чтобы можно было его закрыть после создания заказа

  constructor(private cartService: CartService, private router: Router,
              private fb: FormBuilder, private orderService: OrderService,
              private userService: UserService, private authService: AuthService) {
    this.updateDeliveryTypeValidation(); // при загрузке компонента устанавливаем правильную валидацию полей в зависимости от выбранного типа доставки
  }


  ngOnInit(): void {
    this.cartService.getCart()
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.cart = data as CartType; // в ответ придет либо объект с пустым массивом товаров, либо с товарами, которые есть в корзине

        if (!this.cart || (this.cart && this.cart.items.length === 0)) { //если в корзине ничего не нашли
          this._snackBar.open('Корзина пустая');
          this.router.navigate(['/']);
          return; // перенаправляем пользователя на главную страницу, так как корзина пустая и отображать ее нет смысла
        }
        this.calculateTotal();
      });

    if (this.authService.getIsLoggedIn()) { // если пользователь авторизован, то при загрузке страницы заказа заполняем форму данными из профиля пользователя, чтобы ему не нужно было вводить эти данные вручную
      this.userService.getUserInfo()
        .subscribe(data => {
          if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
            throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
          }

          const userInfo = data as UserInfoType; //приводим полученные данные к типу UserInfoType

          const paramsToUpdate = {
            firstName: userInfo.firstName ? userInfo.firstName : '',
            lastName: userInfo.lastName ? userInfo.lastName : '',
            fatherName: userInfo.fatherName ? userInfo.fatherName : '',
            phone: userInfo.phone ? userInfo.phone : '',
            paymentType: userInfo.paymentType ? userInfo.paymentType : PaymentType.cashToCourier,
            email: userInfo.email ? userInfo.email : '',
            street: userInfo.street ? userInfo.street : '',
            house: userInfo.house ? userInfo.house : '',
            entrance: userInfo.entrance ? userInfo.entrance : '',
            apartment: userInfo.apartment ? userInfo.apartment : '',
            comment: ''
          }

          this.orderForm.setValue(paramsToUpdate); //устанавливаем полученные данные в форму, если какое-то поле не заполнено, то устанавливаем пустую строку
          if (userInfo.deliveryType) {
            this.deliveryType = userInfo.deliveryType;
          }
        });
    }
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

  changeDeliveryType(type: DeliveryType) { // метод для изменения типа доставки
    this.deliveryType = type;
    this.updateDeliveryTypeValidation(); // обновляем валидацию полей в зависимости от выбранного типа доставки
  }


  updateDeliveryTypeValidation() {
    if (this.deliveryType == DeliveryType.delivery) { // если выбран тип доставки "Курьером", то делаем поля "Улица" и "Дом" обязательными для заполнения, иначе убираем эти требования и очищаем эти поля
      this.orderForm.get('street')?.setValidators(Validators.required);
      this.orderForm.get('house')?.setValidators(Validators.required);
    } else {
      this.orderForm.get('street')?.removeValidators(Validators.required);
      this.orderForm.get('house')?.removeValidators(Validators.required);
      this.orderForm.get('street')?.setValue('');
      this.orderForm.get('house')?.setValue('');
      this.orderForm.get('entrance')?.setValue('');
      this.orderForm.get('apartment')?.setValue('');
    }

    this.orderForm.get('street')?.updateValueAndValidity(); // обновляем валидность полей "Улица" и "Дом" после изменения типа доставки
    this.orderForm.get('house')?.updateValueAndValidity();
  }

  createOrder() {
    if (this.orderForm.valid && this.orderForm.value.firstName && this.orderForm.value.lastName
      && this.orderForm.value.phone && this.orderForm.value.paymentType && this.orderForm.value.email) {
      const paramsObject: OrderType = {
        deliveryType: this.deliveryType,
        firstName: this.orderForm.value.firstName,
        lastName: this.orderForm.value.lastName,
        phone: this.orderForm.value.phone,
        paymentType: this.orderForm.value.paymentType,
        email: this.orderForm.value.email,
      };

      if (this.deliveryType === DeliveryType.delivery) {
        if (this.orderForm.value.street) {
          paramsObject.street = this.orderForm.value.street;
        }
        if (this.orderForm.value.house) {
          paramsObject.house = this.orderForm.value.house;
        }
        if (this.orderForm.value.entrance) {
          paramsObject.entrance = this.orderForm.value.entrance;
        }
        if (this.orderForm.value.apartment) {
          paramsObject.apartment = this.orderForm.value.apartment;
        }
      }

      if (this.orderForm.value.comment) {
        paramsObject.comment = this.orderForm.value.comment;
      }

      this.orderService.createOrder(paramsObject)
        .subscribe({
          next: (data) => {
            if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
              throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
            }

            this.dialogRef = this.dialog.open(this.popup); // открываем попап с сообщением об успешном создании заказа
            this.dialogRef.backdropClick() // закрывает попап при клике на затемненную область вокруг него, а не при клике на сам попап
              .subscribe(() => {
                this.router.navigate(['/']);
              });
            this.cartService.setCount(0); // после успешного создания заказа обнуляем количество товаров в корзине, так как корзина теперь пустая
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
            } else {
              this._snackBar.open('Ошибка заказа');
            }
          }
        });
    } else { // если форма не валидна, то помечаем все поля как тронутые, чтобы показать пользователю, какие поля нужно заполнить
      this.orderForm.markAllAsTouched();
      this._snackBar.open('Заполните необходимые поля');
    }
  }

  closePopup() {
    this.dialogRef?.close();
    this.router.navigate(['/']);
  }

}
