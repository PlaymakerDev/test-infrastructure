// API RESPONSE
export const ERROR_MESSAGE_SOMETHING_WENT_WRONG = "Something went wrong"
export const ERROR_MESSAGE_INTERNAL_SERVER_ERROR = "Internal Server Error"
export const API_GET_DATA_SUCCESS = "GET Data success"
export const API_POST_DATA_SUCCESS = "POST Data success"
export const API_PUT_DATA_SUCCESS = "PUT Data success"
export const API_PATCH_DATA_SUCCESS = "PATCH Data success"
export const API_DELETE_DATA_SUCCESS = "DELETE Data success"

// export const MAP_ROLE = {
//   "1": "ADMIN",
//   "2": "USER"
// }

export const STATION_TYPE = {
  "spot": "หน่วยตรวจสอบน้ำหนักเคลื่อนที่",
  "wim": "VIS",
  "station": "สถานีตรวจสอบน้ำหนัก",
}

export const EXTERNAL_USER_TYPE = {
  "EXECUTIVE": "ผู้บริหาร",
  "CITIZEN": "ประชาชนทั่วไป",
}

export const ROLE_TH = {
  "ADMIN": "ผู้ดูแลระบบ",
  "USER": "ผู้ใช้งาน"
}

export const ROLE_TH_UNCAP = {
  "Admin": "ผู้ดูแลระบบ",
  "User": "ผู้ใช้งาน"
}

export const WEIGHT_STATUS = {
  "Y": "น้ำหนักเกิน",
  "N": "ปกติ",
  "P": "รถน้ำหนักเกิน (เพลาเกิน)"
}

export const WEIGHT_STATUS_WITH_PROPERTIES = {
  "N": {
    text: "ปกติ",
    color: "#56E4EE"
  },
  "Y": {
    text: "น้ำหนักเกิน",
    color: "#FF4A4A"
  },
  "P": {
    text: "รถน้ำหนักเกิน (เพลาเกิน)",
    color: "#FF4A4A"
  }
}

export const VEHICLE_PROPERTIES = {
  "1": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/01.svg",
      "width": 153,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/01.svg",
      "width": 80.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/01.svg",
      "width": 80.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 1",
      "vehicle_description": "พ่วง 2 เพลา 4 เส้น",
      "vehicle_description_top": "พ่วง 2 เพลา 4 เส้น",
      "vehicle_description_buttom": ""

    },
    "axle": {
      "gap": 25,
      "axleLayout": [40, 10]
    }
  },
  "2": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/02.svg",
      "width": 153,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/02.svg",
      "width": 80.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/02.svg",
      "width": 80.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 2",
      "vehicle_description": "พ่วง 2 เพลา 6 เส้น",
      "vehicle_description_top": "พ่วง 2 เพลา 6 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 25,
      "axleLayout": [40, 10]
    }
  },
  "3": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/03.svg",
      "width": 153,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/03.svg",
      "width": 142.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/03.svg",
      "width": 142.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 3",
      "vehicle_description": "พ่วง 3 เพลา 6 เส้น",
      "vehicle_description_top": "พ่วง 3 เพลา 6 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 22,
      "axleLayout": [31, 19, 10]
    }
  },
  "4": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/04.svg",
      "width": 153,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/04.svg",
      "width": 142.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/04.svg",
      "width": 142.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 4",
      "vehicle_description": "พ่วง 3 เพลา 8 เส้น",
      "vehicle_description_top": "พ่วง 3 เพลา 8 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 22,
      "axleLayout": [31, 19, 10]
    }
  },
  "5": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/05.svg",
      "width": 153,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/05.svg",
      "width": 142.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/05.svg",
      "width": 142.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 5",
      "vehicle_description": "พ่วง 3 เพลา 10 เส้น",
      "vehicle_description_top": "พ่วง 3 เพลา 10 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 22,
      "axleLayout": [31, 19, 10]
    }
  },
  "6": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/06.svg",
      "width": 204,
      "height": 67.83
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/06.svg",
      "width": 157.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/06.svg",
      "width": 157.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 6",
      "vehicle_description": "กึ่งพ่วง 3 เพลา 8 เส้น",
      "vehicle_description_top": "กึ่งพ่วง 3 เพลา 8 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 20,
      "axleLayout": [24, 30, 10]
    }
  },
  "7": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/07.svg",
      "width": 204,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/07.svg",
      "width": 190.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/07.svg",
      "width": 190.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 7",
      "vehicle_description": "พ่วง 4 เพลา 8 เส้น",
      "vehicle_description_top": "พ่วง 4 เพลา 8 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 13,
      "axleLayout": [19, 31, 18, 10]
    }
  },
  "8": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/08.svg",
      "width": 204,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/08.svg",
      "width": 190.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/08.svg",
      "width": 190.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 8",
      "vehicle_description": "พ่วง 4 เพลา 12 เส้น",
      "vehicle_description_top": "พ่วง 4 เพลา 12 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 13,
      "axleLayout": [20, 30, 19, 10]
    }
  },
  "9": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/09.svg",
      "width": 253,
      "height": 67.83
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/09.svg",
      "width": 190.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/09.svg",
      "width": 190.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 9",
      "vehicle_description": "กึ่งพ่วง 4 เพลา 14 เส้น",
      "vehicle_description_top": "กึ่งพ่วง 4 เพลา 14 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 13,
      "axleLayout": [19, 31, 19, 10]
    }
  },
  "10": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/10.svg",
      "width": 253,
      "height": 68.14
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/10.svg",
      "width": 206.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/10.svg",
      "width": 206.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 10",
      "vehicle_description": "กึ่งพ่วง 5 เพลา 18 เส้น",
      "vehicle_description_top": "กึ่งพ่วง 5 เพลา 18 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 10,
      "axleLayout": [19, 13, 31, 13, 10]
    }
  },
  "111": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/11_1.svg",
      "width": 253,
      "height": 68.14
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/11_1.svg",
      "width": 206.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/11_1.svg",
      "width": 206.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 11/1",
      "vehicle_description": "กึ่งพ่วง 6 เพลา 22 เส้น (KingPin 4.50)",
      "vehicle_description_top": "กึ่งพ่วง 6 เพลา 22 เส้น",
      "vehicle_description_buttom": "(KingPin 4.50)"
    },
    "axle": {
      "gap": 9,
      "axleLayout": [16, 11, 27, 11, 11, 10]
    }
  },
  "112": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/11_2.svg",
      "width": 253,
      "height": 68.14
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/11_2.svg",
      "width": 206.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/11_2.svg",
      "width": 206.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 11/2",
      "vehicle_description": "กึ่งพ่วง 6 เพลา 22 เส้น (KingPin 6)",
      "vehicle_description_top": "กึ่งพ่วง 6 เพลา 22 เส้น",
      "vehicle_description_buttom": "(KingPin 6)"
    },
    "axle": {
      "gap": 9,
      "axleLayout": [16, 11, 27, 11, 11, 10]
    }
  },
  "113": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/11_3.svg",
      "width": 253,
      "height": 68.14
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/11_3.svg",
      "width": 206.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/11_3.svg",
      "width": 206.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 11/3",
      "vehicle_description": "กึ่งพ่วง 6 เพลา 22 เส้น (KingPin 7)",
      "vehicle_description_top": "กึ่งพ่วง 6 เพลา 22 เส้น",
      "vehicle_description_buttom": "(KingPin 7)"
    },
    "axle": {
      "gap": 9,
      "axleLayout": [16, 11, 27, 11, 11, 10]
    }
  },
  "11": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/11_4.svg",
      "width": 253,
      "height": 68.14
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/11_4.svg",
      "width": 206.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/11_4.svg",
      "width": 206.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 11/4",
      "vehicle_description": "กึ่งพ่วง 6 เพลา 22 เส้น (KingPin 8)",
      "vehicle_description_top": "กึ่งพ่วง 6 เพลา 22 เส้น",
      "vehicle_description_buttom": "(KingPin 8)"
    },
    "axle": {
      "gap": 9,
      "axleLayout": [16, 11, 27, 11, 11, 10]
    }
  },
  "12": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/12.svg",
      "width": 307,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/12.svg",
      "width": 236.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/12.svg",
      "width": 236.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 12",
      "vehicle_description": "พ่วง 5 เพลา 18 เส้น",
      "vehicle_description_top": "พ่วง 5 เพลา 18 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 5,
      "axleLayout": [36, 13, 19, 18, 10]
    }
  },
  "13": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/13.svg",
      "width": 303,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/13.svg",
      "width": 227.34,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/13.svg",
      "width": 227.34,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 13",
      "vehicle_description": "พ่วง 6 เพลา 22 เส้น",
      "vehicle_description_top": "พ่วง 6 เพลา 22 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 5,
      "axleLayout": [23, 12, 17, 22, 11, 10]
    }
  },
  "14": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/14.svg",
      "width": 303,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/14.svg",
      "width": 256,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/14.svg",
      "width": 256,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 14",
      "vehicle_description": "พ่วง 7 เพลา 24 เส้น",
      "vehicle_description_top": "พ่วง 7 เพลา 24 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 4,
      "axleLayout": [10, 20, 11, 15, 20, 11, 10]
    }
  },
  "15": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/15.svg",
      "width": 153,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/15.svg",
      "width": 235,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/15.svg",
      "width": 235,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 15",
      "vehicle_description": "กึ่งพ่วง 7 เพลา 24 เส้น",
      "vehicle_description_top": "กึ่งพ่วง 7 เพลา 24 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 4,
      "axleLayout": [12, 22, 12, 17, 12, 11, 10]
    }
  },
  "16": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/16.svg",
      "width": 327,
      "height": 60
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/16.svg",
      "width": 232.99,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/16.svg",
      "width": 232.99,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 16",
      "vehicle_description": "พ่วง 6 เพลา 20 เส้น",
      "vehicle_description_top": "พ่วง 6 เพลา 20 เส้น",
      "vehicle_description_buttom": ""
    },
    "axle": {
      "gap": 4,
      "axleLayout": [12, 24, 12, 18, 20, 10]
    }
  },
  "17": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/17.svg",
      "width": 173,
      "height": 59
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/17.svg",
      "width": 127.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/17.svg",
      "width": 127.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 17",
      "vehicle_description": "พ่วง 3 เพลา 8 เส้น (21 ตัน)",
      "vehicle_description_top": "พ่วง 3 เพลา 8 เส้น",
      "vehicle_description_buttom": "(21 ตัน)"
    },
    "axle": {
      "gap": 25,
      "axleLayout": [13, 32, 10]
    }
  },
  "18": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/18.svg",
      "width": 327,
      "height": 60
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/18.svg",
      "width": 219.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/18.svg",
      "width": 219.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 18",
      "vehicle_description": "พ่วง 4 เพลา 14 เส้น (37 ตัน)",
      "vehicle_description_top": "พ่วง 4 เพลา 14 เส้น",
      "vehicle_description_buttom": "(37 ตัน)"
    },
    "axle": {
      "gap": 7,
      "axleLayout": [24, 31, 26, 10]
    }
  },
  "19": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/19.svg",
      "width": 327,
      "height": 60
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/19.svg",
      "width": 219.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/19.svg",
      "width": 219.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 19",
      "vehicle_description": "พ่วง 4 เพลา 10 เส้น (29 ตัน)",
      "vehicle_description_top": "พ่วง 4 เพลา 10 เส้น",
      "vehicle_description_buttom": "(29 ตัน)"
    },
    "axle": {
      "gap": 7,
      "axleLayout": [24, 31, 26, 10]
    }
  },
  "20": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/20.svg",
      "width": 275,
      "height": 60
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/20.svg",
      "width": 223.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/20.svg",
      "width": 223.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 20",
      "vehicle_description": "กึ่งพ่วง 6 เพลา 20 เส้น (50 ตัน)",
      "vehicle_description_top": "กึ่งพ่วง 6 เพลา 20 เส้น",
      "vehicle_description_buttom": "(50 ตัน)"
    },
    "axle": {
      "gap": 6,
      "axleLayout": [13, 18, 13, 25, 13, 10]
    }
  },
  "21": {
    "vehicle": {
      "image": "/images/truck-img/truck-type/21.svg",
      "width": 275,
      "height": 60
    },
    "wheel_vertical": {
      "image": "/images/truck-img/wheel-vertical/21.svg",
      "width": 191.84,
      "height": 62.5
    },
    "wheel": {
      "image": "/images/truck-img/wheel-type/21.svg",
      "width": 191.84,
      "height": 62.5
    },
    "properties": {
      "vehicle_type": "ประเภท 21",
      "vehicle_description": "กึ่งพ่วง 5 เพลา 18 เส้น (40.5 ตัน)",
      "vehicle_description_top": "กึ่งพ่วง 5 เพลา 18 เส้น",
      "vehicle_description_buttom": "(40.5 ตัน)"
    },
    "axle": {
      "gap": 13,
      "axleLayout": [19, 24, 13, 12, 10]
    }
  },
  "99": {
    "vehicle": {
      "image": "",
      "width": 0,
      "height": 0
    },
    "wheel_vertical": {
      "image": "",
      "width": 0,
      "height": 0
    },
    "wheel": {
      "image": "",
      "width": 0,
      "height": 0
    },
    "properties": {
      "vehicle_type": "ประเภท อื่นๆ",
      "vehicle_description": "ไม่ระบุ",
      "vehicle_description_top": "ไม่ระบุ",
      "vehicle_description_buttom": ""
    },
  }
}

export const OPTION_MONTH = [
  { label: "มกราคม", value: "1" },
  { label: "กุมภาพันธ์", value: "2" },
  { label: "มีนาคม", value: "3" },
  { label: "เมษายน", value: "4" },
  { label: "พฤษภาคม", value: "5" },
  { label: "มิถุนายน", value: "6" },
  { label: "กรกฎาคม", value: "7" },
  { label: "สิงหาคม", value: "8" },
  { label: "กันยายน", value: "9" },
  { label: "ตุลาคม", value: "10" },
  { label: "พฤศจิกายน", value: "11" },
  { label: "ธันวาคม", value: "12" },
]

export const REMARK = {
  "ON": "ออนไลน์",
  "OFF": "ออฟไลน์",
}

export const CAMERA_TYPE = {
  "fixed": "FIXED",
  "PTZ": "PTZ"
}

export const STATION_CODE = {
  "1": "สถานีตรวจสอบน้ำหนัก",
  "2": "หน่วยตรวจสอบน้ำหนักเคลื่อนที่",
  "3": "VIS",
}

export const RECENT_WEIGHT_STATUS = {
  "0": {
    "description": "ปกติ",
    "color": "#22c55e",
    "fontColor": "#FFFFFF",
  },
  "1": {
    "description": "น้ำหนักเกิน",
    "color": "#eab308",
    "fontColor": "#000000",
  },
  "2": {
    "description": "นำหนักเกิน 10 %",
    "color": "#ef4444",
    "fontColor": "#FFFFFF",
  },
}