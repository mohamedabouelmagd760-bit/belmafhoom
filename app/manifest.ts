import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return {name:'بالمفهوم',short_name:'بالمفهوم',description:'مش مجرد شرح.. فهم حقيقي.',start_url:'/',display:'standalone',background_color:'#F5F7FB',theme_color:'#172B4D',lang:'ar',dir:'rtl',icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]}; }
