import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from "./auth.service";
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthForwardGuard implements CanActivate { //если пользователь залогинен, то переводим на предыдущую страницу и не разрешаем посещать текущий url адрес
  constructor(private authService: AuthService, private location: Location) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.getIsLoggedIn()) {//если пользователь залогинен
      this.location.back(); //переводим на предыдущую страницу
      return false; //не разрешаем посещать текущий url адрес
    }
    return true; //если пользователь не залогинен, разрешаем посещать текущий url адрес
  }

}
