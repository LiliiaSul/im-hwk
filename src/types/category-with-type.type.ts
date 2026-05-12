export type CategoryWithTypeType = {
  id: string,
  name: string,
  url: string,
  types: {
    id: string,
    name: string,
    url: string,
  }[];
  typesUrl?: string[]; // добавляем новое поле для хранения массива URL типов
}
