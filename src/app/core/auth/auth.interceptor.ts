import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, finalize, Observable, switchMap, throwError} from "rxjs";
import {Injectable} from "@angular/core";
import {AuthService} from "./auth.service";
import {DefaultResponseType} from "../../../types/default-response.type";
import {LoginResponseType} from "../../../types/login-response.type";
import {Router} from "@angular/router";
import {LoaderService} from "../../shared/services/loader.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor { //реализуем интерфейс HttpInterceptor, который позволяет перехватывать все HTTP запросы и обрабатывать их

  constructor(private authService: AuthService, private router: Router,
              private loaderService: LoaderService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> { //перехватываем все HTTP запросы
    this.loaderService.show(); //показываем загрузчик при каждом запросе

    const tokens = this.authService.getTokens();
    if (tokens && tokens.accessToken) { //если есть токены и accessToken
      const authReq = req.clone({ //клонируем запрос
        headers: req.headers.set('x-access-token', tokens.accessToken) //добавляем в заголовки токен
      });

      return next.handle(authReq) //отправляем запрос дальше, но уже с токеном в заголовках
        .pipe( //обрабатываем ответ на запрос
          catchError((error) => { //если ошибка 401 (не авторизован) и запрос не на /login и не на /refresh, то пробуем обновить токены
            if (error.status === 401 && !authReq.url.includes('/login') && !authReq.url.includes('/refresh')) {
              return this.handle401Error(authReq, next); //обрабатываем ошибку 401, пытаясь обновить токены и повторить запрос
            }
            return throwError(() => error); //если ошибка не 401 или запрос на /login или /refresh, то просто выбрасываем ошибку дальше
          }),
          finalize(() => this.loaderService.hide()) //скрываем загрузчик после завершения запроса, независимо от его результата (успех или ошибка)
        );
    }

    return next.handle(req)  //если токенов нет, то передаем дальше оригинальный запрос без изменений
      .pipe(
        finalize(() => this.loaderService.hide())
      );
  }

  handle401Error(req: HttpRequest<any>, next: HttpHandler) {
    return this.authService.refresh() //вызываем метод refresh в AuthService, который отправляет запрос на обновление токенов
      .pipe( //обрабатываем ответ на запрос обновления токенов
        switchMap(result => { //переключаемся на новый Observable, который будет отправлять повторный запрос с обновленными токенами
          let error = ''; //переменная для хранения ошибки, если она будет

          if ((result as DefaultResponseType).error !== undefined) { //если в ответе есть поле error, значит произошла ошибка при обновлении токенов
            error = (result as DefaultResponseType).message;
          }

          const refreshResult = result as LoginResponseType; //приводим результат к типу LoginResponseType, который содержит новые токены и userId
          if (!refreshResult.accessToken || !refreshResult.refreshToken || !refreshResult.userId) {
            error = "Ошибка авторизации";
          }

          if (error) {
            return throwError(() => new Error(error)); //если есть ошибка, то выбрасываем ее дальше, чтобы она была обработана в catchError ниже
          }

          this.authService.setTokens(refreshResult.accessToken, refreshResult.refreshToken); //если все хорошо, то сохраняем новые токены в AuthService

          const authReq = req.clone({ //клонируем запрос
            headers: req.headers.set('x-access-token', refreshResult.accessToken) //добавляем в заголовки токен
          });

          return next.handle(authReq); //отправляем повторный запрос дальше, но уже с обновленным токеном в заголовках
        }),
        catchError(error => { //если при обновлении токенов произошла ошибка, то удаляем токены из AuthService и перенаправляем пользователя на главную страницу
          this.authService.removeTokens();
          this.router.navigate(['/']);
          return throwError(() => error);
        })
      )
  }
}
