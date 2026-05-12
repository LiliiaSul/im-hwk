import { Directive } from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator} from "@angular/forms";

@Directive({
  selector: '[passwordRepeat]',
  providers: [{provide: NG_VALIDATORS, useExisting: PasswordRepeatDirective, multi: true}] // Регистрируем директиву как валидатор, который будет использоваться в шаблоне формы. multi: true означает, что этот валидатор будет добавлен к существующим валидаторам, а не заменять их.
})
export class PasswordRepeatDirective implements Validator{

  validate(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password'); // Получаем доступ к полю password внутри формы, к которой применяется директива. control.get('password') возвращает AbstractControl для поля password.
    const passwordRepeat = control.get('passwordRepeat');

    if (password?.value !== passwordRepeat?.value) { // Сравниваем значения полей password и passwordRepeat. Если они не совпадают, то устанавливаем ошибку на поле passwordRepeat и возвращаем объект с ошибкой.
      passwordRepeat?.setErrors({passwordRepeat: true});
      return {passwordRepeat: true};
    }

    return null;
  }

}
