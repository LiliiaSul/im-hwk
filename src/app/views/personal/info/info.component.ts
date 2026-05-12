import {Component, inject, OnInit} from '@angular/core';
import {DeliveryType} from "../../../../types/delivery.type";
import {PaymentType} from "../../../../types/payment.type";
import {FormBuilder, Validators} from "@angular/forms";
import {UserService} from "../../../shared/services/user.service";
import {UserInfoType} from "../../../../types/user-info.type";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DefaultResponseType} from "../../../../types/default-response.type";

@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {
  deliveryType: DeliveryType = DeliveryType.delivery; // по умолчанию выбран тип доставки "Доставка"
  deliveryTypes = DeliveryType; // для отображения всех вариантов доставки в шаблоне
  paymentTypes = PaymentType;
  private _snackBar = inject(MatSnackBar);

  userInfoForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    fatherName: [''],
    phone: [''],
    paymentType: [PaymentType.cardToCourier],
    email: ['', Validators.required],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
  });

  constructor(private fb: FormBuilder, private userService: UserService) {
  }

  ngOnInit(): void {
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
        }

        this.userInfoForm.setValue(paramsToUpdate); //устанавливаем полученные данные в форму, если какое-то поле не заполнено, то устанавливаем пустую строку
        if (userInfo.deliveryType) {
          this.deliveryType = userInfo.deliveryType;
        }
      });
  }

  changeDeliveryType(deliveryType: DeliveryType) {
    this.deliveryType = deliveryType;

    this.userInfoForm.markAsDirty(); // помечаем форму как измененную, чтобы включить кнопку сохранения
  }

  updateUserInfo() {
    if (this.userInfoForm.valid) {
      const paramObject: UserInfoType = { // эти параметры обязательные, поэтому добавляем их в объект в любом случае, даже если они не заполнены
        email: this.userInfoForm.value.email ? this.userInfoForm.value.email : '',
        deliveryType: this.deliveryType,
        paymentType: this.userInfoForm.value.paymentType ? this.userInfoForm.value.paymentType : PaymentType.cashToCourier,
      }

      if (this.userInfoForm.value.firstName) { //эти параметры не обязательные, поэтому добавляем их в объект только если они заполнены
        paramObject.firstName = this.userInfoForm.value.firstName;
      }

      if (this.userInfoForm.value.lastName) {
        paramObject.lastName = this.userInfoForm.value.lastName;
      }

      if (this.userInfoForm.value.fatherName) {
        paramObject.fatherName = this.userInfoForm.value.fatherName;
      }

      if (this.userInfoForm.value.phone) {
        paramObject.phone = this.userInfoForm.value.phone;
      }

      if (this.userInfoForm.value.street) {
        paramObject.street = this.userInfoForm.value.street;
      }

      if (this.userInfoForm.value.house) {
        paramObject.house = this.userInfoForm.value.house;
      }

      if (this.userInfoForm.value.entrance) {
        paramObject.entrance = this.userInfoForm.value.entrance;
      }

      if (this.userInfoForm.value.apartment) {
        paramObject.apartment = this.userInfoForm.value.apartment;
      }

      this.userService.updateUserInfo(paramObject)
        .subscribe({
          next: (data) => {
            if (data.error) { //если в поле error будет true, то выводим сообщение об ошибке, которое пришло с сервера, и выбрасываем ошибку, чтобы не выполнять дальнейший код
              this._snackBar.open(data.message);
              throw new Error(data.message);
            }

            this._snackBar.open('Данные успешно сохранены');
            this.userInfoForm.markAsPristine(); // помечаем форму как не измененную, чтобы отключить кнопку сохранения

          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) { //если в ответе есть сообщение об ошибке, то выводим его
              this._snackBar.open(errorResponse.error.message);
            } else { //если нет сообщения об ошибке, то выводим дефолтное сообщение
              this._snackBar.open('Ошибка сохранения');
            }
          }
        });
    }
  }
}
