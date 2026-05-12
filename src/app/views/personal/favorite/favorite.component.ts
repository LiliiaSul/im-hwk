import {Component, OnInit} from '@angular/core';
import {FavoriteService} from "../../../shared/services/favorite.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {FavoriteType} from "../../../../types/favorite.type";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss']
})
export class FavoriteComponent implements OnInit {
  products: FavoriteType[] = [];
  serverStaticPath = environment.serverStaticPath; //путь к статическим файлам на сервере, который будет использоваться для отображения изображений продуктов

  constructor(private favoriteService: FavoriteService) {
  }

  ngOnInit(): void {
    this.favoriteService.getFavorites() //получаем избранные товары
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          const error = (data as DefaultResponseType).message;
          throw new Error(error); //выбрасываем ошибку
        }

        this.products = data as FavoriteType[]; //если все хорошо, то сохраняем товары в переменную
      });
  }

  removeFromFavorites(id: string) { //удаляем товар из избранного
    this.favoriteService.removeFavorite(id)
      .subscribe(data => {
        if (data.error) {
          //..
          throw new Error(data.message); //выбрасываем ошибку, если что-то пошло не так при удалении товара из избранного
        }

        this.products = this.products.filter(item => item.id != id); //обновляем список товаров, удаляя из него товар с указанным id
      })
  }

}
