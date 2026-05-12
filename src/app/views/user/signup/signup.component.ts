import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AuthService} from "../../../core/auth/auth.service";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {LoginResponseType} from "../../../../types/login-response.type";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);

  signupForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
    passwordRepeat: ['', [Validators.required, Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)]],
    agree: [false, [Validators.requiredTrue]],
  });

  constructor(private fb: FormBuilder, private authService: AuthService,
              private router: Router) { }

  ngOnInit(): void {
  }

  signup() {
    if (this.signupForm.valid && this.signupForm.value.email && this.signupForm.value.password
      && this.signupForm.value.passwordRepeat && this.signupForm.value.agree) {
      this.authService.signup(this.signupForm.value.email, this.signupForm.value.password, this.signupForm.value.passwordRepeat)
        .subscribe({
          next: (data: DefaultResponseType | LoginResponseType) => {
            let error = null;
            if ((data as DefaultResponseType).error !== undefined) { //если в ответе есть поле error, то это DefaultResponseType и мы выводим сообщение об ошибке
              error = (data as DefaultResponseType).message;
            }

            const loginResponse = data as LoginResponseType;
            if (!loginResponse.accessToken || !loginResponse.refreshToken || !loginResponse.userId) { //если в ответе нет токенов, то это DefaultResponseType и мы выводим сообщение об ошибке
              error = 'Ошибка авторизации';
            }

            if (error) { //если есть ошибка, то выводим ее и выбрасываем исключение, чтобы не продолжать выполнение кода
              this._snackBar.open(error);
              throw new Error(error);
            }

            this.authService.setTokens(loginResponse.accessToken, loginResponse.refreshToken); //устанавливаем токены в сервисе авторизации
            this.authService.userId = loginResponse.userId; //устанавливаем userId в сервисе авторизации
            this._snackBar.open('Вы успешно зарегистрировались');
            this.router.navigate(['/']);

          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) { //если в ответе есть сообщение об ошибке, то выводим его
              this._snackBar.open(errorResponse.error.message);
            } else { //если нет сообщения об ошибке, то выводим дефолтное сообщение
              this._snackBar.open('Ошибка регистрации');
            }
          }
        })
    }
  }

}
