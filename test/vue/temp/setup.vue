<template>
  <div>
    <!-- 普通的标签中 -->
    <div>{{ $t("common.text") }}</div>
    <!-- 带空格的文字 -->
    <div>{{ $t("template.trans_raf1fnuazms") }}</div>
    <!-- 带换行的文字 -->
    <div>{{ $t("template.trans_fgjnau3dpf") }}</div>
    <!-- 中文 + {{变量}} -->
    <div>{{ $t("template.trans_qgm02o8gll") }}{{ value }}</div>
    <!-- {{变量}} + 中文 -->
    <div>
      {{ value }}
      {{ $t("template.trans_xnhfpk2bb5n") }}
    </div>
    <!-- 中文 + 多个变量 -->
    <div>
      {{ $t("template.trans_wwz2gdxsp") }}{{ value1
      }}{{ $t("template.trans_3wp1okzanm5")
      }}{{ fun($t("template.trans_7ae8avqev08"))
      }}{{ $t("template.trans_2c159xkhaah") }}{{ time | dateFormat }}
    </div>
    <!-- 换行测试 -->
    <div>
      {{ $t("template.trans_0nd7zk2pt2z") }}
      {{ $t("template.trans_h2zimn2jn2") }}
      {{ $t("template.trans_dz5z464ttft") }}
    </div>
    <!-- 属性纯中文 -->
    <input :placeholder="$t('template.trans_hnw4s6x1636')" />
    <!-- 属性值为 `中文${变量}` -->
    <input :placeholder="$t('template.trans_7rv1pr8hpd7', { value })" />
    <!-- 属性值为 嵌套模板字符串 -->
    <input
      :placeholder="
        $t('template.trans_lxnh9z91o6m', {
          value,
          value0: fun(
            flag
              ? $t('template.trans_56n9b85gca5')
              : $t('template.trans_ngxl05cb25', { value })
          ),
        })
      "
    />
    <!-- 属性值为对象 -->
    <DemoComponent
      :rule="{ reuqired: true, message: $t('template.trans_a86rokx654v') }"
    ></DemoComponent>
    <!-- 属性值为数组 -->
    <DemoComponent
      :array="[
        $t('template.trans_2d4pe2f1v8m'),
        $t('template.trans_pgec3zm4z6g'),
      ]"
    ></DemoComponent>
    <!-- 多个属性中文测试 -->
    <DemoComponent
      :a="$t('template.trans_umvbskj32q')"
      :b="$t('template.trans_mq8plw2gq3a')"
    ></DemoComponent>
    <!-- 重复中文测试 -->
    <DemoComponent
      :a="$t('template.trans_7w1oulc2wgt')"
      :b="$t('template.trans_7w1oulc2wgt')"
    ></DemoComponent>
    <!-- 测试属性表达式 -->
    <DemoComponent
      :text="$t('template.trans_j0bb1abevnb') + name"
    ></DemoComponent>
  </div>
</template>
<script setup>
const name = i18n.t("template.trans_6xfahw3bowb");

function log() {
  const name = "xm";
  alert(i18n.t("template.trans_ekvp72x2xmu", { name }));
  alert(i18n.t("template.trans_5yytir9yrel", { value0: this.text }));
}
</script>
