import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {AuthService} from "../../../core/auth/auth.service";
import {LoginResponseType} from "../../../../types/login-response.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);

  loginForm = this.fb.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  constructor(private fb: FormBuilder, private authService: AuthService,
              private router: Router) {}

  ngOnInit(): void {
  }

  login() {
    if (this.loginForm.valid && this.loginForm.value.email && this.loginForm.value.password) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password, !!this.loginForm.value.rememberMe)
        .subscribe({
          next: (data: LoginResponseType | DefaultResponseType) => {
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
            this._snackBar.open('Вы успешно авторизовались');
            this.router.navigate(['/']);

          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) { //если в ответе есть сообщение об ошибке, то выводим его
              this._snackBar.open(errorResponse.error.message);
            } else { //если нет сообщения об ошибке, то выводим дефолтное сообщение
              this._snackBar.open('Ошибка авторизации');
            }
          }
        })
    }
  }

}
