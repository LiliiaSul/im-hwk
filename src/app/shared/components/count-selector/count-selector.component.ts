import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'count-selector',
  templateUrl: './count-selector.component.html',
  styleUrls: ['./count-selector.component.scss']
})
export class CountSelectorComponent implements OnInit {

  @Input() count: number = 1; //Принимаем значение счетчика количества товара от родительского компонента. Если мы его примем, то будет установлено значение счетчика, если не примем, то будет установлено значение по умолчанию 1

  @Output() onCountChange: EventEmitter<number> = new EventEmitter<number>(); //Событие для передачи нового значения счетчика родительскому компоненту

  constructor() {
  }

  ngOnInit(): void {
  }

  countChange() { // берем актуальное значение счетчика и передаем его родительскому компоненту через событие onCountChange
    this.onCountChange.emit(this.count);
  }

  decreaseCount() {
    if (this.count > 1) {
      this.count--;
      this.countChange(); // вызываем метод countChange для передачи нового значения счетчика родительскому компоненту
    }
  }

  increaseCount() {
    this.count++;
    this.countChange();
  }

}
