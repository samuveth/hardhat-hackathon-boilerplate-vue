import Vue from "vue";
import App from "./App.vue";

// We import bootstrap here, but you can remove if you want
import "./assets/styles/main.css";

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
