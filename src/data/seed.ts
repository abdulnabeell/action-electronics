// DEMO CATALOGUE — every product, price and promotion below is sample data (isDemo: true).
// It is used when Supabase isn't configured and as the source for `npm run seed:sql`
// (which writes supabase/seed.sql). Replace it with real inventory through Admin, or edit here.
//
// Regional prices are stored per country and are NOT converted automatically: OMR figures below are
// separate demo values. A product with no row for a country is not sold in that country.
import { flattenApproved } from "./category-tree.ts";
import type { BrandRecord, CategoryRecord, ProductRecord, PromotionRecord } from "../types/catalog.ts";

// Approved hierarchy (src/data/category-tree.ts) + the previous categories that are no longer part of it, kept hidden
// so demo products without an approved home stay valid.
export const seedCategories: CategoryRecord[] = [
  ...flattenApproved().map(({ keepAr: _keepAr, ...c }) => c),
  ...([
  {
    "slug": "photographic",
    "name": {
      "en": "Photographic Equipment & Accessories",
      "ar": "معدات وإكسسوارات التصوير"
    },
    "parent": null,
    "sort": 0,
    "active": false
  },
  {
    "slug": "av-recording",
    "name": {
      "en": "Audio Visual Recording Equipment",
      "ar": "معدات التسجيل الصوتي والمرئي"
    },
    "parent": null,
    "sort": 2,
    "active": false
  },
  {
    "slug": "computers",
    "name": {
      "en": "Computers & Accessories",
      "ar": "الحواسيب وملحقاتها"
    },
    "parent": null,
    "sort": 4,
    "active": false
  },
  {
    "slug": "mobiles",
    "name": {
      "en": "Mobile Phones & Accessories",
      "ar": "الهواتف المحمولة وملحقاتها"
    },
    "parent": null,
    "sort": 5,
    "active": false
  },
  {
    "slug": "cameras",
    "name": {
      "en": "Cameras",
      "ar": "كاميرات"
    },
    "parent": "photographic",
    "sort": 6,
    "active": false
  },
  {
    "slug": "lenses-accessories",
    "name": {
      "en": "Lenses & Accessories",
      "ar": "عدسات وإكسسوارات"
    },
    "parent": "photographic",
    "sort": 7,
    "active": false
  },
  {
    "slug": "consoles",
    "name": {
      "en": "Consoles",
      "ar": "أجهزة الألعاب"
    },
    "parent": "games",
    "sort": 8,
    "active": false
  },
  {
    "slug": "game-titles",
    "name": {
      "en": "Game Titles",
      "ar": "عناوين الألعاب"
    },
    "parent": "games",
    "sort": 10,
    "active": false
  },
  {
    "slug": "action-cameras",
    "name": {
      "en": "Action Cameras & Camcorders",
      "ar": "كاميرات الحركة وكاميرات الفيديو"
    },
    "parent": "av-recording",
    "sort": 11,
    "active": false
  },
  {
    "slug": "audio-recording",
    "name": {
      "en": "Audio Recording",
      "ar": "التسجيل الصوتي"
    },
    "parent": "av-recording",
    "sort": 12,
    "active": false
  },
  {
    "slug": "laptops",
    "name": {
      "en": "Laptops",
      "ar": "حواسيب محمولة"
    },
    "parent": "computers",
    "sort": 15,
    "active": false
  },
  {
    "slug": "monitors",
    "name": {
      "en": "Monitors",
      "ar": "شاشات"
    },
    "parent": "computers",
    "sort": 16,
    "active": false
  },
  {
    "slug": "computer-accessories",
    "name": {
      "en": "Accessories",
      "ar": "ملحقات"
    },
    "parent": "computers",
    "sort": 17,
    "active": false
  },
  {
    "slug": "mobile-accessories",
    "name": {
      "en": "Accessories",
      "ar": "إكسسوارات"
    },
    "parent": "mobiles",
    "sort": 20,
    "active": false
  }
] as CategoryRecord[]),
];

export const seedBrands = [
  {
    "slug": "aperto",
    "name": "Aperto",
    "isDemo": true
  },
  {
    "slug": "playforge",
    "name": "Playforge",
    "isDemo": true
  },
  {
    "slug": "vividia",
    "name": "Vividia",
    "isDemo": true
  },
  {
    "slug": "chronix",
    "name": "Chronix",
    "isDemo": true
  },
  {
    "slug": "corelink",
    "name": "Corelink",
    "isDemo": true
  },
  {
    "slug": "zentrix",
    "name": "Zentrix",
    "isDemo": true
  },
  {
    "slug": "voltix",
    "name": "Voltix",
    "isDemo": true
  },
  {
    "slug": "brightwave",
    "name": "Brightwave",
    "isDemo": true
  }
] as BrandRecord[];

export const seedProducts = [
  {
    "id": "mirrorless-camera-kit",
    "slug": "mirrorless-camera-kit",
    "sku": "AE-PH-001",
    "name": {
      "en": "Mirrorless Camera 24MP with 16-50mm Lens",
      "ar": "كاميرا ميرورلس 24 ميجابكسل مع عدسة 16-50 مم"
    },
    "brand": "aperto",
    "category": "photographic",
    "subcategory": "cameras",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Compact mirrorless camera with a 24MP sensor, 4K video and a versatile kit lens.",
      "ar": "كاميرا ميرورلس صغيرة بمستشعر 24 ميجابكسل وفيديو 4K وعدسة متعددة الاستخدامات."
    },
    "specs": {
      "en": [
        "24MP APS-C sensor",
        "4K video",
        "Wi-Fi & Bluetooth"
      ],
      "ar": [
        "مستشعر APS-C بدقة 24 ميجابكسل",
        "فيديو 4K",
        "واي فاي وبلوتوث"
      ]
    },
    "images": [
      "/products/mirrorless-camera-kit.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": true,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-01T09:00:00Z",
    "prices": {
      "uae": {
        "price": 2899,
        "compareAt": 3299,
        "stock": 6,
        "available": true
      },
      "oman": {
        "price": 304.5,
        "compareAt": 346.5,
        "stock": 4,
        "available": true
      }
    }
  },
  {
    "id": "dslr-zoom-lens",
    "slug": "dslr-zoom-lens",
    "sku": "AE-PH-002",
    "name": {
      "en": "70-200mm f/2.8 Telephoto Zoom Lens",
      "ar": "عدسة تيليفوتو زوم 70-200 مم f/2.8"
    },
    "brand": "aperto",
    "category": "photographic",
    "subcategory": "lenses-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Fast telephoto zoom lens for portraits, sports and events.",
      "ar": "عدسة تيليفوتو زوم سريعة للبورتريه والرياضة والمناسبات."
    },
    "specs": {
      "en": [
        "70-200mm f/2.8",
        "Image stabilisation"
      ],
      "ar": [
        "70-200 مم f/2.8",
        "مثبّت للصورة"
      ]
    },
    "images": [
      "/products/dslr-zoom-lens.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-02T09:00:00Z",
    "prices": {
      "uae": {
        "price": 1999,
        "compareAt": null,
        "stock": 3,
        "available": true
      },
      "oman": {
        "price": 210.0,
        "compareAt": null,
        "stock": 2,
        "available": true
      }
    }
  },
  {
    "id": "aluminium-tripod",
    "slug": "aluminium-tripod",
    "sku": "AE-PH-003",
    "name": {
      "en": "Lightweight Aluminium Tripod 160cm",
      "ar": "حامل ثلاثي خفيف من الألمنيوم 160 سم"
    },
    "brand": "aperto",
    "category": "photographic",
    "subcategory": "lenses-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Sturdy folding tripod with a 3-way head, ideal for cameras and phones.",
      "ar": "حامل ثلاثي قابل للطي ومتين برأس ثلاثي الاتجاهات، مناسب للكاميرات والهواتف."
    },
    "specs": {
      "en": [
        "Max height 160cm",
        "Carry bag included"
      ],
      "ar": [
        "أقصى ارتفاع 160 سم",
        "حقيبة حمل مرفقة"
      ]
    },
    "images": [
      "/products/aluminium-tripod.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-03T09:00:00Z",
    "prices": {
      "uae": {
        "price": 129,
        "compareAt": null,
        "stock": 15,
        "available": true
      }
    }
  },
  {
    "id": "camera-bag",
    "slug": "camera-bag",
    "sku": "AE-PH-004",
    "name": {
      "en": "Padded Camera Bag with Dividers",
      "ar": "حقيبة كاميرا مبطنة مع فواصل"
    },
    "brand": "aperto",
    "category": "photographic",
    "subcategory": "lenses-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Padded shoulder bag with adjustable dividers for a camera body, lenses and accessories.",
      "ar": "حقيبة كتف مبطنة بفواصل قابلة للتعديل لجسم الكاميرا والعدسات والإكسسوارات."
    },
    "specs": {
      "en": [
        "Adjustable dividers",
        "Padded shoulder strap"
      ],
      "ar": [
        "فواصل قابلة للتعديل",
        "حزام كتف مبطن"
      ]
    },
    "images": [
      "/products/camera-bag.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-04T09:00:00Z",
    "prices": {
      "uae": {
        "price": 179,
        "compareAt": null,
        "stock": 10,
        "available": true
      },
      "oman": {
        "price": 19.0,
        "compareAt": null,
        "stock": 6,
        "available": true
      }
    }
  },
  {
    "id": "speedlite-flash",
    "slug": "speedlite-flash",
    "sku": "AE-PH-005",
    "name": {
      "en": "TTL Speedlite Flash",
      "ar": "فلاش سبيدلايت TTL"
    },
    "brand": "aperto",
    "category": "photographic",
    "subcategory": "lenses-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Powerful external flash with tilt and swivel head for natural-looking light.",
      "ar": "فلاش خارجي قوي برأس قابل للإمالة والتدوير لإضاءة طبيعية."
    },
    "specs": {
      "en": [
        "Guide number 60",
        "Wireless trigger"
      ],
      "ar": [
        "رقم الدليل 60",
        "مشغّل لاسلكي"
      ]
    },
    "images": [
      "/products/speedlite-flash.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-05T09:00:00Z",
    "prices": {
      "uae": {
        "price": 349,
        "compareAt": null,
        "stock": 0,
        "available": true
      },
      "oman": {
        "price": 36.5,
        "compareAt": null,
        "stock": 0,
        "available": true
      }
    }
  },
  {
    "id": "pre-owned-dslr-body",
    "slug": "pre-owned-dslr-body",
    "sku": "AE-PH-006",
    "name": {
      "en": "Pre-Owned DSLR Camera Body",
      "ar": "جسم كاميرا DSLR مستعمل"
    },
    "brand": "aperto",
    "category": "photographic",
    "subcategory": "cameras",
    "condition": "pre_owned",
    "grade": "A",
    "description": {
      "en": "Pre-owned DSLR body in very good condition. Lens sold separately.",
      "ar": "جسم كاميرا DSLR مستعمل بحالة جيدة جداً. العدسة تُباع منفصلة."
    },
    "specs": {
      "en": [
        "Body only",
        "Pre-owned unit"
      ],
      "ar": [
        "جسم الكاميرا فقط",
        "جهاز مستعمل"
      ]
    },
    "images": [
      "/products/pre-owned-dslr-body.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-06T09:00:00Z",
    "prices": {
      "uae": {
        "price": 1299,
        "compareAt": 1699,
        "stock": 1,
        "available": true
      },
      "oman": {
        "price": 136.5,
        "compareAt": 178.5,
        "stock": 1,
        "available": true
      }
    }
  },
  {
    "id": "next-gen-console",
    "slug": "next-gen-console",
    "sku": "AE-GM-001",
    "name": {
      "en": "Next-Gen Game Console with Wireless Controller",
      "ar": "جهاز ألعاب من الجيل الجديد مع يد تحكم لاسلكية"
    },
    "brand": "playforge",
    "category": "games",
    "subcategory": "consoles",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Powerful home console with a wireless controller for fast-loading games.",
      "ar": "جهاز ألعاب منزلي قوي مع يد تحكم لاسلكية لتشغيل الألعاب بسرعة."
    },
    "specs": {
      "en": [
        "Wireless controller included",
        "Fast SSD storage"
      ],
      "ar": [
        "يد تحكم لاسلكية مرفقة",
        "تخزين SSD سريع"
      ]
    },
    "images": [
      "/products/next-gen-console.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": true,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-07T09:00:00Z",
    "prices": {
      "uae": {
        "price": 1999,
        "compareAt": null,
        "stock": 8,
        "available": true
      },
      "oman": {
        "price": 210.0,
        "compareAt": null,
        "stock": 5,
        "available": true
      }
    }
  },
  {
    "id": "wireless-game-controller",
    "slug": "wireless-game-controller",
    "sku": "AE-GM-002",
    "name": {
      "en": "Wireless Game Controller",
      "ar": "يد تحكم ألعاب لاسلكية"
    },
    "brand": "playforge",
    "category": "games",
    "subcategory": "gaming-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Ergonomic Bluetooth controller with vibration feedback and a rechargeable battery.",
      "ar": "يد تحكم بلوتوث مريحة مع اهتزاز وبطارية قابلة للشحن."
    },
    "specs": {
      "en": [
        "Bluetooth",
        "Rechargeable battery"
      ],
      "ar": [
        "بلوتوث",
        "بطارية قابلة للشحن"
      ]
    },
    "images": [
      "/products/wireless-game-controller.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-08T09:00:00Z",
    "prices": {
      "uae": {
        "price": 229,
        "compareAt": null,
        "stock": 20,
        "available": true
      },
      "oman": {
        "price": 24.0,
        "compareAt": null,
        "stock": 10,
        "available": true
      }
    }
  },
  {
    "id": "handheld-console",
    "slug": "handheld-console",
    "sku": "AE-GM-003",
    "name": {
      "en": "Handheld Gaming Console",
      "ar": "جهاز ألعاب محمول"
    },
    "brand": "playforge",
    "category": "games",
    "subcategory": "consoles",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Portable console for gaming at home or on the go.",
      "ar": "جهاز ألعاب محمول للعب في المنزل أو أثناء التنقل."
    },
    "specs": {
      "en": [
        "Built-in screen",
        "Rechargeable battery"
      ],
      "ar": [
        "شاشة مدمجة",
        "بطارية قابلة للشحن"
      ]
    },
    "images": [
      "/products/handheld-console.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-09T09:00:00Z",
    "prices": {
      "uae": {
        "price": 1199,
        "compareAt": null,
        "stock": 5,
        "available": true
      },
      "oman": {
        "price": 126.0,
        "compareAt": null,
        "stock": 3,
        "available": true
      }
    }
  },
  {
    "id": "gaming-headset",
    "slug": "gaming-headset",
    "sku": "AE-GM-004",
    "name": {
      "en": "Surround Sound Gaming Headset",
      "ar": "سماعة ألعاب بصوت محيطي"
    },
    "brand": "playforge",
    "category": "games",
    "subcategory": "gaming-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Comfortable over-ear headset with a boom microphone and deep bass.",
      "ar": "سماعة مريحة فوق الأذن مع ميكروفون وصوت جهير عميق."
    },
    "specs": {
      "en": [
        "Boom microphone",
        "USB connection"
      ],
      "ar": [
        "ميكروفون قابل للتعديل",
        "توصيل USB"
      ]
    },
    "images": [
      "/products/gaming-headset.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-10T09:00:00Z",
    "prices": {
      "uae": {
        "price": 189,
        "compareAt": 229,
        "stock": 12,
        "available": true
      },
      "oman": {
        "price": 20.0,
        "compareAt": 24.0,
        "stock": 7,
        "available": true
      }
    }
  },
  {
    "id": "family-fitness-game",
    "slug": "family-fitness-game",
    "sku": "AE-GM-005",
    "name": {
      "en": "Family Fitness Adventure Game",
      "ar": "لعبة المغامرة واللياقة للعائلة"
    },
    "brand": "playforge",
    "category": "games",
    "subcategory": "game-titles",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Active adventure game that gets the whole family moving.",
      "ar": "لعبة مغامرات حركية تجعل العائلة بأكملها تتحرك."
    },
    "specs": {
      "en": [
        "Cartridge edition",
        "Single or co-op play"
      ],
      "ar": [
        "إصدار خرطوشة",
        "لعب فردي أو تعاوني"
      ]
    },
    "images": [
      "/products/family-fitness-game.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-11T09:00:00Z",
    "prices": {
      "uae": {
        "price": 199,
        "compareAt": null,
        "stock": 12,
        "available": true
      },
      "oman": {
        "price": 21.0,
        "compareAt": null,
        "stock": 6,
        "available": true
      }
    }
  },
  {
    "id": "pre-owned-console-500gb",
    "slug": "pre-owned-console-500gb",
    "sku": "AE-GM-006",
    "name": {
      "en": "Pre-Owned Game Console 500GB with Controller",
      "ar": "جهاز ألعاب مستعمل 500 جيجابايت مع يد تحكم"
    },
    "brand": "playforge",
    "category": "pre-owned",
    "subcategory": "pre-owned-gaming",
    "condition": "pre_owned",
    "grade": "B",
    "description": {
      "en": "Tested pre-owned console supplied with one controller.",
      "ar": "جهاز ألعاب مستعمل تم اختباره ويأتي مع يد تحكم واحدة."
    },
    "specs": {
      "en": [
        "500GB storage",
        "1 controller included"
      ],
      "ar": [
        "تخزين 500 جيجابايت",
        "يد تحكم واحدة مرفقة"
      ]
    },
    "images": [
      "/products/pre-owned-console-500gb.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-12T09:00:00Z",
    "prices": {
      "uae": {
        "price": 799,
        "compareAt": 999,
        "stock": 3,
        "available": true
      },
      "oman": {
        "price": 84.0,
        "compareAt": 105.0,
        "stock": 2,
        "available": true
      }
    }
  },
  {
    "id": "action-camera-4k",
    "slug": "action-camera-4k",
    "sku": "AE-AV-001",
    "name": {
      "en": "4K Action Camera with Waterproof Case",
      "ar": "كاميرا حركة 4K مع علبة مقاومة للماء"
    },
    "brand": "vividia",
    "category": "av-recording",
    "subcategory": "action-cameras",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Compact action camera with image stabilisation and a waterproof housing.",
      "ar": "كاميرا حركة صغيرة مع تثبيت للصورة وعلبة مقاومة للماء."
    },
    "specs": {
      "en": [
        "4K video",
        "Waterproof housing",
        "Wi-Fi"
      ],
      "ar": [
        "فيديو 4K",
        "علبة مقاومة للماء",
        "واي فاي"
      ]
    },
    "images": [
      "/products/action-camera-4k.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": true,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-13T09:00:00Z",
    "prices": {
      "uae": {
        "price": 449,
        "compareAt": 549,
        "stock": 14,
        "available": true
      },
      "oman": {
        "price": 47.0,
        "compareAt": 57.5,
        "stock": 8,
        "available": true
      }
    }
  },
  {
    "id": "usb-condenser-mic",
    "slug": "usb-condenser-mic",
    "sku": "AE-AV-002",
    "name": {
      "en": "USB Condenser Microphone",
      "ar": "ميكروفون كوندنسر USB"
    },
    "brand": "vividia",
    "category": "av-recording",
    "subcategory": "audio-recording",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Plug-and-play studio-quality microphone for streaming, podcasts and calls.",
      "ar": "ميكروفون بجودة الاستوديو يعمل مباشرة للبث والبودكاست والمكالمات."
    },
    "specs": {
      "en": [
        "USB connection",
        "Desk stand"
      ],
      "ar": [
        "توصيل USB",
        "حامل مكتبي"
      ]
    },
    "images": [
      "/products/usb-condenser-mic.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-14T09:00:00Z",
    "prices": {
      "uae": {
        "price": 219,
        "compareAt": null,
        "stock": 9,
        "available": true
      },
      "oman": {
        "price": 23.0,
        "compareAt": null,
        "stock": 5,
        "available": true
      }
    }
  },
  {
    "id": "pocket-voice-recorder",
    "slug": "pocket-voice-recorder",
    "sku": "AE-AV-003",
    "name": {
      "en": "Digital Voice Recorder",
      "ar": "مسجل صوت رقمي"
    },
    "brand": "vividia",
    "category": "av-recording",
    "subcategory": "audio-recording",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Pocket voice recorder, ideal for meetings and lectures.",
      "ar": "مسجل صوت للجيب، مثالي للاجتماعات والمحاضرات."
    },
    "specs": {
      "en": [
        "Built-in microphone",
        "USB connection"
      ],
      "ar": [
        "ميكروفون مدمج",
        "توصيل USB"
      ]
    },
    "images": [
      "/products/pocket-voice-recorder.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-15T09:00:00Z",
    "prices": {
      "uae": {
        "price": 149,
        "compareAt": null,
        "stock": 18,
        "available": true
      },
      "oman": {
        "price": 15.5,
        "compareAt": null,
        "stock": 10,
        "available": true
      }
    }
  },
  {
    "id": "pro-camcorder",
    "slug": "pro-camcorder",
    "sku": "AE-AV-004",
    "name": {
      "en": "Full HD Camcorder with Optical Zoom",
      "ar": "كاميرا فيديو Full HD بتقريب بصري"
    },
    "brand": "vividia",
    "category": "av-recording",
    "subcategory": "action-cameras",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Handheld camcorder for events and family videos with a long optical zoom.",
      "ar": "كاميرا فيديو محمولة للمناسبات والفيديوهات العائلية مع تقريب بصري طويل."
    },
    "specs": {
      "en": [
        "Full HD video",
        "Optical zoom"
      ],
      "ar": [
        "فيديو Full HD",
        "تقريب بصري"
      ]
    },
    "images": [
      "/products/pro-camcorder.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-16T09:00:00Z",
    "prices": {
      "uae": {
        "price": 1399,
        "compareAt": null,
        "stock": 4,
        "available": true
      },
      "oman": {
        "price": 147.0,
        "compareAt": null,
        "stock": 2,
        "available": true
      }
    }
  },
  {
    "id": "full-hd-webcam",
    "slug": "full-hd-webcam",
    "sku": "AE-AV-005",
    "name": {
      "en": "Full HD Webcam with Privacy Cover",
      "ar": "كاميرا ويب Full HD مع غطاء للخصوصية"
    },
    "brand": "vividia",
    "category": "av-recording",
    "subcategory": "action-cameras",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Sharp 1080p webcam with a built-in microphone for calls and streaming.",
      "ar": "كاميرا ويب بدقة 1080p مع ميكروفون مدمج للمكالمات والبث."
    },
    "specs": {
      "en": [
        "1080p video",
        "Built-in microphone",
        "Privacy cover"
      ],
      "ar": [
        "فيديو 1080p",
        "ميكروفون مدمج",
        "غطاء للخصوصية"
      ]
    },
    "images": [
      "/products/full-hd-webcam.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-17T09:00:00Z",
    "prices": {
      "uae": {
        "price": 119,
        "compareAt": null,
        "stock": 0,
        "available": true
      },
      "oman": {
        "price": 12.5,
        "compareAt": null,
        "stock": 0,
        "available": true
      }
    }
  },
  {
    "id": "fitness-smartwatch",
    "slug": "fitness-smartwatch",
    "sku": "AE-SW-001",
    "name": {
      "en": "Fitness Smart Watch with Interchangeable Straps",
      "ar": "ساعة ذكية رياضية بأحزمة قابلة للتبديل"
    },
    "brand": "chronix",
    "category": "smart-watches",
    "subcategory": "smartwatches",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Tracks heart rate, sleep and workouts, with call and message notifications.",
      "ar": "تتبع معدل ضربات القلب والنوم والتمارين مع إشعارات المكالمات والرسائل."
    },
    "specs": {
      "en": [
        "Heart-rate tracking",
        "Sleep tracking",
        "Notifications"
      ],
      "ar": [
        "تتبع معدل ضربات القلب",
        "تتبع النوم",
        "الإشعارات"
      ]
    },
    "images": [
      "/products/fitness-smartwatch.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": true,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-18T09:00:00Z",
    "prices": {
      "uae": {
        "price": 349,
        "compareAt": 429,
        "stock": 16,
        "available": true
      },
      "oman": {
        "price": 36.5,
        "compareAt": 45.0,
        "stock": 9,
        "available": true
      }
    }
  },
  {
    "id": "kids-smartwatch",
    "slug": "kids-smartwatch",
    "sku": "AE-SW-002",
    "name": {
      "en": "Kids Smart Watch",
      "ar": "ساعة ذكية للأطفال"
    },
    "brand": "chronix",
    "category": "smart-watches",
    "subcategory": "smartwatches",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Child-friendly watch with a colourful strap and easy-to-read display.",
      "ar": "ساعة مناسبة للأطفال بحزام ملون وشاشة سهلة القراءة."
    },
    "specs": {
      "en": [
        "Colour display",
        "Soft silicone strap"
      ],
      "ar": [
        "شاشة ملونة",
        "حزام سيليكون ناعم"
      ]
    },
    "images": [
      "/products/kids-smartwatch.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-19T09:00:00Z",
    "prices": {
      "uae": {
        "price": 199,
        "compareAt": null,
        "stock": 11,
        "available": true
      },
      "oman": {
        "price": 21.0,
        "compareAt": null,
        "stock": 6,
        "available": true
      }
    }
  },
  {
    "id": "sport-smartwatch",
    "slug": "sport-smartwatch",
    "sku": "AE-SW-003",
    "name": {
      "en": "Rugged Sport Smart Watch",
      "ar": "ساعة ذكية رياضية متينة"
    },
    "brand": "chronix",
    "category": "smart-watches",
    "subcategory": "smartwatches",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Tough sports watch built for running and outdoor training.",
      "ar": "ساعة رياضية متينة مصممة للجري والتدريب في الهواء الطلق."
    },
    "specs": {
      "en": [
        "Sport modes",
        "Durable strap"
      ],
      "ar": [
        "أوضاع رياضية",
        "حزام متين"
      ]
    },
    "images": [
      "/products/sport-smartwatch.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-20T09:00:00Z",
    "prices": {
      "uae": {
        "price": 599,
        "compareAt": null,
        "stock": 7,
        "available": true
      },
      "oman": {
        "price": 63.0,
        "compareAt": null,
        "stock": 4,
        "available": true
      }
    }
  },
  {
    "id": "classic-round-smartwatch",
    "slug": "classic-round-smartwatch",
    "sku": "AE-SW-004",
    "name": {
      "en": "Classic Round Smart Watch",
      "ar": "ساعة ذكية دائرية كلاسيكية"
    },
    "brand": "chronix",
    "category": "smart-watches",
    "subcategory": "smartwatches",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Round smart watch with a rotating bezel, notifications and activity tracking.",
      "ar": "ساعة ذكية دائرية بإطار دوار وإشعارات وتتبع للنشاط."
    },
    "specs": {
      "en": [
        "Round display",
        "Activity tracking"
      ],
      "ar": [
        "شاشة دائرية",
        "تتبع النشاط"
      ]
    },
    "images": [
      "/products/classic-round-smartwatch.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-01T09:00:00Z",
    "prices": {
      "uae": {
        "price": 479,
        "compareAt": null,
        "stock": 6,
        "available": true
      },
      "oman": {
        "price": 50.5,
        "compareAt": null,
        "stock": 4,
        "available": true
      }
    }
  },
  {
    "id": "slim-fitness-band",
    "slug": "slim-fitness-band",
    "sku": "AE-SW-005",
    "name": {
      "en": "Slim Fitness Band",
      "ar": "سوار لياقة نحيف"
    },
    "brand": "chronix",
    "category": "smart-watches",
    "subcategory": "fitness-bands",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Lightweight activity band with step and sleep tracking.",
      "ar": "سوار نشاط خفيف مع تتبع الخطوات والنوم."
    },
    "specs": {
      "en": [
        "AMOLED display",
        "Step & sleep tracking"
      ],
      "ar": [
        "شاشة AMOLED",
        "تتبع الخطوات والنوم"
      ]
    },
    "images": [
      "/products/slim-fitness-band.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-02T09:00:00Z",
    "prices": {
      "uae": {
        "price": 99,
        "compareAt": null,
        "stock": 30,
        "available": true
      },
      "oman": {
        "price": 10.4,
        "compareAt": null,
        "stock": 20,
        "available": true
      }
    }
  },
  {
    "id": "pre-owned-smartwatch",
    "slug": "pre-owned-smartwatch",
    "sku": "AE-SW-006",
    "name": {
      "en": "Pre-Owned Smart Watch",
      "ar": "ساعة ذكية مستعملة"
    },
    "brand": "chronix",
    "category": "smart-watches",
    "subcategory": "smartwatches",
    "condition": "pre_owned",
    "grade": "A",
    "description": {
      "en": "Pre-owned smart watch in excellent condition with a fresh strap.",
      "ar": "ساعة ذكية مستعملة بحالة ممتازة مع حزام جديد."
    },
    "specs": {
      "en": [
        "Pre-owned unit",
        "Tested & reset"
      ],
      "ar": [
        "جهاز مستعمل",
        "تم اختباره وإعادة ضبطه"
      ]
    },
    "images": [
      "/products/pre-owned-smartwatch.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-03T09:00:00Z",
    "prices": {
      "uae": {
        "price": 549,
        "compareAt": 749,
        "stock": 2,
        "available": true
      },
      "oman": {
        "price": 57.5,
        "compareAt": 78.5,
        "stock": 1,
        "available": true
      }
    }
  },
  {
    "id": "laptop-14-i5",
    "slug": "laptop-14-i5",
    "sku": "AE-CP-001",
    "name": {
      "en": "14-inch Laptop, Core i5, 16GB / 512GB",
      "ar": "حاسوب محمول 14 بوصة، Core i5، 16 جيجابايت / 512 جيجابايت"
    },
    "brand": "corelink",
    "category": "computers",
    "subcategory": "laptops",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Slim everyday laptop for work and study with a fast SSD.",
      "ar": "حاسوب محمول نحيف للعمل والدراسة مع قرص SSD سريع."
    },
    "specs": {
      "en": [
        "14-inch FHD",
        "16GB RAM",
        "512GB SSD"
      ],
      "ar": [
        "شاشة 14 بوصة FHD",
        "ذاكرة 16 جيجابايت",
        "قرص SSD سعة 512 جيجابايت"
      ]
    },
    "images": [
      "/products/laptop-14-i5.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": true,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-04T09:00:00Z",
    "prices": {
      "uae": {
        "price": 2599,
        "compareAt": 2899,
        "stock": 7,
        "available": true
      },
      "oman": {
        "price": 273.0,
        "compareAt": 304.5,
        "stock": 4,
        "available": true
      }
    }
  },
  {
    "id": "wireless-keyboard-mouse",
    "slug": "wireless-keyboard-mouse",
    "sku": "AE-CP-002",
    "name": {
      "en": "Wireless Keyboard & Mouse Combo",
      "ar": "طقم لوحة مفاتيح وفأرة لاسلكي"
    },
    "brand": "corelink",
    "category": "computers",
    "subcategory": "computer-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Quiet, full-size wireless keyboard and mouse set with one USB receiver.",
      "ar": "طقم لوحة مفاتيح كاملة الحجم وفأرة لاسلكية هادئة بمستقبل USB واحد."
    },
    "specs": {
      "en": [
        "2.4GHz wireless",
        "Quiet keys"
      ],
      "ar": [
        "لاسلكي 2.4 جيجاهرتز",
        "مفاتيح هادئة"
      ]
    },
    "images": [
      "/products/wireless-keyboard-mouse.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-05T09:00:00Z",
    "prices": {
      "uae": {
        "price": 89,
        "compareAt": null,
        "stock": 25,
        "available": true
      },
      "oman": {
        "price": 9.3,
        "compareAt": null,
        "stock": 15,
        "available": true
      }
    }
  },
  {
    "id": "portable-ssd-1tb",
    "slug": "portable-ssd-1tb",
    "sku": "AE-CP-003",
    "name": {
      "en": "1TB Portable SSD",
      "ar": "قرص SSD محمول سعة 1 تيرابايت"
    },
    "brand": "corelink",
    "category": "computers",
    "subcategory": "computer-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Pocket-size external SSD with fast transfer speeds for backups and files.",
      "ar": "قرص SSD خارجي بحجم الجيب بسرعة نقل عالية للنسخ الاحتياطي والملفات."
    },
    "specs": {
      "en": [
        "1TB capacity",
        "USB connection"
      ],
      "ar": [
        "سعة 1 تيرابايت",
        "توصيل USB"
      ]
    },
    "images": [
      "/products/portable-ssd-1tb.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-06T09:00:00Z",
    "prices": {
      "uae": {
        "price": 379,
        "compareAt": null,
        "stock": 13,
        "available": true
      },
      "oman": {
        "price": 40.0,
        "compareAt": null,
        "stock": 7,
        "available": true
      }
    }
  },
  {
    "id": "monitor-22-lcd",
    "slug": "monitor-22-lcd",
    "sku": "AE-CP-004",
    "name": {
      "en": "22-inch LCD Monitor",
      "ar": "شاشة LCD مقاس 22 بوصة"
    },
    "brand": "corelink",
    "category": "computers",
    "subcategory": "monitors",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Widescreen LCD monitor with an adjustable stand for home and office.",
      "ar": "شاشة LCD عريضة بحامل قابل للتعديل للمنزل والمكتب."
    },
    "specs": {
      "en": [
        "LCD display",
        "Adjustable stand"
      ],
      "ar": [
        "شاشة LCD",
        "حامل قابل للتعديل"
      ]
    },
    "images": [
      "/products/monitor-22-lcd.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-07T09:00:00Z",
    "prices": {
      "uae": {
        "price": 349,
        "compareAt": null,
        "stock": 6,
        "available": true
      }
    }
  },
  {
    "id": "usb-c-hub",
    "slug": "usb-c-hub",
    "sku": "AE-CP-005",
    "name": {
      "en": "Multi-Port USB-C Hub",
      "ar": "موزع USB-C متعدد المنافذ"
    },
    "brand": "corelink",
    "category": "computers",
    "subcategory": "computer-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Adds USB-A, USB-C and card-reader ports to your laptop.",
      "ar": "يضيف منافذ USB-A وUSB-C وقارئ بطاقات إلى حاسوبك المحمول."
    },
    "specs": {
      "en": [
        "USB-A & USB-C ports",
        "SD / microSD reader"
      ],
      "ar": [
        "منافذ USB-A وUSB-C",
        "قارئ SD / microSD"
      ]
    },
    "images": [
      "/products/usb-c-hub.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-08T09:00:00Z",
    "prices": {
      "uae": {
        "price": 129,
        "compareAt": null,
        "stock": 0,
        "available": true
      },
      "oman": {
        "price": 13.5,
        "compareAt": null,
        "stock": 0,
        "available": true
      }
    }
  },
  {
    "id": "pre-owned-business-laptop",
    "slug": "pre-owned-business-laptop",
    "sku": "AE-CP-006",
    "name": {
      "en": "Pre-Owned 15.6-inch Business Laptop",
      "ar": "حاسوب محمول مستعمل للأعمال مقاس 15.6 بوصة"
    },
    "brand": "corelink",
    "category": "pre-owned",
    "subcategory": "pre-owned-laptops",
    "condition": "pre_owned",
    "grade": "B",
    "description": {
      "en": "Tested pre-owned business laptop. Exact specifications are confirmed per unit.",
      "ar": "حاسوب محمول مستعمل للأعمال تم اختباره. تُؤكَّد المواصفات الدقيقة لكل جهاز."
    },
    "specs": {
      "en": [
        "15.6-inch display",
        "Pre-owned unit"
      ],
      "ar": [
        "شاشة 15.6 بوصة",
        "جهاز مستعمل"
      ]
    },
    "images": [
      "/products/pre-owned-business-laptop.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-09T09:00:00Z",
    "prices": {
      "uae": {
        "price": 999,
        "compareAt": 1399,
        "stock": 3,
        "available": true
      }
    }
  },
  {
    "id": "flagship-smartphone-256",
    "slug": "flagship-smartphone-256",
    "sku": "AE-MB-001",
    "name": {
      "en": "Flagship Smartphone 256GB",
      "ar": "هاتف ذكي رائد 256 جيجابايت"
    },
    "brand": "zentrix",
    "category": "mobile-tablets",
    "subcategory": "mobile-phones",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Premium 5G smartphone with a bright AMOLED display and pro-grade camera system.",
      "ar": "هاتف 5G متميز بشاشة AMOLED ساطعة ونظام كاميرا احترافي."
    },
    "specs": {
      "en": [
        "AMOLED display",
        "256GB storage",
        "5G"
      ],
      "ar": [
        "شاشة AMOLED",
        "تخزين 256 جيجابايت",
        "5G"
      ]
    },
    "images": [
      "/products/flagship-smartphone-256.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": true,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-10T09:00:00Z",
    "prices": {
      "uae": {
        "price": 3299,
        "compareAt": 3499,
        "stock": 9,
        "available": true
      },
      "oman": {
        "price": 346.5,
        "compareAt": 367.5,
        "stock": 5,
        "available": true
      }
    }
  },
  {
    "id": "midrange-smartphone-128",
    "slug": "midrange-smartphone-128",
    "sku": "AE-MB-002",
    "name": {
      "en": "Mid-range Smartphone 128GB",
      "ar": "هاتف ذكي متوسط الفئة 128 جيجابايت"
    },
    "brand": "zentrix",
    "category": "mobile-tablets",
    "subcategory": "mobile-phones",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Great everyday phone with a large display, fast charging and a capable camera.",
      "ar": "هاتف ممتاز للاستخدام اليومي بشاشة كبيرة وشحن سريع وكاميرا جيدة."
    },
    "specs": {
      "en": [
        "Large display",
        "128GB storage",
        "Fast charging"
      ],
      "ar": [
        "شاشة كبيرة",
        "تخزين 128 جيجابايت",
        "شحن سريع"
      ]
    },
    "images": [
      "/products/midrange-smartphone-128.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-11T09:00:00Z",
    "prices": {
      "uae": {
        "price": 899,
        "compareAt": null,
        "stock": 17,
        "available": true
      },
      "oman": {
        "price": 94.5,
        "compareAt": null,
        "stock": 10,
        "available": true
      }
    }
  },
  {
    "id": "fast-charger-power-bank",
    "slug": "fast-charger-power-bank",
    "sku": "AE-MB-003",
    "name": {
      "en": "Portable Power Bank with USB Cable",
      "ar": "شاحن محمول (باور بانك) مع كابل USB"
    },
    "brand": "voltix",
    "category": "mobiles",
    "subcategory": "mobile-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Pocket-size power bank for charging phones and tablets on the go.",
      "ar": "باور بانك بحجم الجيب لشحن الهواتف والأجهزة اللوحية أثناء التنقل."
    },
    "specs": {
      "en": [
        "Portable size",
        "USB cable included"
      ],
      "ar": [
        "حجم محمول",
        "كابل USB مرفق"
      ]
    },
    "images": [
      "/products/fast-charger-power-bank.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-12T09:00:00Z",
    "prices": {
      "uae": {
        "price": 149,
        "compareAt": null,
        "stock": 22,
        "available": true
      },
      "oman": {
        "price": 15.5,
        "compareAt": null,
        "stock": 12,
        "available": true
      }
    }
  },
  {
    "id": "wireless-earbuds-case",
    "slug": "wireless-earbuds-case",
    "sku": "AE-MB-004",
    "name": {
      "en": "True Wireless Earbuds with Charging Case",
      "ar": "سماعات لاسلكية حقيقية مع علبة شحن"
    },
    "brand": "voltix",
    "category": "mobiles",
    "subcategory": "mobile-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Clear sound and long playtime with a pocket charging case.",
      "ar": "صوت نقي ومدة تشغيل طويلة مع علبة شحن للجيب."
    },
    "specs": {
      "en": [
        "Bluetooth",
        "Charging case"
      ],
      "ar": [
        "بلوتوث",
        "علبة شحن"
      ]
    },
    "images": [
      "/products/wireless-earbuds-case.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-13T09:00:00Z",
    "prices": {
      "uae": {
        "price": 159,
        "compareAt": 199,
        "stock": 19,
        "available": true
      },
      "oman": {
        "price": 16.5,
        "compareAt": 21.0,
        "stock": 11,
        "available": true
      }
    }
  },
  {
    "id": "shockproof-phone-case",
    "slug": "shockproof-phone-case",
    "sku": "AE-MB-005",
    "name": {
      "en": "Clear Shockproof Phone Case",
      "ar": "غطاء هاتف شفاف مقاوم للصدمات"
    },
    "brand": "voltix",
    "category": "mobiles",
    "subcategory": "mobile-accessories",
    "condition": "new",
    "grade": null,
    "description": {
      "en": "Slim protective case with reinforced corners. Tell us your phone model in the order notes.",
      "ar": "غطاء حماية نحيف بزوايا معززة. أخبرنا بطراز هاتفك في ملاحظات الطلب."
    },
    "specs": {
      "en": [
        "Clear design",
        "Reinforced corners"
      ],
      "ar": [
        "تصميم شفاف",
        "زوايا معززة"
      ]
    },
    "images": [
      "/products/shockproof-phone-case.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-14T09:00:00Z",
    "prices": {
      "uae": {
        "price": 35,
        "compareAt": null,
        "stock": 60,
        "available": true
      },
      "oman": {
        "price": 3.7,
        "compareAt": null,
        "stock": 30,
        "available": true
      }
    }
  },
  {
    "id": "pre-owned-iphone-128",
    "slug": "pre-owned-iphone-128",
    "sku": "AE-MB-006",
    "name": {
      "en": "Pre-Owned Smartphone 128GB",
      "ar": "هاتف ذكي مستعمل 128 جيجابايت"
    },
    "brand": "zentrix",
    "category": "pre-owned",
    "subcategory": "pre-owned-mobiles-iphones",
    "condition": "pre_owned",
    "grade": "A",
    "description": {
      "en": "Pre-owned smartphone in very good condition, tested and reset.",
      "ar": "هاتف ذكي مستعمل بحالة جيدة جداً، تم اختباره وإعادة ضبطه."
    },
    "specs": {
      "en": [
        "128GB storage",
        "Tested & reset"
      ],
      "ar": [
        "تخزين 128 جيجابايت",
        "تم اختباره وإعادة ضبطه"
      ]
    },
    "images": [
      "/products/pre-owned-iphone-128.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-15T09:00:00Z",
    "prices": {
      "uae": {
        "price": 1199,
        "compareAt": 1599,
        "stock": 2,
        "available": true
      },
      "oman": {
        "price": 126.0,
        "compareAt": 168.0,
        "stock": 1,
        "available": true
      }
    }
  },
  {
    "id": "pre-owned-tablet-64",
    "slug": "pre-owned-tablet-64",
    "sku": "AE-MB-007",
    "name": {
      "en": "Pre-Owned Tablet 64GB",
      "ar": "جهاز لوحي مستعمل 64 جيجابايت"
    },
    "brand": "zentrix",
    "category": "mobile-tablets",
    "subcategory": "tablets",
    "condition": "pre_owned",
    "grade": "B",
    "description": {
      "en": "Pre-owned tablet with a bright display, tested and ready to use.",
      "ar": "جهاز لوحي مستعمل بشاشة ساطعة، تم اختباره وجاهز للاستخدام."
    },
    "specs": {
      "en": [
        "64GB storage",
        "Tested & reset"
      ],
      "ar": [
        "تخزين 64 جيجابايت",
        "تم اختباره وإعادة ضبطه"
      ]
    },
    "images": [
      "/products/pre-owned-tablet-64.jpg"
    ],
    "warranty": {
      "en": "Warranty details to be confirmed by Action Electronics.",
      "ar": "سيتم تأكيد تفاصيل الضمان من أكشن إلكترونيكس."
    },
    "featured": false,
    "active": true,
    "isDemo": true,
    "createdAt": "2026-10-16T09:00:00Z",
    "prices": {
      "uae": {
        "price": 699,
        "compareAt": 899,
        "stock": 4,
        "available": true
      },
      "oman": {
        "price": 73.5,
        "compareAt": 94.5,
        "stock": 2,
        "available": true
      }
    }
  }
] as ProductRecord[];

export const seedPromotions = [
  {
    "id": "demo-promo-preowned",
    "title": {
      "en": "Pre-owned phones, laptops & tablets",
      "ar": "هواتف وحواسيب وأجهزة لوحية مستعملة"
    },
    "subtitle": {
      "en": "Quality-checked devices at lower prices",
      "ar": "أجهزة تم فحصها بأسعار أقل"
    },
    "imageUrl": null,
    "linkPath": "/pre-owned",
    "discountPercent": 0,
    "scope": "all",
    "scopeValue": null,
    "country": null,
    "startsAt": null,
    "endsAt": null,
    "active": true,
    "sort": 1
  },
  {
    "id": "demo-promo-games",
    "title": {
      "en": "Demo offer: 10% off games",
      "ar": "عرض تجريبي: خصم 10% على الألعاب"
    },
    "subtitle": {
      "en": "Consoles, controllers and game titles",
      "ar": "أجهزة ألعاب ويد تحكم وعناوين ألعاب"
    },
    "imageUrl": null,
    "linkPath": "/category/games",
    "discountPercent": 10,
    "scope": "category",
    "scopeValue": "games",
    "country": null,
    "startsAt": null,
    "endsAt": null,
    "active": true,
    "sort": 2
  },
  {
    "id": "demo-promo-watches",
    "title": {
      "en": "New & pre-owned smart watches",
      "ar": "ساعات ذكية جديدة ومستعملة"
    },
    "subtitle": {
      "en": "Fitness, sport and everyday styles",
      "ar": "أنماط رياضية ويومية"
    },
    "imageUrl": null,
    "linkPath": "/category/smart-watches",
    "discountPercent": 0,
    "scope": "all",
    "scopeValue": null,
    "country": null,
    "startsAt": null,
    "endsAt": null,
    "active": true,
    "sort": 3
  }
] as PromotionRecord[];
