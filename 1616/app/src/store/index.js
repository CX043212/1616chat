import Vue from 'vue';
import Vuex from 'vuex';
import friendList from './modules/friendList';
import messageList from './modules/messageList';
import transOption from './modules/transOption';
import card from './modules/card'
import getters from './getters';
import { logout } from '../util/wrapsdk.js'
const ipc = require('electron').ipcRenderer;

var talkto;
//应用已经打开接受参数
ipc.on('NEEDTALK',(event, arg) => {
    if(arg[1]==undefined){
      return;
    }else{
      //arg  [ 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\16Chat\\16Chat.exe',
       // ',onesixliao://590235686:6336525724:zh_CN/' ]

        //[ 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\16Chat\\16Chat.exe',
        //',onesixliao://20002614/' ]
      arg = arg[1].split('://')[1].slice(0, -1);
      if(arg.trim() !== ''){
        var args = arg.split(':');
        // console.log('args======',args);
        store.dispatch('set_needTalk', args)
        store.dispatch('need_talk', 'UID' + args[0])
      }
      // talkto = arg == -1 ? '': arg;
      // if(talkto !== ''){
      //   store.dispatch('set_needTalk','UID' + talkto)
      //   store.dispatch('need_talk','UID' + talkto)
      // }
    }
})
function logoutcallback(resp){
  ipc.send('now-quit')
}
ipc.on('quit_im',(event, arg)=>{
  logout(logoutcallback,logoutcallback)
})
Vue.use(Vuex);

var store = new Vuex.Store({
  modules: {
    friendList,
    messageList,
    card,
    transOption
  },
  getters
});

//应用刚打开接受参数
(function(store){
  talkto = ipc.sendSync('talkto');
  if(talkto !== -1){
    var args = talkto.split(':');
    // console.log('store中的args====',args);
    args.push(true);
    store.dispatch('set_needTalk', args)
    store.dispatch('need_talk', 'UID' + args[0])
  }
  // if(talkto.length > 0){
  //   store.dispatch('set_needTalk', ['UID'+talkto, ])
  //   store.dispatch('need_talk','UID'+talkto)
  // }
})(store)

export default store
