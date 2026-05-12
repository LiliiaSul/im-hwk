import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from "./auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private _snackBar = inject(MatSnackBar);

  constructor(private authService: AuthService) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const isLoggedIn = this.authService.getIsLoggedIn(); //проверяем, залогинен ли пользователь
    if (!isLoggedIn) { //если пользователь не залогинен, показываем сообщение и не разрешаем посещать текущий url адрес
      this._snackBar.open('Для доступа необходимо авторизоваться');
    }

    return isLoggedIn; //если пользователь залогинен, разрешаем посещать текущий url адрес
  }

}
