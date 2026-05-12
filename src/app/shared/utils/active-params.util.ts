import {ActiveParamsType} from "../../../types/active-params.type";
import {Params} from "@angular/router";

export class ActiveParamsUtil {
  static processParams(params: Params): ActiveParamsType {
    const activeParams: ActiveParamsType = {types: []}; //создаем новый объект activeParams с пустым массивом types, который будет использоваться для хранения активных параметров фильтра

    if (params.hasOwnProperty('types')) { //если в query параметрах есть параметр 'types', устанавливаем его значение в activeParams.types, проверяя, является ли он массивом или строкой
      activeParams.types = Array.isArray(params['types']) ? params['types'] : [params['types']];
    }

    if (params.hasOwnProperty('heightTo')) { //если в query параметрах есть параметр 'heightTo', устанавливаем его значение в activeParams.heightTo
      activeParams.heightTo = params['heightTo'];
    }

    if (params.hasOwnProperty('heightFrom')) {
      activeParams.heightFrom = params['heightFrom'];
    }

    if (params.hasOwnProperty('diameterTo')) {
      activeParams.diameterTo = params['diameterTo'];
    }

    if (params.hasOwnProperty('diameterFrom')) {
      activeParams.diameterFrom = params['diameterFrom'];
    }

    if (params.hasOwnProperty('sort')) {
      activeParams.sort = params['sort'];
    }

    if (params.hasOwnProperty('page')) {
      activeParams.page = +params['page'];
    }
    return activeParams;
  }
}
