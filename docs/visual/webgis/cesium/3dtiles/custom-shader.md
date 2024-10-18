# CustomShader

用于为3dtiles模型添加自定义shader

## 顶点着色

```glsl
void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
  // code goes here. An empty body is a no-op.
  v_normalMC = vsInput.attributes.normalMC;
}
```

- VertexInput
  - Attributes attributes
    - 含义：读取每个模型中的可用的property加载到attributes上，例如：如果模型上存在`TEXCOORD_0`字段，那么可以通过`vsInput.attributes.TEXCOORD_0`读取
      - 如果读取失败，那么cesium则会自动提供一个可能的默认值使编译器继续运行，如果提供了默认值之后仍不能运行，那么则禁用传入的shader
    - 内置的属性：[Attributes内置属性列表](#attributes内置属性列表)
  - FeatureIds featureIds;
  - Metadata metadata;
  - MetadataClass metadataClass;
  - MetadataStatistics metadataStatistics;
- czm_modelVertexOutput
  - 含义：包含顶点着色的输出，如果需要修改顶点着色，则需要将结果赋值给vsOutput带出
  - 属性：
    - positionMC：模型坐标系下的位置信息
    - pointSize：点的大小，将会传值给gl_PointSize

## 片元着色

```glsl
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  material.diffuse = vec3(1.0, 1.0, 1.0);
}
```

- FragmentInput
  - Attributes attributes;
  - FeatureIds featureIds;
  - Metadata metadata;
  - MetadataClass metadataClass;
  - MetadataStatistics metadataStatistics;
- czm_modelMaterial
  - 含义：作为片元着色的输入和输出，和旧fabric系统中的`czm_material`相似，但是它支持PBR光照
  - 功能：
    - 在material阶段生成material
    - 在光照阶段，混合处理material、光照并且将计算结果存入`material.diffuse`
    - 

## Attributes内置属性列表

- POSITION：位置信息
- NORMAL：法线

| 模型中的相关attribute | 在shader中的attribute | 类型    | 顶点着色可用 | 片元着色可用 | Description                                                                                                                                                              |
| --------------------- | --------------------- | ------- | ------------ | ------------ |--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `POSITION`            | `positionMC`          | `vec3`  | Yes          | Yes          | 模型坐标系中的坐标信息                                                                                                                                                              |
| `POSITION`            | `positionWC`          | `vec3`  | No           | Yes          | 世界坐标系中的坐标信息 (WGS84 ECEF `(x, y, z)`). Low precision.                                                                                                                     |
| `POSITION`            | `positionEC`          | `vec3`  | No           | Yes          | 眼睛坐标系中的坐标信息                                                                                                                                                              |
| `NORMAL`              | `normalMC`            | `vec3`  | Yes          | No           | 模型坐标系中单位长度的法线向量（过模型中每个点，并且垂直与模型表面的法线？）。只在顶点着色中可读                                                                                                                         |
| `NORMAL`              | `normalEC`            | `vec3`  | No           | Yes          | 眼睛坐标系中单位长度的法线向量。只在片元着色中可读                                                                                                                                                |
| `TANGENT`             | `tangentMC`           | `vec3`  | Yes          | No           | Unit-length tangent vector in model coordinates. This is always a `vec3`. For models that provide a `w` component, that is removed after computing the bitangent vector. |
| `TANGENT`             | `tangentEC`           | `vec3`  | No           | Yes          | Unit-length tangent vector in eye coordinates. This is always a `vec3`. For models that provide a `w` component, that is removed after computing the bitangent vector.   |
| `NORMAL` & `TANGENT`  | `bitangentMC`         | `vec3`  | Yes          | No           | Unit-length bitangent vector in model coordinates. Only available when both normal and tangent vectors are available.                                                    |
| `NORMAL` & `TANGENT`  | `bitangentEC`         | `vec3`  | No           | Yes          | Unit-length bitangent vector in eye coordinates. Only available when both normal and tangent vectors are available.                                                      |
| `TEXCOORD_N`          | `texCoord_N`          | `vec2`  | Yes          | Yes          | texture中的第n个坐标                                                                                                                                                           |
| `COLOR_N`             | `color_N`             | `vec4`  | Yes          | Yes          | `N`-th set of vertex colors. This is always a `vec4`; if the model does not specify an alpha value, it is assumed to be 1.                                               |
| `JOINTS_N`            | `joints_N`            | `ivec4` | Yes          | Yes          | `N`-th set of joint indices                                                                                                                                              |
| `WEIGHTS_N`           | `weights_N`           | `vec4`  | Yes          | Yes          | `N`-th set of weights                                                                                                                                                    |
