import {Component, Input, OnInit} from '@angular/core';
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  @Input() categories: CategoryWithTypeType[] = []; // Получаем категории с типами из родительского компонента LayoutComponent

  constructor() { }

  ngOnInit(): void {
  }

}
