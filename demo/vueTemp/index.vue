<template>
  <div>
    <!-- 普通的标签中 -->
    <div>纯文字替换</div>
    <!-- 中文 + {{变量}} -->
    <div>中文+变量显示：{{value}}</div>
    <!-- 中文 + 多个变量 -->
    <div>中文 + {{ value1 }} {{ fun('函数参数,\'你好\'') }} {{ time | dateFormat }}</div>
    <!-- 换行测试 -->
    <div>
      1.第一行
      2.第二行
      3.第三行
    </div>
    <!-- 属性纯中文 -->
    <input placeholder="属性纯中文" />
    <!-- 属性值为 `中文${变量}` -->
    <input :placeholder="`属性中文带变量${value}`" />
    <!-- 属性值为对象 -->
    <DemoComponent :rule="{reuqired: true, message: '不能为空'}"></DemoComponent>
    <!-- 属性值为数组 -->
    <DemoComponent :array="['元素1', '元素2']"></DemoComponent>
    <!-- 多个属性中文测试 -->
    <DemoComponent a="中文a" b="中文b"></DemoComponent>
    <!-- 重复中文测试 -->
    <DemoComponent a="中文c" b="中文c"></DemoComponent>
    <!-- 测试属性表达式 -->
    <DemoComponent :text="'你好' + name"></DemoComponent>
  </div>
</template>
<script>
import other from 'other'
const name = '测试export以外的中文'

export default {
  name: 'test',
  components: {
    
  },
  props: {
  },
  data () {
    return {
      value: 123,
      text: '测试定义变量中文',
      array: ['中文数组1', '中文数组2']
    }
  },
  created () {
    
  },
  methods: {
    // 代码里的中文
    log () {
      const name = 'xm'
      alert(`Hello ${name}`)
      alert(`Hello ${this.text}`)
    }
  }
}
</script>
<style lang="less" scoped>
</style>
