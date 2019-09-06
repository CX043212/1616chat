import fetch from './fetch.js';
import config from '../../configs/base'

export function getCustom(lan, productId){
    var url = `http://detail.1818lao.com/leading/imProductAction.aspx`;
    return fetch({
        url: url,
        method: 'post',
        mode:'cors',
        baseUrl: '',
        params: {
            method: 'getGoodsById',
            id: productId,
            dataSourceId: lan
        }
    })
}