import {Component, OnInit} from '@angular/core';
import {OrderService} from "../../../shared/services/order.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {OrderType} from "../../../../types/order.type";
import {OrderStatusUtil} from "../../../shared/utils/order-status.util";

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: OrderType[] = [];

  constructor(private orderService: OrderService) {
  }

  ngOnInit(): void {
    this.orderService.getOrders()
      .subscribe(data => {
        if ((data as DefaultResponseType).error !== undefined) { //если есть ошибка
          throw new Error((data as DefaultResponseType).message); //выбрасываем ошибку, если что-то пошло не так при получении данных корзины
        }

        this.orders = (data as OrderType[]).map(item => { //преобразуем полученные данные в нужный формат, добавляем статус и цвет для отображения
          const status = OrderStatusUtil.getStatusAndColor(item.status);

          item.statusRus = status.name; //добавляем русское название статуса
          item.color = status.color; //добавляем цвет для отображения статуса

          return item;
        });
      });
  }

}
