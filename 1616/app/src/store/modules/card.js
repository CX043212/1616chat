const card = {
    state: {
      selfname:'',//用户昵称
      selfhead:'',//用户头像
      isUpdate: false,
      isExit:true,
      username:'' ,//用户名称
      avalute:false,
    },
    mutations: {
      //用户信息
      SET_SELFINFO: (state,selfInfo) => {
        console.log(selfInfo,'self信息')
          state.selfname = selfInfo.memberName;
          state.selfhead = selfInfo.headImage;
      },
        SET_ISUPDATE(state, isUpdate){
        state.isUpdate = isUpdate;
      },
        SET_ISEXIT(state,isExit){
          state.isExit = isExit;
        },
      //登录用户名
      SET_USERNAME(state,username){
        state.username = username;
      },
      handleToggle(){
         state.avalute = true;
          if(state.avalute = true){
            state.avalute = false;
          }
          console.log(state.avalute)
    }
  },

    actions: {
      set_selfInfo: ({ commit },selfInfo) => {
          commit('SET_SELFINFO',selfInfo)
      },
      set_isUpdate:({commit},isUpdate) => {
            commit('SET_ISUPDATE',isUpdate)
      },
      set_isExit:({commit},isExit) => {
          commit('SET_ISEXIT',isExit)
      },
      set_username:({commit},username) => {
          commit('SET_USERNAME',username)
      }
    }
  };

  export default card;