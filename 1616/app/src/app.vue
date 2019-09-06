<template>
  <transition name="fade">
    <router-view v-if="isRouteAlive"></router-view>
  </transition>
</template>

<script>
    // With shell.openExternal(url) is how
    // external urls must be handled, not href
    //const shell = require('electron').shell    
    export default {
      provide () {
          return {
            reload: this.relord
          }
      },
       data(){
           return {
             isRouteAlive: true
           }
       },
       mounted(){
           this.appShow()
       },
       methods:{
            appShow(){
           },
            reload () {
              this.isRouteAlive = false
              this.$nextTick (() => {
                  this.isRouteAlive = true
              })
    }
       }
    }
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>