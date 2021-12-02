<template>
  <div>
    <!-- 普通的标签中 -->
    <div>纯文字替换</div>
    <!-- 中文 + {{变量}} -->
    <div>中文+变量显示：{{value}}</div>
    <!-- 属性纯中文 -->
    <input placeholder="属性纯中文" />
    <!-- 属性 `中文${变量}` -->
    <input :placeholder="`属性中文带变量${value}`" />
    <!-- 表单校验 :rule="{reuqired: true, message: '不能为空'}" -->
    <DemoComponent :rule="{reuqired: true, message: '不能为空'}"></DemoComponent>
  </div>
</template>
<script>
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
      console.log('测试代码方法中文')
    }
  }
}
</script>
<style lang="less" scoped>
</style>
