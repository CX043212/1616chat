<template>
    <div class="mainHeader">
        <span>{{_getFriendName}}</span>
        <span v-show="avalute===true?true:false">评论管理</span>
        <em>
            <img src="../../images/hd_min.jpg" @click="main_page_min"/>
            <img src="../../images/hd_max.jpg" @click="main_page_max" v-if="show"/>
            <img src="../../images/hd_restore.png" @click="main_page_max" v-else/>
            <img src="../../images/hd_close.jpg" @click="main_page_close"/>
        </em>
        <div class="closeMask">
            <div class="closeWindow" v-show="closeTip">
                <div class="top"><span class="title">{{$t("message.obj.close_tip")}}</span><img @click="hideWindow" src="../../images/hd_close.jpg"/></div>
                <div class="content">
                    <p :title="$t('message.obj.click_close')">{{$t("message.obj.click_close")}}</p>
                    <p><input type="radio" name="exit" value="no_exit" id="no_exit" v-model="param"/><span :title="$t('message.obj.no_exit_program')">{{$t("message.obj.no_exit_program")}}</span></p>
                    <p><input type="radio" name="exit" value="exit" id="exit" v-model="param"/><span :title="$t('message.obj.exit_program')">{{$t("message.obj.exit_program")}}</span></p>
                </div>
                <div class="bot">
                    <span @click="sureWindow">{{$t("message.obj.sure")}}</span><span @click="hideWindow">{{$t("message.obj.off")}}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const { ipcRenderer } = require('electron')
export default {
  data() {
    return {
      user: this.$store.getters.getSelfname,
      username:this.$store.getters.getUsername,
      friendName: '',
      show: true,
      closeTip: false,
      param: 'exit',
      avalute:this.$store.getters.avalute,
    }
  },
  computed: {
    _getFriendName() {
      return this.$store.getters.getFriendName
    }
  },
  mounted: function() {
    this.$nextTick(function() {
      ipcRenderer.on('reply', (event, arg) => {
        if (arg == 'max') {
          this.show = false
        } else if (arg == 'min') {
          this.show = true
        }
      })
    })
  },
  methods: {
    main_page_min: function() {
      ipcRenderer.send('msg', 'setMin')
    },
    main_page_max: function() {
      if (this.show) {
        ipcRenderer.send('msg', 'setMax')
      } else {
        ipcRenderer.send('msg', 'setRestore')
      }
      this.show = !this.show
    },
    main_page_close: function() {
      var isFirstClose = localStorage.getItem('isFirstClose')
      //如果是第一次  显示弹框
      if (!isFirstClose) {
        this.closeTip = true
      } else {
        var datas = localStorage.getItem('userInfo')
        var exit = localStorage.getItem('exit')
        datas = JSON.parse(datas)
        //  var username = localStorage.getItem('username')
        datas.forEach(val =>{
          if (val['name'] === this.username) {
            if (val['setquit']) {
              if (val['setquit'] === 'true') {
                ipcRenderer.send('msg', 'exit')
              } else if (val['setquit'] === 'false') {
                ipcRenderer.send('msg', 'close')
              }
            } else {
              if (exit == 'false') {
                ipcRenderer.send('msg', 'close')
              } else {
                ipcRenderer.send('msg', 'exit')
              }
            }
          }
        })
      }

      localStorage.setItem('isFirstClose', 'true')
    },

    hideWindow: function() {
      this.closeTip = false
    },
    sureWindow: function() {
      // console.log('this.param====', this.param)
      if (this.param == 'exit') {
        //直接退出
        this.closeTip = false
        ipcRenderer.send('msg', 'exit')
        localStorage.setItem('exit', 'true')
        this.$store.dispatch('set_isExit', true)
      } else {
        document.querySelector('.closeWindow').style.display = 'none'
        // console.log(document.querySelector('.closeWindow').style.display)
        ipcRenderer.send('msg', 'close')
        localStorage.setItem('exit', 'false')
        this.$store.dispatch('set_isExit', false)
      }
    }
  }
}
</script>

<style scoped>
.mainHeader {
  width: 100%;
  height: 49px;
  border-bottom: 1px solid #ddd;
  background: #f5f8fc;
  -webkit-app-region: drag;
}

.mainHeader > span {
  font-size: 17px;
  float: left;
  padding-left: 22px;
  line-height: 49px;
}

.mainHeader > em {
  float: right;
  text-align: right;
  -webkit-app-region: no-drag;
}
.closeMask {
  width: 100%;
  height: 100%;
  z-index: 20;
}
.closeMask .closeWindow {
  position: absolute;
  width: 340px;
  height: 160px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid black;
  z-index: 21;
  border-radius: 5px;
  box-shadow: 0 0 12px 2px rgba(0, 0, 0, 0.5);
  background-color: #eee;
}
.top {
  position: relative;
  height: 20px;
}
.top .title {
  position: absolute;
  left: 10px;
  font-weight: bold;
  color: black;
  letter-spacing: 1px;
  font-size: 15px;
}

.top img {
  position: absolute;
  right: 5px;
}
.content {
  margin: 20px 0px;
}

.content input {
  width: inherit;
  height: inherit;
  margin-right: 5px;
  margin-left: 10px;
}

.content p {
  margin: 5px 0px;
  padding-left: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bot {
  height: 30px;
  text-align: right;
  line-height: 30px;
}

.bot span {
  border: 1px solid #333;
  padding: 2px 10px;
  border-radius: 3px;
  cursor: default;
}
.bot span:last-child {
  margin: 0px 15px;
}
</style>



