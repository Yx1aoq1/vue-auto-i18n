<template>
  <div>
    <!-- 普通的标签中 -->
    <div>纯文字替换</div>
    <!-- 带空格的文字 -->
    <div> 带空格的文字 </div>
    <!-- 带换行的文字 -->
    <div>
      带换行的文字
    </div>
    <!-- 中文 + {{变量}} -->
    <div> 中文+变量显示：{{ value }} </div>
    <!-- {{变量}} + 中文 -->
    <div>
      {{ value }}
      变量后的中文
    </div>
    <!-- 中文 + 多个变量 -->
    <div>中文1{{ value1 }}中文2{{ fun('函数内部中文') }}中文3{{ time | dateFormat }}</div>
    <!-- 换行测试 -->
    <div>
      1.第一行
      2.第二行
      3.第三行
    </div>
    <!-- 属性纯中文 -->
    <input placeholder="属性纯中文" />
    <!-- 属性值为 `中文${变量}` -->
    <input :placeholder="`ES6模板字符串${value}`" />
    <!-- 属性值为 嵌套模板字符串 -->
    <input :placeholder="`ES6模板字符串${fun(flag ? '中文字符串1' : `模板字符串2${value}`)}`" />
    <!-- 属性值为对象 -->
    <DemoComponent :rule="{ reuqired: true, message: '不能为空' }"></DemoComponent>
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
const name = '测试export以外的中文'

export default {
  name: 'test',
  components: {},
  props: {},
  data() {
    return {
      value: 123,
      text: '测试定义变量中文',
      array: ['中文数组1', '中文数组2'],
    }
  },
  created() {},
  methods: {
    // 代码里的中文
    log() {
      const name = 'xm'
      alert(`中文模板变量 ${name}`)
      alert(`中文模板变量 ${this.text}`)
    },
  },
}
</script>

<style lang="less" scoped></style>
