import fetch from './prelogin.js';
import { getLoginInfo } from './wrapsdk.js'
var store = require('../store');

export function getUserStatus(friendList) {
  if(friendList.length == 0) return;
  var selfInfo = getLoginInfo();
  let friends = [];
  let i = 0, len = friendList.length;
  for(; i< len; i++){
    friends.push(friendList[i].selToID);
  }
  let formData = {
          "tbMemberId":selfInfo.identifier,
          'signature':selfInfo.usersig,
          'memberList':friends
        };
  fetch({
    url: '/userState',
    method: 'post',
    mode:'cors',
    data:formData
  }).then(res=>{
    console.log(res.data,'获取用户信息---------------代问所有信息')
    store.default.dispatch('update_offline',res.data)
  }).catch(err=>{
    // console.log('err',err)
  });
}