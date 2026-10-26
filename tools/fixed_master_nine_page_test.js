#!/usr/bin/env node
/* Nine-page fixed master regression.
 * BASELINE_PART_SHA256 is independently captured from the previously accepted
 * three-page template/materials files, not from the implementation under test.
 * Optional baseline files enable literal byte comparisons in addition to hashes.
 */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const JSZip=require('../jszip.min.js'),PptxGenJS=require('pptxgenjs'),F=require('../fixed-master'),D=require('../deck');
const {JSDOM}=require('jsdom'),parser=new (new JSDOM('').window.DOMParser)();
const A='http://schemas.openxmlformats.org/drawingml/2006/main',P='http://schemas.openxmlformats.org/presentationml/2006/main',R='http://schemas.openxmlformats.org/officeDocument/2006/relationships',PKG='http://schemas.openxmlformats.org/package/2006/relationships';
const SOURCE_SHA='1d42e27915855f57c1bee5ad185526ee62c51818223e9cfde20609dcf47c1fae';
const BASELINE_PART_SHA256={
  "template-common": {
    "[Content_Types].xml": "8b63e6fe995ada3f20c39d2245149e124b619c9e1d9dcc4a53c4f590933e8611",
    "_rels/.rels": "b900b23d9263c8a2f9f6973227b90653d96b93fc152c7cdb8d1d86717fba8c33",
    "docProps/app.xml": "57bb64a3ff71aec4eab8eba09103efd076cab93c00eb4fd452d1a093fef5e7eb",
    "docProps/core.xml": "21e443935d74773f23957c2e5c81a42dec47740cbb08ce901824e22a48a88002",
    "ppt/_rels/presentation.xml.rels": "6671d37ac9f8603770396b0d03dd5a2c342e87a17bb36a0dd7a2d372110621a5",
    "ppt/media/tsmc_original_logo.png": "776b10929145151879923af16d0a2cf5875ff741223aa29f4dee1d1c602d5380",
    "ppt/notesMasters/_rels/notesMaster1.xml.rels": "dc3ad781ed7334575a81147ad47984eaba389b54bd0aef1d69cf0cc4866f1deb",
    "ppt/notesMasters/notesMaster1.xml": "ae5b50d49e7d7351555de9dc5d68d2000694ec0ec8797a3b2aeb3564617b76e5",
    "ppt/notesMasters/theme/theme3.xml": "469b32b5e89897df9cca4ac056d77fccb8f1e3f50977f7a1059b6a5f31c92858",
    "ppt/notesSlides/_rels/notesSlide1.xml.rels": "043d34572152eee4da3b77c3b906b85ff9292100ad68bf522b7a31256fd3c358",
    "ppt/notesSlides/_rels/notesSlide2.xml.rels": "363e4ff45ca0db9b6d1e1289dfef3467bbdaed80c6ca9f84f97362c1fb200752",
    "ppt/notesSlides/notesSlide1.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/notesSlides/notesSlide2.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/presProps.xml": "0ef116709f985fae96b4f76a1f9d18b8b90bded3733983a9305c4574cd261f74",
    "ppt/presentation.xml": "eca70b47634d8d0bbefd5cb9fde16fe0624a3c1daecfa868036a7631686dc527",
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": "c24d3bf4bb8bdc2df3aa8f6bfd74a62d6300397320c6cef67575336cd2d46f4c",
    "ppt/slideLayouts/_rels/slideLayout2.xml.rels": "51c786f9feb1b3de6f4ca54d432915c22fd432729e1cdf38585fa109d3fed058",
    "ppt/slideLayouts/_rels/slideLayout3.xml.rels": "2a12ec9b7158fe32cd837b9f2fde1cf4425c80bd3290809c23389d71b871a3b6",
    "ppt/slideLayouts/_rels/slideLayout4.xml.rels": "58370791d4655412cd0e6ed871a657952b981e8f7a95850ef1dbd80089c0bbb6",
    "ppt/slideLayouts/_rels/slideLayout5.xml.rels": "18b33c64952a0386fcefbfb7ed53352da3688df14de04d86c02c2d5d059f7d5e",
    "ppt/slideLayouts/_rels/slideLayout6.xml.rels": "63d692f944cf3f47b44f3efdbb40bae53f3ebab4be3c150a933e51d339d50362",
    "ppt/slideLayouts/_rels/slideLayout7.xml.rels": "54c410029ea861117135dce88184d9b4a8950b209b6f15ff269cc100c59510c5",
    "ppt/slideLayouts/slideLayout1.xml": "b17e6114424d2a835a646b330f616f5ccd4eb74579bbeaf44cce88ca639a6c4e",
    "ppt/slideLayouts/slideLayout2.xml": "71e0d4b6b798b871c6a5fe79c915365bbeaaec201685abb30a86e75de65397d2",
    "ppt/slideLayouts/slideLayout3.xml": "d4ee84a8c742169c9f22a003d137053c86d97ae03451630d8263f9021cc5fc0a",
    "ppt/slideLayouts/slideLayout4.xml": "5e5bb36f3bb602230e3ac44d2a38080166abc4956a46e52b66ffd1d94b6f8144",
    "ppt/slideLayouts/slideLayout5.xml": "75daf160b3f851ef2a421d00e604edf3d18f21a112e9fb5dd01229a2afdfdb60",
    "ppt/slideLayouts/slideLayout6.xml": "52230734f1bf383d270804559560a06bf5cb18a10023b0ed66d1c90c5e301771",
    "ppt/slideLayouts/slideLayout7.xml": "7d9c6bb691cf1473a0a9269e74b68a5a9ffdee07097e6767710d7d9dbc30189f",
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": "ab2270801433075330a31f2f45494a6215eb22356305c7157493619ff2972bdc",
    "ppt/slideMasters/slideMaster1.xml": "b442aa9bcab53710b1f00de982850947761fcf43d75e726855a40889f9016e05",
    "ppt/slideMasters/theme/theme2.xml": "2c90148aa3d721f633c917245798a781bbc2cdad48e18136a7da46124ec4ee45",
    "ppt/slides/_rels/slide1.xml.rels": "e23ed07709726f58142981fd4aa6e4c9ac2dbe3059835e8b9dddfde6de3db152",
    "ppt/slides/_rels/slide2.xml.rels": "acf21cf451afec7f2da54fb44c563198f511281a5f2a8d6d6c0ccda552c4ef89",
    "ppt/slides/_rels/slideCover.xml.rels": "27320281910a84f9a7570e793b403fd6f09832dc0bc1b4bf2a3e000febf382d3",
    "ppt/slides/slide1.xml": "7db702b5e243d46850e64a7524ab7791d74518e652f26b9056d80e2984c64b17",
    "ppt/slides/slide2.xml": "62a3e6595113e5a7b0f5afecc93279e46064e5c39ac6bd03067451f97ccf64b4",
    "ppt/slides/slideCover.xml": "1d35bf1edb25be3958c575a6ae0a41514bd0c0efb5b98bef0d1bc745d83a1075",
    "ppt/tableStyles.xml": "eefe8607728a909fd3cf65c0e18a5abf20526c77e5d206950696a268edd823c8",
    "ppt/theme/theme1.xml": "2c90148aa3d721f633c917245798a781bbc2cdad48e18136a7da46124ec4ee45",
    "ppt/viewProps.xml": "9d703614b047f34207da4d34e396eeb5604ec499235100bfe2b03b999405e62a"
  },
  "template-theme": {
    "[Content_Types].xml": "8b63e6fe995ada3f20c39d2245149e124b619c9e1d9dcc4a53c4f590933e8611",
    "_rels/.rels": "b900b23d9263c8a2f9f6973227b90653d96b93fc152c7cdb8d1d86717fba8c33",
    "docProps/app.xml": "57bb64a3ff71aec4eab8eba09103efd076cab93c00eb4fd452d1a093fef5e7eb",
    "docProps/core.xml": "21e443935d74773f23957c2e5c81a42dec47740cbb08ce901824e22a48a88002",
    "ppt/_rels/presentation.xml.rels": "6671d37ac9f8603770396b0d03dd5a2c342e87a17bb36a0dd7a2d372110621a5",
    "ppt/media/tsmc_original_logo.png": "776b10929145151879923af16d0a2cf5875ff741223aa29f4dee1d1c602d5380",
    "ppt/notesMasters/_rels/notesMaster1.xml.rels": "dc3ad781ed7334575a81147ad47984eaba389b54bd0aef1d69cf0cc4866f1deb",
    "ppt/notesMasters/notesMaster1.xml": "ae5b50d49e7d7351555de9dc5d68d2000694ec0ec8797a3b2aeb3564617b76e5",
    "ppt/notesMasters/theme/theme3.xml": "469b32b5e89897df9cca4ac056d77fccb8f1e3f50977f7a1059b6a5f31c92858",
    "ppt/notesSlides/_rels/notesSlide1.xml.rels": "043d34572152eee4da3b77c3b906b85ff9292100ad68bf522b7a31256fd3c358",
    "ppt/notesSlides/_rels/notesSlide2.xml.rels": "363e4ff45ca0db9b6d1e1289dfef3467bbdaed80c6ca9f84f97362c1fb200752",
    "ppt/notesSlides/notesSlide1.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/notesSlides/notesSlide2.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/presProps.xml": "0ef116709f985fae96b4f76a1f9d18b8b90bded3733983a9305c4574cd261f74",
    "ppt/presentation.xml": "eca70b47634d8d0bbefd5cb9fde16fe0624a3c1daecfa868036a7631686dc527",
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": "c24d3bf4bb8bdc2df3aa8f6bfd74a62d6300397320c6cef67575336cd2d46f4c",
    "ppt/slideLayouts/_rels/slideLayout2.xml.rels": "51c786f9feb1b3de6f4ca54d432915c22fd432729e1cdf38585fa109d3fed058",
    "ppt/slideLayouts/_rels/slideLayout3.xml.rels": "2a12ec9b7158fe32cd837b9f2fde1cf4425c80bd3290809c23389d71b871a3b6",
    "ppt/slideLayouts/_rels/slideLayout4.xml.rels": "58370791d4655412cd0e6ed871a657952b981e8f7a95850ef1dbd80089c0bbb6",
    "ppt/slideLayouts/_rels/slideLayout5.xml.rels": "18b33c64952a0386fcefbfb7ed53352da3688df14de04d86c02c2d5d059f7d5e",
    "ppt/slideLayouts/_rels/slideLayout6.xml.rels": "63d692f944cf3f47b44f3efdbb40bae53f3ebab4be3c150a933e51d339d50362",
    "ppt/slideLayouts/_rels/slideLayout7.xml.rels": "54c410029ea861117135dce88184d9b4a8950b209b6f15ff269cc100c59510c5",
    "ppt/slideLayouts/slideLayout1.xml": "b17e6114424d2a835a646b330f616f5ccd4eb74579bbeaf44cce88ca639a6c4e",
    "ppt/slideLayouts/slideLayout2.xml": "71e0d4b6b798b871c6a5fe79c915365bbeaaec201685abb30a86e75de65397d2",
    "ppt/slideLayouts/slideLayout3.xml": "d4ee84a8c742169c9f22a003d137053c86d97ae03451630d8263f9021cc5fc0a",
    "ppt/slideLayouts/slideLayout4.xml": "5e5bb36f3bb602230e3ac44d2a38080166abc4956a46e52b66ffd1d94b6f8144",
    "ppt/slideLayouts/slideLayout5.xml": "75daf160b3f851ef2a421d00e604edf3d18f21a112e9fb5dd01229a2afdfdb60",
    "ppt/slideLayouts/slideLayout6.xml": "52230734f1bf383d270804559560a06bf5cb18a10023b0ed66d1c90c5e301771",
    "ppt/slideLayouts/slideLayout7.xml": "7d9c6bb691cf1473a0a9269e74b68a5a9ffdee07097e6767710d7d9dbc30189f",
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": "ab2270801433075330a31f2f45494a6215eb22356305c7157493619ff2972bdc",
    "ppt/slideMasters/slideMaster1.xml": "b442aa9bcab53710b1f00de982850947761fcf43d75e726855a40889f9016e05",
    "ppt/slideMasters/theme/theme2.xml": "2ea99a3a0cc66991462323f17b44932b6745c2b3e94418274639d4ddb9b64340",
    "ppt/slides/_rels/slide1.xml.rels": "e23ed07709726f58142981fd4aa6e4c9ac2dbe3059835e8b9dddfde6de3db152",
    "ppt/slides/_rels/slide2.xml.rels": "acf21cf451afec7f2da54fb44c563198f511281a5f2a8d6d6c0ccda552c4ef89",
    "ppt/slides/_rels/slideCover.xml.rels": "27320281910a84f9a7570e793b403fd6f09832dc0bc1b4bf2a3e000febf382d3",
    "ppt/slides/slide1.xml": "7db702b5e243d46850e64a7524ab7791d74518e652f26b9056d80e2984c64b17",
    "ppt/slides/slide2.xml": "62a3e6595113e5a7b0f5afecc93279e46064e5c39ac6bd03067451f97ccf64b4",
    "ppt/slides/slideCover.xml": "1d35bf1edb25be3958c575a6ae0a41514bd0c0efb5b98bef0d1bc745d83a1075",
    "ppt/tableStyles.xml": "eefe8607728a909fd3cf65c0e18a5abf20526c77e5d206950696a268edd823c8",
    "ppt/theme/theme1.xml": "2ea99a3a0cc66991462323f17b44932b6745c2b3e94418274639d4ddb9b64340",
    "ppt/viewProps.xml": "9d703614b047f34207da4d34e396eeb5604ec499235100bfe2b03b999405e62a"
  },
  "materials-common": {
    "[Content_Types].xml": "8b63e6fe995ada3f20c39d2245149e124b619c9e1d9dcc4a53c4f590933e8611",
    "_rels/.rels": "b900b23d9263c8a2f9f6973227b90653d96b93fc152c7cdb8d1d86717fba8c33",
    "docProps/app.xml": "57bb64a3ff71aec4eab8eba09103efd076cab93c00eb4fd452d1a093fef5e7eb",
    "docProps/core.xml": "21e443935d74773f23957c2e5c81a42dec47740cbb08ce901824e22a48a88002",
    "ppt/_rels/presentation.xml.rels": "6671d37ac9f8603770396b0d03dd5a2c342e87a17bb36a0dd7a2d372110621a5",
    "ppt/media/tsmc_original_logo.png": "776b10929145151879923af16d0a2cf5875ff741223aa29f4dee1d1c602d5380",
    "ppt/notesMasters/_rels/notesMaster1.xml.rels": "dc3ad781ed7334575a81147ad47984eaba389b54bd0aef1d69cf0cc4866f1deb",
    "ppt/notesMasters/notesMaster1.xml": "ae5b50d49e7d7351555de9dc5d68d2000694ec0ec8797a3b2aeb3564617b76e5",
    "ppt/notesMasters/theme/theme3.xml": "469b32b5e89897df9cca4ac056d77fccb8f1e3f50977f7a1059b6a5f31c92858",
    "ppt/notesSlides/_rels/notesSlide1.xml.rels": "043d34572152eee4da3b77c3b906b85ff9292100ad68bf522b7a31256fd3c358",
    "ppt/notesSlides/_rels/notesSlide2.xml.rels": "363e4ff45ca0db9b6d1e1289dfef3467bbdaed80c6ca9f84f97362c1fb200752",
    "ppt/notesSlides/notesSlide1.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/notesSlides/notesSlide2.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/presProps.xml": "0ef116709f985fae96b4f76a1f9d18b8b90bded3733983a9305c4574cd261f74",
    "ppt/presentation.xml": "eca70b47634d8d0bbefd5cb9fde16fe0624a3c1daecfa868036a7631686dc527",
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": "c24d3bf4bb8bdc2df3aa8f6bfd74a62d6300397320c6cef67575336cd2d46f4c",
    "ppt/slideLayouts/_rels/slideLayout2.xml.rels": "51c786f9feb1b3de6f4ca54d432915c22fd432729e1cdf38585fa109d3fed058",
    "ppt/slideLayouts/_rels/slideLayout3.xml.rels": "2a12ec9b7158fe32cd837b9f2fde1cf4425c80bd3290809c23389d71b871a3b6",
    "ppt/slideLayouts/_rels/slideLayout4.xml.rels": "58370791d4655412cd0e6ed871a657952b981e8f7a95850ef1dbd80089c0bbb6",
    "ppt/slideLayouts/_rels/slideLayout5.xml.rels": "18b33c64952a0386fcefbfb7ed53352da3688df14de04d86c02c2d5d059f7d5e",
    "ppt/slideLayouts/_rels/slideLayout6.xml.rels": "63d692f944cf3f47b44f3efdbb40bae53f3ebab4be3c150a933e51d339d50362",
    "ppt/slideLayouts/_rels/slideLayout7.xml.rels": "54c410029ea861117135dce88184d9b4a8950b209b6f15ff269cc100c59510c5",
    "ppt/slideLayouts/slideLayout1.xml": "b17e6114424d2a835a646b330f616f5ccd4eb74579bbeaf44cce88ca639a6c4e",
    "ppt/slideLayouts/slideLayout2.xml": "71e0d4b6b798b871c6a5fe79c915365bbeaaec201685abb30a86e75de65397d2",
    "ppt/slideLayouts/slideLayout3.xml": "d4ee84a8c742169c9f22a003d137053c86d97ae03451630d8263f9021cc5fc0a",
    "ppt/slideLayouts/slideLayout4.xml": "5e5bb36f3bb602230e3ac44d2a38080166abc4956a46e52b66ffd1d94b6f8144",
    "ppt/slideLayouts/slideLayout5.xml": "75daf160b3f851ef2a421d00e604edf3d18f21a112e9fb5dd01229a2afdfdb60",
    "ppt/slideLayouts/slideLayout6.xml": "52230734f1bf383d270804559560a06bf5cb18a10023b0ed66d1c90c5e301771",
    "ppt/slideLayouts/slideLayout7.xml": "7d9c6bb691cf1473a0a9269e74b68a5a9ffdee07097e6767710d7d9dbc30189f",
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": "ab2270801433075330a31f2f45494a6215eb22356305c7157493619ff2972bdc",
    "ppt/slideMasters/slideMaster1.xml": "b442aa9bcab53710b1f00de982850947761fcf43d75e726855a40889f9016e05",
    "ppt/slideMasters/theme/theme2.xml": "2c90148aa3d721f633c917245798a781bbc2cdad48e18136a7da46124ec4ee45",
    "ppt/slides/_rels/slide1.xml.rels": "e057d7f5581133975ed46f502594905b619ff2400b3ff72a00acc9369f8c5da0",
    "ppt/slides/_rels/slide2.xml.rels": "c1bf19e341580a407258cdb43ce95e8cd3b2f5ca4be7342ffe96398955f72872",
    "ppt/slides/_rels/slideCover.xml.rels": "49eb8a6f9eb16a4a0a3a6a3a0d00d07615ad644a90346a229dd843f25879eb80",
    "ppt/slides/slide1.xml": "ebea37b2a7f1d1e1acb5872268f303854179e5df9627a76c78d5484139b0c740",
    "ppt/slides/slide2.xml": "e73f569c9e0629f95837feb5f8fbbaa6bb98246bab610a9600576c148023efce",
    "ppt/slides/slideCover.xml": "9b96f53049012396b7a2c6d4665d6f9a72e9c555d0cd5e624351c0388f601e46",
    "ppt/tableStyles.xml": "eefe8607728a909fd3cf65c0e18a5abf20526c77e5d206950696a268edd823c8",
    "ppt/theme/theme1.xml": "2c90148aa3d721f633c917245798a781bbc2cdad48e18136a7da46124ec4ee45",
    "ppt/viewProps.xml": "9d703614b047f34207da4d34e396eeb5604ec499235100bfe2b03b999405e62a"
  },
  "materials-theme": {
    "[Content_Types].xml": "8b63e6fe995ada3f20c39d2245149e124b619c9e1d9dcc4a53c4f590933e8611",
    "_rels/.rels": "b900b23d9263c8a2f9f6973227b90653d96b93fc152c7cdb8d1d86717fba8c33",
    "docProps/app.xml": "57bb64a3ff71aec4eab8eba09103efd076cab93c00eb4fd452d1a093fef5e7eb",
    "docProps/core.xml": "21e443935d74773f23957c2e5c81a42dec47740cbb08ce901824e22a48a88002",
    "ppt/_rels/presentation.xml.rels": "6671d37ac9f8603770396b0d03dd5a2c342e87a17bb36a0dd7a2d372110621a5",
    "ppt/media/tsmc_original_logo.png": "776b10929145151879923af16d0a2cf5875ff741223aa29f4dee1d1c602d5380",
    "ppt/notesMasters/_rels/notesMaster1.xml.rels": "dc3ad781ed7334575a81147ad47984eaba389b54bd0aef1d69cf0cc4866f1deb",
    "ppt/notesMasters/notesMaster1.xml": "ae5b50d49e7d7351555de9dc5d68d2000694ec0ec8797a3b2aeb3564617b76e5",
    "ppt/notesMasters/theme/theme3.xml": "469b32b5e89897df9cca4ac056d77fccb8f1e3f50977f7a1059b6a5f31c92858",
    "ppt/notesSlides/_rels/notesSlide1.xml.rels": "043d34572152eee4da3b77c3b906b85ff9292100ad68bf522b7a31256fd3c358",
    "ppt/notesSlides/_rels/notesSlide2.xml.rels": "363e4ff45ca0db9b6d1e1289dfef3467bbdaed80c6ca9f84f97362c1fb200752",
    "ppt/notesSlides/notesSlide1.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/notesSlides/notesSlide2.xml": "8d75d6c38099c5b8a1c45a728221ff4556358c8cfacfb077f162b5c185b8f186",
    "ppt/presProps.xml": "0ef116709f985fae96b4f76a1f9d18b8b90bded3733983a9305c4574cd261f74",
    "ppt/presentation.xml": "eca70b47634d8d0bbefd5cb9fde16fe0624a3c1daecfa868036a7631686dc527",
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": "c24d3bf4bb8bdc2df3aa8f6bfd74a62d6300397320c6cef67575336cd2d46f4c",
    "ppt/slideLayouts/_rels/slideLayout2.xml.rels": "51c786f9feb1b3de6f4ca54d432915c22fd432729e1cdf38585fa109d3fed058",
    "ppt/slideLayouts/_rels/slideLayout3.xml.rels": "2a12ec9b7158fe32cd837b9f2fde1cf4425c80bd3290809c23389d71b871a3b6",
    "ppt/slideLayouts/_rels/slideLayout4.xml.rels": "58370791d4655412cd0e6ed871a657952b981e8f7a95850ef1dbd80089c0bbb6",
    "ppt/slideLayouts/_rels/slideLayout5.xml.rels": "18b33c64952a0386fcefbfb7ed53352da3688df14de04d86c02c2d5d059f7d5e",
    "ppt/slideLayouts/_rels/slideLayout6.xml.rels": "63d692f944cf3f47b44f3efdbb40bae53f3ebab4be3c150a933e51d339d50362",
    "ppt/slideLayouts/_rels/slideLayout7.xml.rels": "54c410029ea861117135dce88184d9b4a8950b209b6f15ff269cc100c59510c5",
    "ppt/slideLayouts/slideLayout1.xml": "b17e6114424d2a835a646b330f616f5ccd4eb74579bbeaf44cce88ca639a6c4e",
    "ppt/slideLayouts/slideLayout2.xml": "71e0d4b6b798b871c6a5fe79c915365bbeaaec201685abb30a86e75de65397d2",
    "ppt/slideLayouts/slideLayout3.xml": "d4ee84a8c742169c9f22a003d137053c86d97ae03451630d8263f9021cc5fc0a",
    "ppt/slideLayouts/slideLayout4.xml": "5e5bb36f3bb602230e3ac44d2a38080166abc4956a46e52b66ffd1d94b6f8144",
    "ppt/slideLayouts/slideLayout5.xml": "75daf160b3f851ef2a421d00e604edf3d18f21a112e9fb5dd01229a2afdfdb60",
    "ppt/slideLayouts/slideLayout6.xml": "52230734f1bf383d270804559560a06bf5cb18a10023b0ed66d1c90c5e301771",
    "ppt/slideLayouts/slideLayout7.xml": "7d9c6bb691cf1473a0a9269e74b68a5a9ffdee07097e6767710d7d9dbc30189f",
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": "ab2270801433075330a31f2f45494a6215eb22356305c7157493619ff2972bdc",
    "ppt/slideMasters/slideMaster1.xml": "b442aa9bcab53710b1f00de982850947761fcf43d75e726855a40889f9016e05",
    "ppt/slideMasters/theme/theme2.xml": "2ea99a3a0cc66991462323f17b44932b6745c2b3e94418274639d4ddb9b64340",
    "ppt/slides/_rels/slide1.xml.rels": "e057d7f5581133975ed46f502594905b619ff2400b3ff72a00acc9369f8c5da0",
    "ppt/slides/_rels/slide2.xml.rels": "c1bf19e341580a407258cdb43ce95e8cd3b2f5ca4be7342ffe96398955f72872",
    "ppt/slides/_rels/slideCover.xml.rels": "49eb8a6f9eb16a4a0a3a6a3a0d00d07615ad644a90346a229dd843f25879eb80",
    "ppt/slides/slide1.xml": "403de695015cb6e68a9f75600fac0a27869db081f09c4a55bda3fe1eac7918c5",
    "ppt/slides/slide2.xml": "e73f569c9e0629f95837feb5f8fbbaa6bb98246bab610a9600576c148023efce",
    "ppt/slides/slideCover.xml": "54bd4e17444cb2a1c581aafd7919d154fb6d6cc5666bce133f6c29970cbe6be9",
    "ppt/tableStyles.xml": "eefe8607728a909fd3cf65c0e18a5abf20526c77e5d206950696a268edd823c8",
    "ppt/theme/theme1.xml": "2ea99a3a0cc66991462323f17b44932b6745c2b3e94418274639d4ddb9b64340",
    "ppt/viewProps.xml": "9d703614b047f34207da4d34e396eeb5604ec499235100bfe2b03b999405e62a"
  }
};
const BASELINE_DIR=process.env.FIXED_MASTER_BASELINE_DIR||path.resolve(__dirname,'../../acceptance/master-integration/final-v2');
const PALETTES={common:['D95D68','E7BF4A','4E83CE','4B9679','7D8795','9371C6'],theme:['4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47']};
const HIGHLIGHTS=['F6D8DB','F9F0D4','7C9CC3','D4E6DF','E0E2E6','E5DDF1','595959','1F3864'];
const EXTRA_TITLES=['可編輯矩形樣式 1 / 2','可編輯矩形樣式 2 / 2','八色原生文字螢光筆','卡片與面板 Cards & Panels','方案元件・內文＋強調','方案元件・Icon＋內文＋強調'];
const INDEX_PARTS=['ppt/presentation.xml','ppt/_rels/presentation.xml.rels','[Content_Types].xml','docProps/app.xml'];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),fileNames=z=>Object.keys(z.files).filter(n=>!z.files[n].dir).sort();
const bytes=(z,n)=>{assert(z.file(n),'Missing part '+n);return z.file(n).async('uint8array');},text=(z,n)=>{assert(z.file(n),'Missing part '+n);return z.file(n).async('string');};
const xml=s=>{const doc=parser.parseFromString(s,'application/xml');assert.equal(doc.getElementsByTagName('parsererror').length,0,'Invalid XML');return doc;};
const els=(n,ns,local)=>Array.from(n.getElementsByTagNameNS(ns,local));
const vals=n=>els(n,A,'t').map(t=>t.textContent),joined=n=>vals(n).join('').replace(/\r?\n/g,'');
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-8,label+': '+a+' != '+b);
const sourceGroupItems=(s,g)=>s.items.slice(g.from,g.to+1),sourceGroupText=(s,g)=>sourceGroupItems(s,g).flatMap(it=>(it.runs||[]).map(r=>r.t)).join('').replace(/\r?\n/g,'');
function resolve(from,to){return path.posix.normalize(to[0]==='/'?to.slice(1):path.posix.join(path.posix.dirname(from),to));}
function relPath(part){return path.posix.join(path.posix.dirname(part),'_rels',path.posix.basename(part)+'.rels');}
async function orderedSlides(z){const pres=xml(await text(z,'ppt/presentation.xml')),rels=xml(await text(z,'ppt/_rels/presentation.xml.rels')),map=new Map(els(rels,PKG,'Relationship').map(r=>[r.getAttribute('Id'),r]));return els(pres,P,'sldId').map(s=>{const id=s.getAttributeNS(R,'id');assert(id,'Every slide ID declares the relationships namespace');const r=map.get(id);assert(r&&r.getAttribute('Type')===R+'/slide','Slide ID relationship resolves');return resolve('ppt/presentation.xml',r.getAttribute('Target'));});}
async function literalBaseline(key){const file=path.join(BASELINE_DIR,key+'.pptx');return fs.existsSync(file)?JSZip.loadAsync(fs.readFileSync(file)):null;}
async function samePart(z,baseline,golden,n,actual){const data=actual||await bytes(z,n);assert.equal(sha(data),golden[n],'Prior accepted bytes preserved: '+n);if(baseline)assert.deepEqual(Buffer.from(data),Buffer.from(await bytes(baseline,n)),'Literal baseline comparison: '+n);}
function stripAdditions(n,s){if(n==='ppt/presentation.xml')return s.replace(/<p:sldId\b[^>]*r:id="rIdFixedMaterial[4-9]"[^>]*\/>/g,'');if(n==='ppt/_rels/presentation.xml.rels')return s.replace(/<Relationship\b[^>]*Id="rIdFixedMaterial[4-9]"[^>]*\/>/g,'');if(n==='[Content_Types].xml')return s.replace(/<Override\b[^>]*PartName="\/ppt\/slides\/slideMaterial[4-9]\.xml"[^>]*\/>/g,'');if(n==='docProps/app.xml')return s.replace(/(<(?:\w+:)?Slides>)9(<\/(?:\w+:)?Slides>)/,(_,a,b)=>a+'3'+b);throw Error('Unapproved index part');}
function sourceParams(accents){return {...D.BASE,P:accents[0],PD:D.mix(accents[0],'000000',.35),PT:D.mix(accents[0],'FFFFFF',.85),A:accents[1],bFont:'微軟正黑體',tFont:'微軟正黑體',nFont:'微軟正黑體'};}
function checkTransform(source,actual,key){
 assert.equal(actual.schemeCatalogue,false);close(actual.w,13+1/3,key+' slide width');close(actual.h,7.5,key+' slide height');
 assert.equal(actual.groups.length,key==='cards'?9:28);const k=key==='cards'?1:.5;
 source.groups.forEach((g,i)=>{const got=actual.groups[i];assert.equal(got.name,g.name);close(got.w/g.w,k,key+' group width scale');close(got.h/g.h,k,key+' group height scale');const oldItems=sourceGroupItems(source,g),newItems=sourceGroupItems(actual,got);assert.equal(newItems.length,oldItems.length,'All group objects retained');
  oldItems.forEach((old,j)=>{const now=newItems[j];assert.equal(now.t,old.t);assert.equal(now.kind,old.kind);for(const field of ['x','x1','x2'])if(typeof old[field]==='number')close(now[field]-got.x,(old[field]-g.x)*k,key+'/'+i+'/'+field);for(const field of ['y','y1','y2'])if(typeof old[field]==='number')close(now[field]-got.y,(old[field]-g.y)*k,key+'/'+i+'/'+field);for(const field of ['w','h','lw','adj'])if(typeof old[field]==='number')close(now[field],old[field]*k,key+'/'+i+'/'+field);
   for(const field of ['fill','line','ft','dash','cap'])assert.equal(now[field],old[field],key+' paint unchanged');
   if(old.sh){for(const field of ['blur','dist'])close(now.sh[field],old.sh[field]*k,key+' shadow '+field);assert.equal(now.sh.alpha,old.sh.alpha);}
   if(old.points){assert.equal(now.points.length,old.points.length);old.points.forEach((p,pi)=>{for(const field of ['x','y','x1','y1','x2','y2'])if(typeof p[field]==='number')close(now.points[pi][field],p[field]*k,key+' custom geometry');});}
   if(old.runs){assert.deepEqual(now.runs.map(r=>r.t),old.runs.map(r=>r.t));old.runs.forEach((r,ri)=>{close(now.runs[ri].o.size,r.o.size*k,key+' font scale');assert.equal(now.runs[ri].o.bold,r.o.bold);assert.equal(now.runs[ri].o.color,r.o.color);assert.equal(now.runs[ri].o.font,'微軟正黑體');});}
   if(old.tx){const margin=Array.isArray(old.tx.margin)?old.tx.margin.map(v=>v*k):typeof old.tx.margin==='number'?old.tx.margin*k:old.tx.margin;assert.deepEqual(now.tx.margin,margin);}
  });
 });
 for(const it of actual.items){const b=it.t==='ln'?{x:Math.min(it.x1,it.x2),y:Math.min(it.y1,it.y2),w:Math.abs(it.x2-it.x1),h:Math.abs(it.y2-it.y1)}:it;for(const f of ['x','y','w','h'])assert(Number.isFinite(b[f]),'Finite geometry');assert(b.x>=0&&b.y>=1.2&&b.x+b.w<=13+1/3+.0001&&b.y+b.h<6.94,'Content stays outside fixed title/footer');}
 if(key==='cards'){assert.deepEqual(actual.items.filter(i=>i.name==='圖說').map(i=>D.textOf(i)),source.items.filter(i=>i.name==='圖說').map(i=>D.textOf(i)));}
 else{const captions=actual.items.filter(i=>i.name==='素材款名');assert.equal(captions.length,14);assert(captions.every(c=>c.runs[0].o.size===9));assert.equal(new Set(actual.groups.map(g=>g.y.toFixed(6))).size,7);for(let i=0;i<28;i+=2){assert.equal(actual.groups[i].schemeSide,'A');assert.equal(actual.groups[i+1].schemeSide,'B');assert.equal(actual.groups[i].schemeStyle,actual.groups[i+1].schemeStyle);}for(const g of actual.groups)for(const it of sourceGroupItems(actual,g))for(const r of it.runs||[]){const badge=key==='schemebody'&&g.schemeStyle==='09'&&r.t===g.schemeSide;assert.equal(r.o.size,badge?8.5:9,'Only original 17pt A/B badge scales to 8.5pt');}}
}

function manifestContract(){
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../fixed-master/download-manifest.json'),'utf8'));
 const expected={version:1,filename:'固定紅色_九頁母片.pptx',sourceFilename:'Fixed_Red_Template.pptx',sourceSha256:SOURCE_SHA,slideCount:9,sizeEmu:[12192000,6858000],paletteSources:['common','theme'],pages:[
  {number:1,key:'cover',layout:1},{number:2,key:'single-column',layout:2},{number:3,key:'double-column',layout:4},
  {number:4,key:'rectangles-1',layout:6,cards:35},{number:5,key:'rectangles-2',layout:6,cards:35},{number:6,key:'native-highlight',layout:6,highlights:8},
  {number:7,key:'cards',catalogueId:'A2',layout:6,groups:9},
  {number:8,key:'schemebody',catalogueId:'A16',layout:6,groups:28,bodyPt:9,smallLetterPt:8.5},
  {number:9,key:'schemeiconbody',catalogueId:'A18',layout:6,groups:28,bodyPt:9}
 ],secondary:{filename:'固定紅色_卡片與文字素材.pptx',slideCount:3,mainPageNumbers:[4,5,6]}};
 assert.deepEqual(manifest,expected,'Manifest matches literal download contract');
 const runtimeExpected=[
  {title:'專案重點與下一步',layout:1,key:null},{title:'單欄內容',layout:2,key:null},{title:'雙欄內容',layout:4,key:null},
  {title:'可編輯矩形樣式 1 / 2',layout:6,key:null},{title:'可編輯矩形樣式 2 / 2',layout:6,key:null},{title:'八色原生文字螢光筆',layout:6,key:null},
  {title:'卡片與面板 Cards & Panels',layout:6,key:'cards'},{title:'方案元件・內文＋強調',layout:6,key:'schemebody'},{title:'方案元件・Icon＋內文＋強調',layout:6,key:'schemeiconbody'}
 ];
 assert.deepEqual(F.DOWNLOAD_PAGES.map(p=>({title:p.title,layout:p.layout,key:p.key||null})),runtimeExpected,'Runtime page contract independently matches literal order');
 assert.deepEqual(manifest.pages.map(p=>p.layout),F.DOWNLOAD_PAGES.map(p=>p.layout));
 assert.deepEqual(manifest.pages.slice(6).map(p=>p.key),F.DOWNLOAD_PAGES.slice(6).map(p=>p.key));
}
let checks=0,failures=0,byteCompared=0;async function check(name,fn){try{await fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
(async()=>{
 await check('download manifest and runtime match independent literal nine-page contract',manifestContract);
 if(process.argv.includes('--manifest-only')){console.log(JSON.stringify({checks,failures,exports:0,mode:'manifest-only'}));if(failures)process.exitCode=1;return;}
 await check('immutable original source remains exact',async()=>{const input=fs.readFileSync(path.join(__dirname,'../fixed-master/Fixed_Red_Template.pptx'));assert.equal(sha(input),SOURCE_SHA);assert.deepEqual(Buffer.from(F.originalBytes()),input);});
 for(const source of ['common','theme']){
  const main=await JSZip.loadAsync(await F.exportPptx(JSZip,[],{source,PptxGenJS})),side=await JSZip.loadAsync(await F.exportMaterials(JSZip,{paletteSource:source})),ordered=await orderedSlides(main);
  const baseline=await literalBaseline('template-'+source),sideBaseline=await literalBaseline('materials-'+source),golden=BASELINE_PART_SHA256['template-'+source];if(baseline)byteCompared++;if(sideBaseline)byteCompared++;
  await check(source+' exact nine-page order, fixed layout and page numbers',async()=>{
   assert.deepEqual(ordered,['ppt/slides/slideCover.xml','ppt/slides/slide1.xml','ppt/slides/slide2.xml',...Array.from({length:6},(_,i)=>'ppt/slides/slideMaterial'+(i+4)+'.xml')]);
   const pres=xml(await text(main,'ppt/presentation.xml')),sz=els(pres,P,'sldSz')[0];assert.equal(sz.getAttribute('cx'),'12192000');assert.equal(sz.getAttribute('cy'),'6858000');
   assert.equal(els(xml(await text(main,'docProps/app.xml')),'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties','Slides')[0].textContent,'9');
   for(let i=3;i<9;i++){const part=ordered[i],doc=xml(await text(main,part)),relations=els(xml(await text(main,relPath(part))),PKG,'Relationship');assert.equal(doc.documentElement.getAttribute('showMasterSp'),'1');assert.equal(els(doc,P,'cSld')[0].getAttribute('name'),EXTRA_TITLES[i-3]);assert.equal(relations.length,1);assert.equal(relations[0].getAttribute('Type'),R+'/slideLayout');assert.equal(resolve(part,relations[0].getAttribute('Target')),'ppt/slideLayouts/slideLayout6.xml');const fields=els(doc,A,'fld').filter(n=>n.getAttribute('type')==='slidenum');assert.equal(fields.length,1);assert.equal(joined(fields[0]),String(i+1));}
  });
  await check(source+' all prior package bytes preserved except six slide additions/count',async()=>{
   const newNames=Array.from({length:6},(_,i)=>'ppt/slides/slideMaterial'+(i+4)+'.xml');const expected=[...Object.keys(golden),...newNames,...newNames.map(relPath)].sort();assert.deepEqual(fileNames(main),expected);
   for(const n of Object.keys(golden))await samePart(main,baseline,golden,n,INDEX_PARTS.includes(n)?Buffer.from(stripAdditions(n,await text(main,n))):null);
  });
  await check(source+' secondary download stays exact prior three-page package',async()=>{
   const g=BASELINE_PART_SHA256['materials-'+source];assert.deepEqual(fileNames(side),Object.keys(g).sort());assert.deepEqual(await orderedSlides(side),['ppt/slides/slideCover.xml','ppt/slides/slide1.xml','ppt/slides/slide2.xml']);for(const n of Object.keys(g))await samePart(side,sideBaseline,g,n);
  });
  await check(source+' 70 editable rectangles and eight exact native highlight inks',async()=>{
   const four=xml(await text(main,ordered[3])),five=xml(await text(main,ordered[4])),six=xml(await text(main,ordered[5]));assert.equal([...els(four,P,'cNvPr'),...els(five,P,'cNvPr')].filter(n=>/^Material card /.test(n.getAttribute('name'))).length,70);assert.deepEqual(els(six,A,'highlight').map(n=>els(n,A,'srgbClr')[0].getAttribute('val')),HIGHLIGHTS);assert.equal(els(six,P,'pic').length,0);
  });
  const expectedSources=D.buildModel(sourceParams(PALETTES[source]),{only:['cards','schemebody','schemeiconbody']}).slides,actualModel=F.componentModel({palette:{accents:PALETTES[source]}});
  await check(source+' component source text, native groups, unique IDs and connectors',async()=>{
   for(let i=0;i<3;i++){const part=ordered[i+6],s=await text(main,part),doc=xml(s),expected=expectedSources.find(e=>e.key===['cards','schemebody','schemeiconbody'][i]),groups=els(doc,P,'grpSp');assert.equal(groups.length,i?28:9);assert.equal(els(doc,P,'pic').length,0);assert(!/\br:(?:id|embed|link)=/.test(s),'No content relationship refs');const ids=els(doc,P,'cNvPr').map(n=>n.getAttribute('id'));assert.equal(new Set(ids).size,ids.length,'Unique shape IDs');for(const tag of ['stCxn','endCxn'])for(const c of els(doc,A,tag)){assert(ids.includes(c.getAttribute('id')),'Connector target resolves');assert(Number.isInteger(+c.getAttribute('idx'))&&+c.getAttribute('idx')>=0,'Connector site index');}
    expected.groups.forEach(g=>{const matches=groups.filter(n=>els(n,P,'cNvPr')[0].getAttribute('name')===g.name);assert.equal(matches.length,1,'Exactly one original group '+g.name);assert.equal(joined(matches[0]),sourceGroupText(expected,g),'Original source group text remains complete '+g.name);});
    if(i){assert(s.includes('密集素材總覽（9 pt）'));for(const g of groups){const name=els(g,P,'cNvPr')[0].getAttribute('name');for(const n of els(g,A,'rPr')){const badge=i===1&&name.startsWith('09 字標與主題・方案 ')&&['A','B'].includes(joined(n.parentNode));assert.equal(n.getAttribute('sz'),badge?'850':'900','Dense native text stays 9pt; only original A/B glyph is 8.5pt');}}}
   }
  });
  await check(source+' component geometry has uniform scaling and readable captions',async()=>{for(const key of ['cards','schemebody','schemeiconbody'])checkTransform(expectedSources.find(s=>s.key===key),actualModel.slides.find(s=>s.key===key),key);});
 }
 console.log(JSON.stringify({checks,failures,exports:4,mainPages:9,secondaryPages:3,literalBaselineFiles:byteCompared,portableGoldenFiles:Object.keys(BASELINE_PART_SHA256).length}));if(failures)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
