// WebGPU Shading Language - Physically Based Rendering shader
struct VertexInput {
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) texcoord : vec2f,
}

struct VertexOutput {
  @builtin(position) clip_position : vec4f,
  @location(0) world_position : vec3f,
  @location(1) world_normal   : vec3f,
  @location(2) texcoord       : vec2f,
}

struct Uniforms {
  model      : mat4x4f,
  view       : mat4x4f,
  projection : mat4x4f,
  camera_pos : vec3f,
}

struct Material {
  albedo    : vec3f,
  roughness : f32,
  metallic  : f32,
  ao        : f32,
}

@group(0) @binding(0) var<uniform> uniforms  : Uniforms;
@group(0) @binding(1) var<uniform> material  : Material;
@group(0) @binding(2) var          tex_sampler : sampler;
@group(0) @binding(3) var          albedo_tex  : texture_2d<f32>;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let world_pos = uniforms.model * vec4f(in.position, 1.0);
  out.clip_position  = uniforms.projection * uniforms.view * world_pos;
  out.world_position = world_pos.xyz;
  out.world_normal   = normalize((uniforms.model * vec4f(in.normal, 0.0)).xyz);
  out.texcoord       = in.texcoord;
  return out;
}

fn geometry_schlick_ggx(NdotV: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometry_smith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  return geometry_schlick_ggx(NdotV, roughness) *
         geometry_schlick_ggx(NdotL, roughness);
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  let albedo = textureSample(albedo_tex, tex_sampler, in.texcoord).rgb * material.albedo;
  let N      = normalize(in.world_normal);
  let V      = normalize(uniforms.camera_pos - in.world_position);
  let NdotV  = max(dot(N, V), 0.0);
  let color  = albedo * material.ao * geometry_schlick_ggx(NdotV, material.roughness);
  return vec4f(color, 1.0);
}
