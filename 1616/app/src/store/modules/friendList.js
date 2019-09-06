
//import Vue from 'vue'
import { applyaddfriend } from '../../util/wrapsdk.js'
import { getUserStatus } from '../../util/getUserStatus';
import { getCustom } from '../../util/getCustom'

const friendList = {
    state: {
      friends:[], //好友列表，
      needTalk:'',//如果用户带参数打开程序，将参数作为正在聊天的好友
      selToID:'',
      friendHead:'',
      init:true,
      friendName:null,
      productId: "",
      productLang: '' ,// 从url协议打开应用程序时，传入的语言参数
      num:'0' //好友个数
    },
    mutations: {
      //添加好友
      ADD_FRIENDS: (state,friendsInfo) => {
        
        console.log('state.friends.length=====',state.friends.length);
        if(state.friends.length == 0){
            console.log('加好友2',friendsInfo);
          state.friends = state.friends.concat(friendsInfo);
          console.log(state.friends)
        }else{
          for(var i in friendsInfo){
            var ind = state.friends.findIndex(item=>item.selToID === friendsInfo[i].selToID);
            console.log(ind)
            if(ind === -1){
              state.friends.unshift(friendsInfo[i]);
              console.log(state.friends,'xinzeng')
              applyaddfriend(friendsInfo[i].selToID)
            }
          }
        }
      },
      //删除好友
      DEL_FRIEND: (state, friendId) =>{
        var i = state.friends.findIndex(item=>item.selToID === friendId);
        if(i !== -1){
          state.friends.splice(i,1);
        }
      },
      //更新好友
      UPDATE_FRIEND:(state, obj)=>{
        var i = state.friends.findIndex(item=>item.selToID === obj.selToID) 
        if(i !== -1){
          var oldInfo = state.friends[i];
          oldInfo.unRead = obj.unRead;
          //state.friends.splice(i,1,oldInfo)
            state.friends.splice(i,1);
            state.friends.unshift(oldInfo);
        }else{
          applyaddfriend(obj.selToID,true)
        }
      },
        //更新好友列表顺序
        UPDATE_FRIEND_ORDER:(state, obj)=>{
          var arr =state.friends;
            console.log('state.friends=====',state.friends);
            console.log(obj,'发送的消息人')
            console.log('obj.selToID=====发送的那个商家id',obj.selToID);//这块的问题

            var i = state.friends.findIndex(item=>item.selToID === obj.selToID);
            console.log(i)
            if(i !== -1){
              //可以
               console.log(state.friends,'好友列表顺序')
                var oldInfo = state.friends[i];
                console.log(oldInfo,"访问的商家")
                arr.splice(i,1);
                console.log(arr,'好友列表顺序')
                arr.unshift(oldInfo);
                console.log(arr,'好友列表顺序')
                state.friends = JSON.parse(JSON.stringify(arr));
                console.log(JSON.parse(JSON.stringify(arr)))
                console.log(state.friends,'好友列表顺序')

        
                //删除
                // state.friends.unshift(oldInfo);
                //向开头添加数据
            }
        },
      //更新好友在线状态
      UPDATE_OFFLINE:(state, arr)=>{
        let j = 0, len = arr.length;
        for(; j < len; j++){
          var i = state.friends.findIndex(item=>item.selToID === arr[j].tbMemberId) 
          if(i !== -1){
            var offline = arr[j].state == 'offline';
            if(state.friends[i].offline !== offline){
               state.friends[i].offline = offline;
            }
          }
        }
      },
      //设置需要聊天的好友
      SET_NEEDTALK: (state, needTalk)=>{
        if(needTalk){
          state.needTalk = needTalk;
        }
        else{
          state.needTalk = '';
        }
      },
      //选择好友进行聊天
      SELECT_FRIEND:(state, friendId)=>{
          console.log('加好友4');
        state.selToID = friendId;
        var friendIndex = state.friends.findIndex(item=>item.selToID == friendId)
          //console.log('friendIndex====',friendIndex);
        if(friendIndex === -1){
          state.friendHead = '';
        }else{
          state.friendHead = state.friends[friendIndex].headImage;
          state.friendName = state.friends[friendIndex].friendName;
          state.friends[friendIndex].unRead = false;
        } 
        if(state.needTalk != ''){
          if(state.init){
            return;
          }
          state.needTalk = ''
        }
      },
      INIT_DONE:(state)=>{
        state.init = false;
      },
      GET_FRIENDNAME:(state, friendName)=>{
        state.friendName = friendName;
      },
      SET_PRODUCTID:(state, productId)=>{
        state.productId = productId;
      },
      SET_PRODUCTLANG:(state, productLang)=>{
        state.productLang = productLang;
      },
        UPDATE_FRIEND_LIST:(state,friendList)=>{
          state.friends = friendList;
        },
        IS_FRIENDS:(state,num)=>{
          console.log('num++++',num);
          state.num = num;
        }
    },
    actions: {
      add_friends: ({ commit ,state},friendsInfo) => {
        console.log(friendsInfo)
        commit('ADD_FRIENDS',friendsInfo)
        // console.log(friendsInfo)
          // console.log('state.needTalk====',state.needTalk);
        if(state.needTalk != ''){
          commit('SELECT_FRIEND',state.needTalk);
        }
      },
      del_friends:({ commit },friendId)=>{
        commit('DEL_FRIEND',friendId)
      },
      update_friend:({ commit },obj)=>{
        commit('UPDATE_FRIEND',obj)
      },
       update_friend_order:({commit},obj)=>{
        console.log(obj,'发送的消息内容')
        commit('UPDATE_FRIEND_ORDER',obj);
      },
      // 用url协议打开应用程序的设置
      set_needTalk:({ dispatch, commit, state}, needTalk)=>{
          //console.log('needTalk=====',needTalk);
          var needTalks = `UID${needTalk[0]}`;
          var productId = needTalk[1];
          var productLang = needTalk[2];
          if(productId){
            commit('SET_PRODUCTID', productId);
          }else{
            commit('SET_PRODUCTID', -1);
          }
          if(productLang){
            commit('SET_PRODUCTLANG', productLang);
          }else{
            commit('SET_PRODUCTLANG', -1);
          }
          if(needTalk[0] == -1){
            return false;
          }
          // console.log('好友的数量=====',state.friends.length);
        /*  state.friends.forEach((item,index)=>{
            console.log(index,item[selToID]);
          })*/
          //判断当前好友列表是否存在要添加的好友
          if(-1 == state.friends.findIndex(item=> item.selToID === needTalks)){
            //console.log(2222);
            commit('SET_NEEDTALK', needTalks)
          /*  if(!needTalk[3]){
              console.log('if needTalk[3]===',needTalk[3]);
              applyaddfriend(needTalks)
            }else{
                console.log('else needTalk[3]===',needTalk[3]);*/
          console.log('needTalks========',needTalks);
                applyaddfriend(needTalks)
            //}
          }else{
              console.log('当前好友存在此列表');
            dispatch('select_friend', needTalks)
          }
      },





      select_friend:({ dispatch,commit,state },friendId)=>{
        //if(state.selToID === friendId ) return;
        commit('SELECT_FRIEND',friendId)
          // console.log(111111);
      },
      update_offline:({dispatch, commit}, arr)=>{
        commit('UPDATE_OFFLINE',arr)
      },
      check_needtalk:({ dispatch, commit, state})=>{
          console.log('加好友3======',state.needTalk);
        if(state.needTalk != ''){
          applyaddfriend(state.needTalk);
          commit('INIT_DONE')
          commit('SELECT_FRIEND',state.needTalk);
          commit('SET_NEEDTALK')
        }
        setTimeout(function(){
          getUserStatus(state.friends)
        }, 2000);
        setInterval(function(){
            getUserStatus(state.friends)
        },1000*60);
      },
      getFriendName:({dispatch, commit, state}, friendName)=>{
        commit('GET_FRIENDNAME', friendName);
      },
        update_friend_list:({commit},friendList)=>{
          commit('UPDATE_FRIEND_LIST',friendList);
        },
        is_friends:({commit},num)=>{
          commit('IS_FRIENDS',num) 
        }
    }
  };
  
  export default friendList;