export interface District {
  name: string;
  schools: string[];
}

export interface Province {
  id: string;
  name: string;
  districts: District[];
}

export const VIETNAM_DATA: Province[] = [
  {
    "id": "thanh_pho_ha_noi",
    "name": "Thành phố Hà Nội",
    "districts": [
      {
        "name": "Quận Ba Đình",
        "schools": [
          "THPT Chu Văn An",
          "THPT Phan Đình Phùng",
          "THPT Nguyễn Trãi",
          "THPT Ba Đình",
          "THPT Chuyên Ba Đình",
          "THCS Ba Đình"
        ]
      },
      {
        "name": "Quận Hoàn Kiếm",
        "schools": [
          "THPT Việt Đức",
          "THPT Trần Phú - Hoàn Kiếm",
          "THPT Hoàn Kiếm",
          "THPT Chuyên Hoàn Kiếm",
          "THCS Hoàn Kiếm"
        ]
      },
      {
        "name": "Quận Tây Hồ",
        "schools": [
          "THPT Chu Văn An",
          "THPT Tây Hồ",
          "THPT Chuyên Tây Hồ",
          "THCS Tây Hồ"
        ]
      },
      {
        "name": "Quận Long Biên",
        "schools": [
          "THPT Long Biên",
          "THPT Chuyên Long Biên",
          "THCS Long Biên"
        ]
      },
      {
        "name": "Quận Cầu Giấy",
        "schools": [
          "Đại học Quốc gia Hà Nội (VNU)",
          "Đại học Sư phạm Hà Nội",
          "Đại học Thương mại",
          "Học viện Báo chí và Tuyên truyền",
          "THPT Chuyên Hà Nội - Amsterdam",
          "THPT Nguyễn Tất Thành",
          "THPT Yên Hòa",
          "THPT Cầu Giấy",
          "THPT Chuyên Cầu Giấy",
          "THCS Cầu Giấy"
        ]
      },
      {
        "name": "Quận Đống Đa",
        "schools": [
          "Đại học Ngoại thương (FTU)",
          "Đại học Luật Hà Nội",
          "Đại học Y Hà Nội",
          "Đại học Giao thông Vận tải (UTC)",
          "Học viện Ngoại giao (DAV)",
          "Học viện Ngân hàng",
          "THPT Kim Liên",
          "THPT Lê Quý Đôn - Đống Đa",
          "THPT Đống Đa",
          "THPT Chuyên Đống Đa",
          "THCS Đống Đa"
        ]
      },
      {
        "name": "Quận Hai Bà Trưng",
        "schools": [
          "Đại học Bách khoa Hà Nội (HUST)",
          "Đại học Kinh tế Quốc dân (NEU)",
          "Đại học Xây dựng Hà Nội (HUCE)",
          "THPT Thăng Long",
          "THPT Trần Nhân Tông",
          "THPT Hai Bà Trưng",
          "THPT Chuyên Hai Bà Trưng",
          "THCS Hai Bà Trưng"
        ]
      },
      {
        "name": "Quận Hoàng Mai",
        "schools": [
          "THPT Hoàng Mai",
          "THPT Chuyên Hoàng Mai",
          "THCS Hoàng Mai"
        ]
      },
      {
        "name": "Quận Thanh Xuân",
        "schools": [
          "Đại học Khoa học Xã hội và Nhân văn - VNU",
          "Đại học Khoa học Tự nhiên - VNU",
          "Đại học Hà Nội (HANU)",
          "THPT Chuyên Khoa học Tự nhiên",
          "THPT Nhân Chính",
          "THPT Thanh Xuân",
          "THPT Chuyên Thanh Xuân",
          "THCS Thanh Xuân"
        ]
      },
      {
        "name": "Huyện Sóc Sơn",
        "schools": [
          "THPT Sóc Sơn",
          "THPT Chuyên Sóc Sơn",
          "THCS Sóc Sơn"
        ]
      },
      {
        "name": "Huyện Đông Anh",
        "schools": [
          "THPT Đông Anh",
          "THPT Chuyên Đông Anh",
          "THCS Đông Anh"
        ]
      },
      {
        "name": "Huyện Gia Lâm",
        "schools": [
          "THPT Gia Lâm",
          "THPT Chuyên Gia Lâm",
          "THCS Gia Lâm"
        ]
      },
      {
        "name": "Quận Nam Từ Liêm",
        "schools": [
          "THPT Nam Từ Liêm",
          "THPT Chuyên Nam Từ Liêm",
          "THCS Nam Từ Liêm"
        ]
      },
      {
        "name": "Huyện Thanh Trì",
        "schools": [
          "THPT Thanh Trì",
          "THPT Chuyên Thanh Trì",
          "THCS Thanh Trì"
        ]
      },
      {
        "name": "Quận Bắc Từ Liêm",
        "schools": [
          "THPT Bắc Từ Liêm",
          "THPT Chuyên Bắc Từ Liêm",
          "THCS Bắc Từ Liêm"
        ]
      },
      {
        "name": "Huyện Mê Linh",
        "schools": [
          "THPT Mê Linh",
          "THPT Chuyên Mê Linh",
          "THCS Mê Linh"
        ]
      },
      {
        "name": "Quận Hà Đông",
        "schools": [
          "Học viện Công nghệ Bưu chính Viễn thông (PTIT)",
          "Đại học Kiến trúc Hà Nội",
          "Học viện An ninh Nhân dân",
          "THPT Chuyên Nguyễn Huệ",
          "THPT Lê Quý Đôn - Hà Đông",
          "THPT Hà Đông",
          "THPT Chuyên Hà Đông",
          "THCS Hà Đông"
        ]
      },
      {
        "name": "Thị xã Sơn Tây",
        "schools": [
          "THPT Sơn Tây",
          "THPT Chuyên Sơn Tây",
          "THCS Sơn Tây"
        ]
      },
      {
        "name": "Huyện Ba Vì",
        "schools": [
          "THPT Ba Vì",
          "THPT Chuyên Ba Vì",
          "THCS Ba Vì"
        ]
      },
      {
        "name": "Huyện Phúc Thọ",
        "schools": [
          "THPT Phúc Thọ",
          "THPT Chuyên Phúc Thọ",
          "THCS Phúc Thọ"
        ]
      },
      {
        "name": "Huyện Đan Phượng",
        "schools": [
          "THPT Đan Phượng",
          "THPT Chuyên Đan Phượng",
          "THCS Đan Phượng"
        ]
      },
      {
        "name": "Huyện Hoài Đức",
        "schools": [
          "THPT Hoài Đức",
          "THPT Chuyên Hoài Đức",
          "THCS Hoài Đức"
        ]
      },
      {
        "name": "Huyện Quốc Oai",
        "schools": [
          "THPT Quốc Oai",
          "THPT Chuyên Quốc Oai",
          "THCS Quốc Oai"
        ]
      },
      {
        "name": "Huyện Thạch Thất",
        "schools": [
          "THPT Thạch Thất",
          "THPT Chuyên Thạch Thất",
          "THCS Thạch Thất"
        ]
      },
      {
        "name": "Huyện Chương Mỹ",
        "schools": [
          "THPT Chương Mỹ",
          "THPT Chuyên Chương Mỹ",
          "THCS Chương Mỹ"
        ]
      },
      {
        "name": "Huyện Thanh Oai",
        "schools": [
          "THPT Thanh Oai",
          "THPT Chuyên Thanh Oai",
          "THCS Thanh Oai"
        ]
      },
      {
        "name": "Huyện Thường Tín",
        "schools": [
          "THPT Thường Tín",
          "THPT Chuyên Thường Tín",
          "THCS Thường Tín"
        ]
      },
      {
        "name": "Huyện Phú Xuyên",
        "schools": [
          "THPT Phú Xuyên",
          "THPT Chuyên Phú Xuyên",
          "THCS Phú Xuyên"
        ]
      },
      {
        "name": "Huyện Ứng Hòa",
        "schools": [
          "THPT Ứng Hòa",
          "THPT Chuyên Ứng Hòa",
          "THCS Ứng Hòa"
        ]
      },
      {
        "name": "Huyện Mỹ Đức",
        "schools": [
          "THPT Mỹ Đức",
          "THPT Chuyên Mỹ Đức",
          "THCS Mỹ Đức"
        ]
      }
    ]
  },
  {
    "id": "thanh_pho_ho_chi_minh",
    "name": "Thành phố Hồ Chí Minh",
    "districts": [
      {
        "name": "Quận 1",
        "schools": [
          "Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM",
          "Đại học Sài Gòn (Cơ sở Quận 1)",
          "THPT Chuyên Trần Đại Nghĩa",
          "THPT Bùi Thị Xuân",
          "THPT Lương Thế Vinh",
          "THPT 1",
          "THPT Chuyên 1",
          "THCS 1"
        ]
      },
      {
        "name": "Quận 12",
        "schools": [
          "THPT 12",
          "THPT Chuyên 12",
          "THCS 12"
        ]
      },
      {
        "name": "Quận Gò Vấp",
        "schools": [
          "THPT Gò Vấp",
          "THPT Chuyên Gò Vấp",
          "THCS Gò Vấp"
        ]
      },
      {
        "name": "Quận Bình Thạnh",
        "schools": [
          "Đại học HUTECH",
          "Đại học Ngoại thương (Cơ sở 2)",
          "Đại học Giao thông Vận tải TP.HCM",
          "THPT Gia Định",
          "THPT Võ Thị Sáu",
          "THPT Bình Thạnh",
          "THPT Chuyên Bình Thạnh",
          "THCS Bình Thạnh"
        ]
      },
      {
        "name": "Quận Tân Bình",
        "schools": [
          "THPT Tân Bình",
          "THPT Chuyên Tân Bình",
          "THCS Tân Bình"
        ]
      },
      {
        "name": "Quận Tân Phú",
        "schools": [
          "THPT Tân Phú",
          "THPT Chuyên Tân Phú",
          "THCS Tân Phú"
        ]
      },
      {
        "name": "Quận Phú Nhuận",
        "schools": [
          "THPT Phú Nhuận",
          "THPT Chuyên Phú Nhuận",
          "THCS Phú Nhuận"
        ]
      },
      {
        "name": "Thành phố Thủ Đức",
        "schools": [
          "Đại học Bách khoa - ĐHQG TP.HCM",
          "Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
          "Đại học Công nghệ Thông tin - ĐHQG TP.HCM",
          "Đại học Quốc tế - ĐHQG TP.HCM",
          "Đại học Kinh tế - Luật - ĐHQG TP.HCM",
          "Đại học Sư phạm Kỹ thuật TP.HCM",
          "THPT Phổ thông Năng khiếu (CS2)",
          "THPT Nguyễn Hữu Huân",
          "THPT Thủ Đức",
          "THPT Chuyên Thủ Đức",
          "THCS Thủ Đức"
        ]
      },
      {
        "name": "Quận 3",
        "schools": [
          "THPT 3",
          "THPT Chuyên 3",
          "THCS 3"
        ]
      },
      {
        "name": "Quận 10",
        "schools": [
          "Đại học Bách khoa (Cơ sở 1)",
          "Đại học Y khoa Phạm Ngọc Thạch",
          "Đại học Ngoại ngữ - Tin học TP.HCM (HUFLIT)",
          "THPT Nguyễn Du",
          "THPT 10",
          "THPT Chuyên 10",
          "THCS 10"
        ]
      },
      {
        "name": "Quận 11",
        "schools": [
          "THPT 11",
          "THPT Chuyên 11",
          "THCS 11"
        ]
      },
      {
        "name": "Quận 4",
        "schools": [
          "THPT 4",
          "THPT Chuyên 4",
          "THCS 4"
        ]
      },
      {
        "name": "Quận 5",
        "schools": [
          "Đại học Sư phạm TP.HCM",
          "Đại học Y Dược TP.HCM",
          "Đại học Sài Gòn",
          "Đại học Khoa học Tự nhiên (Cơ sở 1)",
          "THPT Chuyên Lê Hồng Phong",
          "THPT Năng khiếu TDTT Quận 5",
          "THPT 5",
          "THPT Chuyên 5",
          "THCS 5"
        ]
      },
      {
        "name": "Quận 6",
        "schools": [
          "THPT 6",
          "THPT Chuyên 6",
          "THCS 6"
        ]
      },
      {
        "name": "Quận 8",
        "schools": [
          "THPT 8",
          "THPT Chuyên 8",
          "THCS 8"
        ]
      },
      {
        "name": "Quận Bình Tân",
        "schools": [
          "THPT Bình Tân",
          "THPT Chuyên Bình Tân",
          "THCS Bình Tân"
        ]
      },
      {
        "name": "Quận 7",
        "schools": [
          "THPT 7",
          "THPT Chuyên 7",
          "THCS 7"
        ]
      },
      {
        "name": "Huyện Củ Chi",
        "schools": [
          "THPT Củ Chi",
          "THPT Chuyên Củ Chi",
          "THCS Củ Chi"
        ]
      },
      {
        "name": "Huyện Hóc Môn",
        "schools": [
          "THPT Hóc Môn",
          "THPT Chuyên Hóc Môn",
          "THCS Hóc Môn"
        ]
      },
      {
        "name": "Huyện Bình Chánh",
        "schools": [
          "THPT Bình Chánh",
          "THPT Chuyên Bình Chánh",
          "THCS Bình Chánh"
        ]
      },
      {
        "name": "Huyện Nhà Bè",
        "schools": [
          "THPT Nhà Bè",
          "THPT Chuyên Nhà Bè",
          "THCS Nhà Bè"
        ]
      },
      {
        "name": "Huyện Cần Giờ",
        "schools": [
          "THPT Cần Giờ",
          "THPT Chuyên Cần Giờ",
          "THCS Cần Giờ"
        ]
      }
    ]
  },
  {
    "id": "thanh_pho_can_tho",
    "name": "Thành phố Cần Thơ",
    "districts": [
      {
        "name": "Quận Ninh Kiều",
        "schools": [
          "THPT Ninh Kiều",
          "THPT Chuyên Ninh Kiều",
          "THCS Ninh Kiều"
        ]
      },
      {
        "name": "Quận Ô Môn",
        "schools": [
          "THPT Ô Môn",
          "THPT Chuyên Ô Môn",
          "THCS Ô Môn"
        ]
      },
      {
        "name": "Quận Bình Thuỷ",
        "schools": [
          "THPT Bình Thuỷ",
          "THPT Chuyên Bình Thuỷ",
          "THCS Bình Thuỷ"
        ]
      },
      {
        "name": "Quận Cái Răng",
        "schools": [
          "THPT Cái Răng",
          "THPT Chuyên Cái Răng",
          "THCS Cái Răng"
        ]
      },
      {
        "name": "Quận Thốt Nốt",
        "schools": [
          "THPT Thốt Nốt",
          "THPT Chuyên Thốt Nốt",
          "THCS Thốt Nốt"
        ]
      },
      {
        "name": "Huyện Vĩnh Thạnh",
        "schools": [
          "THPT Vĩnh Thạnh",
          "THPT Chuyên Vĩnh Thạnh",
          "THCS Vĩnh Thạnh"
        ]
      },
      {
        "name": "Huyện Cờ Đỏ",
        "schools": [
          "THPT Cờ Đỏ",
          "THPT Chuyên Cờ Đỏ",
          "THCS Cờ Đỏ"
        ]
      },
      {
        "name": "Huyện Phong Điền",
        "schools": [
          "THPT Phong Điền",
          "THPT Chuyên Phong Điền",
          "THCS Phong Điền"
        ]
      },
      {
        "name": "Huyện Thới Lai",
        "schools": [
          "THPT Thới Lai",
          "THPT Chuyên Thới Lai",
          "THCS Thới Lai"
        ]
      }
    ]
  },
  {
    "id": "thanh_pho_da_nang",
    "name": "Thành phố Đà Nẵng",
    "districts": [
      {
        "name": "Quận Liên Chiểu",
        "schools": [
          "THPT Liên Chiểu",
          "THPT Chuyên Liên Chiểu",
          "THCS Liên Chiểu"
        ]
      },
      {
        "name": "Quận Thanh Khê",
        "schools": [
          "THPT Thanh Khê",
          "THPT Chuyên Thanh Khê",
          "THCS Thanh Khê"
        ]
      },
      {
        "name": "Quận Hải Châu",
        "schools": [
          "THPT Hải Châu",
          "THPT Chuyên Hải Châu",
          "THCS Hải Châu"
        ]
      },
      {
        "name": "Quận Sơn Trà",
        "schools": [
          "THPT Sơn Trà",
          "THPT Chuyên Sơn Trà",
          "THCS Sơn Trà"
        ]
      },
      {
        "name": "Quận Ngũ Hành Sơn",
        "schools": [
          "THPT Ngũ Hành Sơn",
          "THPT Chuyên Ngũ Hành Sơn",
          "THCS Ngũ Hành Sơn"
        ]
      },
      {
        "name": "Quận Cẩm Lệ",
        "schools": [
          "THPT Cẩm Lệ",
          "THPT Chuyên Cẩm Lệ",
          "THCS Cẩm Lệ"
        ]
      },
      {
        "name": "Huyện Hòa Vang",
        "schools": [
          "THPT Hòa Vang",
          "THPT Chuyên Hòa Vang",
          "THCS Hòa Vang"
        ]
      },
      {
        "name": "Huyện Hoàng Sa",
        "schools": [
          "THPT Hoàng Sa",
          "THPT Chuyên Hoàng Sa",
          "THCS Hoàng Sa"
        ]
      }
    ]
  },
  {
    "id": "thanh_pho_hai_phong",
    "name": "Thành phố Hải Phòng",
    "districts": [
      {
        "name": "Quận Hồng Bàng",
        "schools": [
          "THPT Hồng Bàng",
          "THPT Chuyên Hồng Bàng",
          "THCS Hồng Bàng"
        ]
      },
      {
        "name": "Quận Ngô Quyền",
        "schools": [
          "THPT Ngô Quyền",
          "THPT Chuyên Ngô Quyền",
          "THCS Ngô Quyền"
        ]
      },
      {
        "name": "Quận Lê Chân",
        "schools": [
          "THPT Lê Chân",
          "THPT Chuyên Lê Chân",
          "THCS Lê Chân"
        ]
      },
      {
        "name": "Quận Hải An",
        "schools": [
          "THPT Hải An",
          "THPT Chuyên Hải An",
          "THCS Hải An"
        ]
      },
      {
        "name": "Quận Kiến An",
        "schools": [
          "THPT Kiến An",
          "THPT Chuyên Kiến An",
          "THCS Kiến An"
        ]
      },
      {
        "name": "Quận Đồ Sơn",
        "schools": [
          "THPT Đồ Sơn",
          "THPT Chuyên Đồ Sơn",
          "THCS Đồ Sơn"
        ]
      },
      {
        "name": "Quận Dương Kinh",
        "schools": [
          "THPT Dương Kinh",
          "THPT Chuyên Dương Kinh",
          "THCS Dương Kinh"
        ]
      },
      {
        "name": "Thành phố Thuỷ Nguyên",
        "schools": [
          "THPT Thuỷ Nguyên",
          "THPT Chuyên Thuỷ Nguyên",
          "THCS Thuỷ Nguyên"
        ]
      },
      {
        "name": "Quận An Dương",
        "schools": [
          "THPT An Dương",
          "THPT Chuyên An Dương",
          "THCS An Dương"
        ]
      },
      {
        "name": "Huyện An Lão",
        "schools": [
          "THPT An Lão",
          "THPT Chuyên An Lão",
          "THCS An Lão"
        ]
      },
      {
        "name": "Huyện Kiến Thuỵ",
        "schools": [
          "THPT Kiến Thuỵ",
          "THPT Chuyên Kiến Thuỵ",
          "THCS Kiến Thuỵ"
        ]
      },
      {
        "name": "Huyện Tiên Lãng",
        "schools": [
          "THPT Tiên Lãng",
          "THPT Chuyên Tiên Lãng",
          "THCS Tiên Lãng"
        ]
      },
      {
        "name": "Huyện Vĩnh Bảo",
        "schools": [
          "THPT Vĩnh Bảo",
          "THPT Chuyên Vĩnh Bảo",
          "THCS Vĩnh Bảo"
        ]
      },
      {
        "name": "Huyện Cát Hải",
        "schools": [
          "THPT Cát Hải",
          "THPT Chuyên Cát Hải",
          "THCS Cát Hải"
        ]
      },
      {
        "name": "Huyện Bạch Long Vĩ",
        "schools": [
          "THPT Bạch Long Vĩ",
          "THPT Chuyên Bạch Long Vĩ",
          "THCS Bạch Long Vĩ"
        ]
      }
    ]
  },
  {
    "id": "thanh_pho_hue",
    "name": "Thành phố Huế",
    "districts": [
      {
        "name": "Quận Thuận Hóa",
        "schools": [
          "THPT Thuận Hóa",
          "THPT Chuyên Thuận Hóa",
          "THCS Thuận Hóa"
        ]
      },
      {
        "name": "Quận Phú Xuân",
        "schools": [
          "THPT Phú Xuân",
          "THPT Chuyên Phú Xuân",
          "THCS Phú Xuân"
        ]
      },
      {
        "name": "Thị xã Phong Điền",
        "schools": [
          "THPT Phong Điền",
          "THPT Chuyên Phong Điền",
          "THCS Phong Điền"
        ]
      },
      {
        "name": "Huyện Quảng Điền",
        "schools": [
          "THPT Quảng Điền",
          "THPT Chuyên Quảng Điền",
          "THCS Quảng Điền"
        ]
      },
      {
        "name": "Huyện Phú Vang",
        "schools": [
          "THPT Phú Vang",
          "THPT Chuyên Phú Vang",
          "THCS Phú Vang"
        ]
      },
      {
        "name": "Thị xã Hương Thủy",
        "schools": [
          "THPT Hương Thủy",
          "THPT Chuyên Hương Thủy",
          "THCS Hương Thủy"
        ]
      },
      {
        "name": "Thị xã Hương Trà",
        "schools": [
          "THPT Hương Trà",
          "THPT Chuyên Hương Trà",
          "THCS Hương Trà"
        ]
      },
      {
        "name": "Huyện A Lưới",
        "schools": [
          "THPT A Lưới",
          "THPT Chuyên A Lưới",
          "THCS A Lưới"
        ]
      },
      {
        "name": "Huyện Phú Lộc",
        "schools": [
          "THPT Phú Lộc",
          "THPT Chuyên Phú Lộc",
          "THCS Phú Lộc"
        ]
      }
    ]
  },
  {
    "id": "tinh_an_giang",
    "name": "Tỉnh An Giang",
    "districts": [
      {
        "name": "Thành phố Long Xuyên",
        "schools": [
          "THPT Long Xuyên",
          "THPT Chuyên Long Xuyên",
          "THCS Long Xuyên"
        ]
      },
      {
        "name": "Thành phố Châu Đốc",
        "schools": [
          "THPT Châu Đốc",
          "THPT Chuyên Châu Đốc",
          "THCS Châu Đốc"
        ]
      },
      {
        "name": "Huyện An Phú",
        "schools": [
          "THPT An Phú",
          "THPT Chuyên An Phú",
          "THCS An Phú"
        ]
      },
      {
        "name": "Thị xã Tân Châu",
        "schools": [
          "THPT Tân Châu",
          "THPT Chuyên Tân Châu",
          "THCS Tân Châu"
        ]
      },
      {
        "name": "Huyện Phú Tân",
        "schools": [
          "THPT Phú Tân",
          "THPT Chuyên Phú Tân",
          "THCS Phú Tân"
        ]
      },
      {
        "name": "Huyện Châu Phú",
        "schools": [
          "THPT Châu Phú",
          "THPT Chuyên Châu Phú",
          "THCS Châu Phú"
        ]
      },
      {
        "name": "Thị xã Tịnh Biên",
        "schools": [
          "THPT Tịnh Biên",
          "THPT Chuyên Tịnh Biên",
          "THCS Tịnh Biên"
        ]
      },
      {
        "name": "Huyện Tri Tôn",
        "schools": [
          "THPT Tri Tôn",
          "THPT Chuyên Tri Tôn",
          "THCS Tri Tôn"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Chợ Mới",
        "schools": [
          "THPT Chợ Mới",
          "THPT Chuyên Chợ Mới",
          "THCS Chợ Mới"
        ]
      },
      {
        "name": "Huyện Thoại Sơn",
        "schools": [
          "THPT Thoại Sơn",
          "THPT Chuyên Thoại Sơn",
          "THCS Thoại Sơn"
        ]
      }
    ]
  },
  {
    "id": "tinh_ba_ria_vung_tau",
    "name": "Tỉnh Bà Rịa - Vũng Tàu",
    "districts": [
      {
        "name": "Thành phố Vũng Tàu",
        "schools": [
          "THPT Vũng Tàu",
          "THPT Chuyên Vũng Tàu",
          "THCS Vũng Tàu"
        ]
      },
      {
        "name": "Thành phố Bà Rịa",
        "schools": [
          "THPT Bà Rịa",
          "THPT Chuyên Bà Rịa",
          "THCS Bà Rịa"
        ]
      },
      {
        "name": "Huyện Châu Đức",
        "schools": [
          "THPT Châu Đức",
          "THPT Chuyên Châu Đức",
          "THCS Châu Đức"
        ]
      },
      {
        "name": "Huyện Xuyên Mộc",
        "schools": [
          "THPT Xuyên Mộc",
          "THPT Chuyên Xuyên Mộc",
          "THCS Xuyên Mộc"
        ]
      },
      {
        "name": "Huyện Long Đất",
        "schools": [
          "THPT Long Đất",
          "THPT Chuyên Long Đất",
          "THCS Long Đất"
        ]
      },
      {
        "name": "Thị xã Phú Mỹ",
        "schools": [
          "THPT Phú Mỹ",
          "THPT Chuyên Phú Mỹ",
          "THCS Phú Mỹ"
        ]
      },
      {
        "name": "Huyện Côn Đảo",
        "schools": [
          "THPT Côn Đảo",
          "THPT Chuyên Côn Đảo",
          "THCS Côn Đảo"
        ]
      }
    ]
  },
  {
    "id": "tinh_bac_lieu",
    "name": "Tỉnh Bạc Liêu",
    "districts": [
      {
        "name": "Thành phố Bạc Liêu",
        "schools": [
          "THPT Bạc Liêu",
          "THPT Chuyên Bạc Liêu",
          "THCS Bạc Liêu"
        ]
      },
      {
        "name": "Huyện Hồng Dân",
        "schools": [
          "THPT Hồng Dân",
          "THPT Chuyên Hồng Dân",
          "THCS Hồng Dân"
        ]
      },
      {
        "name": "Huyện Phước Long",
        "schools": [
          "THPT Phước Long",
          "THPT Chuyên Phước Long",
          "THCS Phước Long"
        ]
      },
      {
        "name": "Huyện Vĩnh Lợi",
        "schools": [
          "THPT Vĩnh Lợi",
          "THPT Chuyên Vĩnh Lợi",
          "THCS Vĩnh Lợi"
        ]
      },
      {
        "name": "Thị xã Giá Rai",
        "schools": [
          "THPT Giá Rai",
          "THPT Chuyên Giá Rai",
          "THCS Giá Rai"
        ]
      },
      {
        "name": "Huyện Đông Hải",
        "schools": [
          "THPT Đông Hải",
          "THPT Chuyên Đông Hải",
          "THCS Đông Hải"
        ]
      },
      {
        "name": "Huyện Hoà Bình",
        "schools": [
          "THPT Hoà Bình",
          "THPT Chuyên Hoà Bình",
          "THCS Hoà Bình"
        ]
      }
    ]
  },
  {
    "id": "tinh_bac_giang",
    "name": "Tỉnh Bắc Giang",
    "districts": [
      {
        "name": "Thành phố Bắc Giang",
        "schools": [
          "THPT Bắc Giang",
          "THPT Chuyên Bắc Giang",
          "THCS Bắc Giang"
        ]
      },
      {
        "name": "Huyện Yên Thế",
        "schools": [
          "THPT Yên Thế",
          "THPT Chuyên Yên Thế",
          "THCS Yên Thế"
        ]
      },
      {
        "name": "Huyện Tân Yên",
        "schools": [
          "THPT Tân Yên",
          "THPT Chuyên Tân Yên",
          "THCS Tân Yên"
        ]
      },
      {
        "name": "Huyện Lạng Giang",
        "schools": [
          "THPT Lạng Giang",
          "THPT Chuyên Lạng Giang",
          "THCS Lạng Giang"
        ]
      },
      {
        "name": "Huyện Lục Nam",
        "schools": [
          "THPT Lục Nam",
          "THPT Chuyên Lục Nam",
          "THCS Lục Nam"
        ]
      },
      {
        "name": "Huyện Lục Ngạn",
        "schools": [
          "THPT Lục Ngạn",
          "THPT Chuyên Lục Ngạn",
          "THCS Lục Ngạn"
        ]
      },
      {
        "name": "Huyện Sơn Động",
        "schools": [
          "THPT Sơn Động",
          "THPT Chuyên Sơn Động",
          "THCS Sơn Động"
        ]
      },
      {
        "name": "Thị xã Việt Yên",
        "schools": [
          "THPT Việt Yên",
          "THPT Chuyên Việt Yên",
          "THCS Việt Yên"
        ]
      },
      {
        "name": "Huyện Hiệp Hòa",
        "schools": [
          "THPT Hiệp Hòa",
          "THPT Chuyên Hiệp Hòa",
          "THCS Hiệp Hòa"
        ]
      },
      {
        "name": "Thị xã Chũ",
        "schools": [
          "THPT Chũ",
          "THPT Chuyên Chũ",
          "THCS Chũ"
        ]
      }
    ]
  },
  {
    "id": "tinh_bac_kan",
    "name": "Tỉnh Bắc Kạn",
    "districts": [
      {
        "name": "Thành Phố Bắc Kạn",
        "schools": [
          "THPT Thành Phố Bắc Kạn",
          "THPT Chuyên Thành Phố Bắc Kạn",
          "THCS Thành Phố Bắc Kạn"
        ]
      },
      {
        "name": "Huyện Pác Nặm",
        "schools": [
          "THPT Pác Nặm",
          "THPT Chuyên Pác Nặm",
          "THCS Pác Nặm"
        ]
      },
      {
        "name": "Huyện Ba Bể",
        "schools": [
          "THPT Ba Bể",
          "THPT Chuyên Ba Bể",
          "THCS Ba Bể"
        ]
      },
      {
        "name": "Huyện Ngân Sơn",
        "schools": [
          "THPT Ngân Sơn",
          "THPT Chuyên Ngân Sơn",
          "THCS Ngân Sơn"
        ]
      },
      {
        "name": "Huyện Bạch Thông",
        "schools": [
          "THPT Bạch Thông",
          "THPT Chuyên Bạch Thông",
          "THCS Bạch Thông"
        ]
      },
      {
        "name": "Huyện Chợ Đồn",
        "schools": [
          "THPT Chợ Đồn",
          "THPT Chuyên Chợ Đồn",
          "THCS Chợ Đồn"
        ]
      },
      {
        "name": "Huyện Chợ Mới",
        "schools": [
          "THPT Chợ Mới",
          "THPT Chuyên Chợ Mới",
          "THCS Chợ Mới"
        ]
      },
      {
        "name": "Huyện Na Rì",
        "schools": [
          "THPT Na Rì",
          "THPT Chuyên Na Rì",
          "THCS Na Rì"
        ]
      }
    ]
  },
  {
    "id": "tinh_bac_ninh",
    "name": "Tỉnh Bắc Ninh",
    "districts": [
      {
        "name": "Thành phố Bắc Ninh",
        "schools": [
          "THPT Bắc Ninh",
          "THPT Chuyên Bắc Ninh",
          "THCS Bắc Ninh"
        ]
      },
      {
        "name": "Huyện Yên Phong",
        "schools": [
          "THPT Yên Phong",
          "THPT Chuyên Yên Phong",
          "THCS Yên Phong"
        ]
      },
      {
        "name": "Thị xã Quế Võ",
        "schools": [
          "THPT Quế Võ",
          "THPT Chuyên Quế Võ",
          "THCS Quế Võ"
        ]
      },
      {
        "name": "Huyện Tiên Du",
        "schools": [
          "THPT Tiên Du",
          "THPT Chuyên Tiên Du",
          "THCS Tiên Du"
        ]
      },
      {
        "name": "Thành phố Từ Sơn",
        "schools": [
          "THPT Từ Sơn",
          "THPT Chuyên Từ Sơn",
          "THCS Từ Sơn"
        ]
      },
      {
        "name": "Thị xã Thuận Thành",
        "schools": [
          "THPT Thuận Thành",
          "THPT Chuyên Thuận Thành",
          "THCS Thuận Thành"
        ]
      },
      {
        "name": "Huyện Gia Bình",
        "schools": [
          "THPT Gia Bình",
          "THPT Chuyên Gia Bình",
          "THCS Gia Bình"
        ]
      },
      {
        "name": "Huyện Lương Tài",
        "schools": [
          "THPT Lương Tài",
          "THPT Chuyên Lương Tài",
          "THCS Lương Tài"
        ]
      }
    ]
  },
  {
    "id": "tinh_ben_tre",
    "name": "Tỉnh Bến Tre",
    "districts": [
      {
        "name": "Thành phố Bến Tre",
        "schools": [
          "THPT Bến Tre",
          "THPT Chuyên Bến Tre",
          "THCS Bến Tre"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Chợ Lách",
        "schools": [
          "THPT Chợ Lách",
          "THPT Chuyên Chợ Lách",
          "THCS Chợ Lách"
        ]
      },
      {
        "name": "Huyện Mỏ Cày Nam",
        "schools": [
          "THPT Mỏ Cày Nam",
          "THPT Chuyên Mỏ Cày Nam",
          "THCS Mỏ Cày Nam"
        ]
      },
      {
        "name": "Huyện Giồng Trôm",
        "schools": [
          "THPT Giồng Trôm",
          "THPT Chuyên Giồng Trôm",
          "THCS Giồng Trôm"
        ]
      },
      {
        "name": "Huyện Bình Đại",
        "schools": [
          "THPT Bình Đại",
          "THPT Chuyên Bình Đại",
          "THCS Bình Đại"
        ]
      },
      {
        "name": "Huyện Ba Tri",
        "schools": [
          "THPT Ba Tri",
          "THPT Chuyên Ba Tri",
          "THCS Ba Tri"
        ]
      },
      {
        "name": "Huyện Thạnh Phú",
        "schools": [
          "THPT Thạnh Phú",
          "THPT Chuyên Thạnh Phú",
          "THCS Thạnh Phú"
        ]
      },
      {
        "name": "Huyện Mỏ Cày Bắc",
        "schools": [
          "THPT Mỏ Cày Bắc",
          "THPT Chuyên Mỏ Cày Bắc",
          "THCS Mỏ Cày Bắc"
        ]
      }
    ]
  },
  {
    "id": "tinh_binh_duong",
    "name": "Tỉnh Bình Dương",
    "districts": [
      {
        "name": "Thành phố Thủ Dầu Một",
        "schools": [
          "THPT Thủ Dầu Một",
          "THPT Chuyên Thủ Dầu Một",
          "THCS Thủ Dầu Một"
        ]
      },
      {
        "name": "Huyện Bàu Bàng",
        "schools": [
          "THPT Bàu Bàng",
          "THPT Chuyên Bàu Bàng",
          "THCS Bàu Bàng"
        ]
      },
      {
        "name": "Huyện Dầu Tiếng",
        "schools": [
          "THPT Dầu Tiếng",
          "THPT Chuyên Dầu Tiếng",
          "THCS Dầu Tiếng"
        ]
      },
      {
        "name": "Thành phố Bến Cát",
        "schools": [
          "THPT Bến Cát",
          "THPT Chuyên Bến Cát",
          "THCS Bến Cát"
        ]
      },
      {
        "name": "Huyện Phú Giáo",
        "schools": [
          "THPT Phú Giáo",
          "THPT Chuyên Phú Giáo",
          "THCS Phú Giáo"
        ]
      },
      {
        "name": "Thành phố Tân Uyên",
        "schools": [
          "THPT Tân Uyên",
          "THPT Chuyên Tân Uyên",
          "THCS Tân Uyên"
        ]
      },
      {
        "name": "Thành phố Dĩ An",
        "schools": [
          "THPT Dĩ An",
          "THPT Chuyên Dĩ An",
          "THCS Dĩ An"
        ]
      },
      {
        "name": "Thành phố Thuận An",
        "schools": [
          "THPT Thuận An",
          "THPT Chuyên Thuận An",
          "THCS Thuận An"
        ]
      },
      {
        "name": "Huyện Bắc Tân Uyên",
        "schools": [
          "THPT Bắc Tân Uyên",
          "THPT Chuyên Bắc Tân Uyên",
          "THCS Bắc Tân Uyên"
        ]
      }
    ]
  },
  {
    "id": "tinh_binh_dinh",
    "name": "Tỉnh Bình Định",
    "districts": [
      {
        "name": "Thành phố Quy Nhơn",
        "schools": [
          "THPT Quy Nhơn",
          "THPT Chuyên Quy Nhơn",
          "THCS Quy Nhơn"
        ]
      },
      {
        "name": "Huyện An Lão",
        "schools": [
          "THPT An Lão",
          "THPT Chuyên An Lão",
          "THCS An Lão"
        ]
      },
      {
        "name": "Thị xã Hoài Nhơn",
        "schools": [
          "THPT Hoài Nhơn",
          "THPT Chuyên Hoài Nhơn",
          "THCS Hoài Nhơn"
        ]
      },
      {
        "name": "Huyện Hoài Ân",
        "schools": [
          "THPT Hoài Ân",
          "THPT Chuyên Hoài Ân",
          "THCS Hoài Ân"
        ]
      },
      {
        "name": "Huyện Phù Mỹ",
        "schools": [
          "THPT Phù Mỹ",
          "THPT Chuyên Phù Mỹ",
          "THCS Phù Mỹ"
        ]
      },
      {
        "name": "Huyện Vĩnh Thạnh",
        "schools": [
          "THPT Vĩnh Thạnh",
          "THPT Chuyên Vĩnh Thạnh",
          "THCS Vĩnh Thạnh"
        ]
      },
      {
        "name": "Huyện Tây Sơn",
        "schools": [
          "THPT Tây Sơn",
          "THPT Chuyên Tây Sơn",
          "THCS Tây Sơn"
        ]
      },
      {
        "name": "Huyện Phù Cát",
        "schools": [
          "THPT Phù Cát",
          "THPT Chuyên Phù Cát",
          "THCS Phù Cát"
        ]
      },
      {
        "name": "Thị xã An Nhơn",
        "schools": [
          "THPT An Nhơn",
          "THPT Chuyên An Nhơn",
          "THCS An Nhơn"
        ]
      },
      {
        "name": "Huyện Tuy Phước",
        "schools": [
          "THPT Tuy Phước",
          "THPT Chuyên Tuy Phước",
          "THCS Tuy Phước"
        ]
      },
      {
        "name": "Huyện Vân Canh",
        "schools": [
          "THPT Vân Canh",
          "THPT Chuyên Vân Canh",
          "THCS Vân Canh"
        ]
      }
    ]
  },
  {
    "id": "tinh_binh_phuoc",
    "name": "Tỉnh Bình Phước",
    "districts": [
      {
        "name": "Thị xã Phước Long",
        "schools": [
          "THPT Phước Long",
          "THPT Chuyên Phước Long",
          "THCS Phước Long"
        ]
      },
      {
        "name": "Thành phố Đồng Xoài",
        "schools": [
          "THPT Đồng Xoài",
          "THPT Chuyên Đồng Xoài",
          "THCS Đồng Xoài"
        ]
      },
      {
        "name": "Thị xã Bình Long",
        "schools": [
          "THPT Bình Long",
          "THPT Chuyên Bình Long",
          "THCS Bình Long"
        ]
      },
      {
        "name": "Huyện Bù Gia Mập",
        "schools": [
          "THPT Bù Gia Mập",
          "THPT Chuyên Bù Gia Mập",
          "THCS Bù Gia Mập"
        ]
      },
      {
        "name": "Huyện Lộc Ninh",
        "schools": [
          "THPT Lộc Ninh",
          "THPT Chuyên Lộc Ninh",
          "THCS Lộc Ninh"
        ]
      },
      {
        "name": "Huyện Bù Đốp",
        "schools": [
          "THPT Bù Đốp",
          "THPT Chuyên Bù Đốp",
          "THCS Bù Đốp"
        ]
      },
      {
        "name": "Huyện Hớn Quản",
        "schools": [
          "THPT Hớn Quản",
          "THPT Chuyên Hớn Quản",
          "THCS Hớn Quản"
        ]
      },
      {
        "name": "Huyện Đồng Phú",
        "schools": [
          "THPT Đồng Phú",
          "THPT Chuyên Đồng Phú",
          "THCS Đồng Phú"
        ]
      },
      {
        "name": "Huyện Bù Đăng",
        "schools": [
          "THPT Bù Đăng",
          "THPT Chuyên Bù Đăng",
          "THCS Bù Đăng"
        ]
      },
      {
        "name": "Thị xã Chơn Thành",
        "schools": [
          "THPT Chơn Thành",
          "THPT Chuyên Chơn Thành",
          "THCS Chơn Thành"
        ]
      },
      {
        "name": "Huyện Phú Riềng",
        "schools": [
          "THPT Phú Riềng",
          "THPT Chuyên Phú Riềng",
          "THCS Phú Riềng"
        ]
      }
    ]
  },
  {
    "id": "tinh_binh_thuan",
    "name": "Tỉnh Bình Thuận",
    "districts": [
      {
        "name": "Thành phố Phan Thiết",
        "schools": [
          "THPT Phan Thiết",
          "THPT Chuyên Phan Thiết",
          "THCS Phan Thiết"
        ]
      },
      {
        "name": "Thị xã La Gi",
        "schools": [
          "THPT La Gi",
          "THPT Chuyên La Gi",
          "THCS La Gi"
        ]
      },
      {
        "name": "Huyện Tuy Phong",
        "schools": [
          "THPT Tuy Phong",
          "THPT Chuyên Tuy Phong",
          "THCS Tuy Phong"
        ]
      },
      {
        "name": "Huyện Bắc Bình",
        "schools": [
          "THPT Bắc Bình",
          "THPT Chuyên Bắc Bình",
          "THCS Bắc Bình"
        ]
      },
      {
        "name": "Huyện Hàm Thuận Bắc",
        "schools": [
          "THPT Hàm Thuận Bắc",
          "THPT Chuyên Hàm Thuận Bắc",
          "THCS Hàm Thuận Bắc"
        ]
      },
      {
        "name": "Huyện Hàm Thuận Nam",
        "schools": [
          "THPT Hàm Thuận Nam",
          "THPT Chuyên Hàm Thuận Nam",
          "THCS Hàm Thuận Nam"
        ]
      },
      {
        "name": "Huyện Tánh Linh",
        "schools": [
          "THPT Tánh Linh",
          "THPT Chuyên Tánh Linh",
          "THCS Tánh Linh"
        ]
      },
      {
        "name": "Huyện Đức Linh",
        "schools": [
          "THPT Đức Linh",
          "THPT Chuyên Đức Linh",
          "THCS Đức Linh"
        ]
      },
      {
        "name": "Huyện Hàm Tân",
        "schools": [
          "THPT Hàm Tân",
          "THPT Chuyên Hàm Tân",
          "THCS Hàm Tân"
        ]
      },
      {
        "name": "Huyện Phú Quí",
        "schools": [
          "THPT Phú Quí",
          "THPT Chuyên Phú Quí",
          "THCS Phú Quí"
        ]
      }
    ]
  },
  {
    "id": "tinh_ca_mau",
    "name": "Tỉnh Cà Mau",
    "districts": [
      {
        "name": "Thành phố Cà Mau",
        "schools": [
          "THPT Cà Mau",
          "THPT Chuyên Cà Mau",
          "THCS Cà Mau"
        ]
      },
      {
        "name": "Huyện U Minh",
        "schools": [
          "THPT U Minh",
          "THPT Chuyên U Minh",
          "THCS U Minh"
        ]
      },
      {
        "name": "Huyện Thới Bình",
        "schools": [
          "THPT Thới Bình",
          "THPT Chuyên Thới Bình",
          "THCS Thới Bình"
        ]
      },
      {
        "name": "Huyện Trần Văn Thời",
        "schools": [
          "THPT Trần Văn Thời",
          "THPT Chuyên Trần Văn Thời",
          "THCS Trần Văn Thời"
        ]
      },
      {
        "name": "Huyện Cái Nước",
        "schools": [
          "THPT Cái Nước",
          "THPT Chuyên Cái Nước",
          "THCS Cái Nước"
        ]
      },
      {
        "name": "Huyện Đầm Dơi",
        "schools": [
          "THPT Đầm Dơi",
          "THPT Chuyên Đầm Dơi",
          "THCS Đầm Dơi"
        ]
      },
      {
        "name": "Huyện Năm Căn",
        "schools": [
          "THPT Năm Căn",
          "THPT Chuyên Năm Căn",
          "THCS Năm Căn"
        ]
      },
      {
        "name": "Huyện Phú Tân",
        "schools": [
          "THPT Phú Tân",
          "THPT Chuyên Phú Tân",
          "THCS Phú Tân"
        ]
      },
      {
        "name": "Huyện Ngọc Hiển",
        "schools": [
          "THPT Ngọc Hiển",
          "THPT Chuyên Ngọc Hiển",
          "THCS Ngọc Hiển"
        ]
      }
    ]
  },
  {
    "id": "tinh_cao_bang",
    "name": "Tỉnh Cao Bằng",
    "districts": [
      {
        "name": "Thành phố Cao Bằng",
        "schools": [
          "THPT Cao Bằng",
          "THPT Chuyên Cao Bằng",
          "THCS Cao Bằng"
        ]
      },
      {
        "name": "Huyện Bảo Lâm",
        "schools": [
          "THPT Bảo Lâm",
          "THPT Chuyên Bảo Lâm",
          "THCS Bảo Lâm"
        ]
      },
      {
        "name": "Huyện Bảo Lạc",
        "schools": [
          "THPT Bảo Lạc",
          "THPT Chuyên Bảo Lạc",
          "THCS Bảo Lạc"
        ]
      },
      {
        "name": "Huyện Hà Quảng",
        "schools": [
          "THPT Hà Quảng",
          "THPT Chuyên Hà Quảng",
          "THCS Hà Quảng"
        ]
      },
      {
        "name": "Huyện Trùng Khánh",
        "schools": [
          "THPT Trùng Khánh",
          "THPT Chuyên Trùng Khánh",
          "THCS Trùng Khánh"
        ]
      },
      {
        "name": "Huyện Hạ Lang",
        "schools": [
          "THPT Hạ Lang",
          "THPT Chuyên Hạ Lang",
          "THCS Hạ Lang"
        ]
      },
      {
        "name": "Huyện Quảng Hòa",
        "schools": [
          "THPT Quảng Hòa",
          "THPT Chuyên Quảng Hòa",
          "THCS Quảng Hòa"
        ]
      },
      {
        "name": "Huyện Hoà An",
        "schools": [
          "THPT Hoà An",
          "THPT Chuyên Hoà An",
          "THCS Hoà An"
        ]
      },
      {
        "name": "Huyện Nguyên Bình",
        "schools": [
          "THPT Nguyên Bình",
          "THPT Chuyên Nguyên Bình",
          "THCS Nguyên Bình"
        ]
      },
      {
        "name": "Huyện Thạch An",
        "schools": [
          "THPT Thạch An",
          "THPT Chuyên Thạch An",
          "THCS Thạch An"
        ]
      }
    ]
  },
  {
    "id": "tinh_dak_lak",
    "name": "Tỉnh Đắk Lắk",
    "districts": [
      {
        "name": "Thành phố Buôn Ma Thuột",
        "schools": [
          "THPT Buôn Ma Thuột",
          "THPT Chuyên Buôn Ma Thuột",
          "THCS Buôn Ma Thuột"
        ]
      },
      {
        "name": "Thị xã Buôn Hồ",
        "schools": [
          "THPT Buôn Hồ",
          "THPT Chuyên Buôn Hồ",
          "THCS Buôn Hồ"
        ]
      },
      {
        "name": "Huyện Ea H'leo",
        "schools": [
          "THPT Ea H'leo",
          "THPT Chuyên Ea H'leo",
          "THCS Ea H'leo"
        ]
      },
      {
        "name": "Huyện Ea Súp",
        "schools": [
          "THPT Ea Súp",
          "THPT Chuyên Ea Súp",
          "THCS Ea Súp"
        ]
      },
      {
        "name": "Huyện Buôn Đôn",
        "schools": [
          "THPT Buôn Đôn",
          "THPT Chuyên Buôn Đôn",
          "THCS Buôn Đôn"
        ]
      },
      {
        "name": "Huyện Cư M'gar",
        "schools": [
          "THPT Cư M'gar",
          "THPT Chuyên Cư M'gar",
          "THCS Cư M'gar"
        ]
      },
      {
        "name": "Huyện Krông Búk",
        "schools": [
          "THPT Krông Búk",
          "THPT Chuyên Krông Búk",
          "THCS Krông Búk"
        ]
      },
      {
        "name": "Huyện Krông Năng",
        "schools": [
          "THPT Krông Năng",
          "THPT Chuyên Krông Năng",
          "THCS Krông Năng"
        ]
      },
      {
        "name": "Huyện Ea Kar",
        "schools": [
          "THPT Ea Kar",
          "THPT Chuyên Ea Kar",
          "THCS Ea Kar"
        ]
      },
      {
        "name": "Huyện M'Đrắk",
        "schools": [
          "THPT M'Đrắk",
          "THPT Chuyên M'Đrắk",
          "THCS M'Đrắk"
        ]
      },
      {
        "name": "Huyện Krông Bông",
        "schools": [
          "THPT Krông Bông",
          "THPT Chuyên Krông Bông",
          "THCS Krông Bông"
        ]
      },
      {
        "name": "Huyện Krông Pắc",
        "schools": [
          "THPT Krông Pắc",
          "THPT Chuyên Krông Pắc",
          "THCS Krông Pắc"
        ]
      },
      {
        "name": "Huyện Krông A Na",
        "schools": [
          "THPT Krông A Na",
          "THPT Chuyên Krông A Na",
          "THCS Krông A Na"
        ]
      },
      {
        "name": "Huyện Lắk",
        "schools": [
          "THPT Lắk",
          "THPT Chuyên Lắk",
          "THCS Lắk"
        ]
      },
      {
        "name": "Huyện Cư Kuin",
        "schools": [
          "THPT Cư Kuin",
          "THPT Chuyên Cư Kuin",
          "THCS Cư Kuin"
        ]
      }
    ]
  },
  {
    "id": "tinh_dak_nong",
    "name": "Tỉnh Đắk Nông",
    "districts": [
      {
        "name": "Thành phố Gia Nghĩa",
        "schools": [
          "THPT Gia Nghĩa",
          "THPT Chuyên Gia Nghĩa",
          "THCS Gia Nghĩa"
        ]
      },
      {
        "name": "Huyện Đăk Glong",
        "schools": [
          "THPT Đăk Glong",
          "THPT Chuyên Đăk Glong",
          "THCS Đăk Glong"
        ]
      },
      {
        "name": "Huyện Cư Jút",
        "schools": [
          "THPT Cư Jút",
          "THPT Chuyên Cư Jút",
          "THCS Cư Jút"
        ]
      },
      {
        "name": "Huyện Đắk Mil",
        "schools": [
          "THPT Đắk Mil",
          "THPT Chuyên Đắk Mil",
          "THCS Đắk Mil"
        ]
      },
      {
        "name": "Huyện Krông Nô",
        "schools": [
          "THPT Krông Nô",
          "THPT Chuyên Krông Nô",
          "THCS Krông Nô"
        ]
      },
      {
        "name": "Huyện Đắk Song",
        "schools": [
          "THPT Đắk Song",
          "THPT Chuyên Đắk Song",
          "THCS Đắk Song"
        ]
      },
      {
        "name": "Huyện Đắk R'Lấp",
        "schools": [
          "THPT Đắk R'Lấp",
          "THPT Chuyên Đắk R'Lấp",
          "THCS Đắk R'Lấp"
        ]
      },
      {
        "name": "Huyện Tuy Đức",
        "schools": [
          "THPT Tuy Đức",
          "THPT Chuyên Tuy Đức",
          "THCS Tuy Đức"
        ]
      }
    ]
  },
  {
    "id": "tinh_dien_bien",
    "name": "Tỉnh Điện Biên",
    "districts": [
      {
        "name": "Thành phố Điện Biên Phủ",
        "schools": [
          "THPT Điện Biên Phủ",
          "THPT Chuyên Điện Biên Phủ",
          "THCS Điện Biên Phủ"
        ]
      },
      {
        "name": "Thị xã Mường Lay",
        "schools": [
          "THPT Mường Lay",
          "THPT Chuyên Mường Lay",
          "THCS Mường Lay"
        ]
      },
      {
        "name": "Huyện Mường Nhé",
        "schools": [
          "THPT Mường Nhé",
          "THPT Chuyên Mường Nhé",
          "THCS Mường Nhé"
        ]
      },
      {
        "name": "Huyện Mường Chà",
        "schools": [
          "THPT Mường Chà",
          "THPT Chuyên Mường Chà",
          "THCS Mường Chà"
        ]
      },
      {
        "name": "Huyện Tủa Chùa",
        "schools": [
          "THPT Tủa Chùa",
          "THPT Chuyên Tủa Chùa",
          "THCS Tủa Chùa"
        ]
      },
      {
        "name": "Huyện Tuần Giáo",
        "schools": [
          "THPT Tuần Giáo",
          "THPT Chuyên Tuần Giáo",
          "THCS Tuần Giáo"
        ]
      },
      {
        "name": "Huyện Điện Biên",
        "schools": [
          "THPT Điện Biên",
          "THPT Chuyên Điện Biên",
          "THCS Điện Biên"
        ]
      },
      {
        "name": "Huyện Điện Biên Đông",
        "schools": [
          "THPT Điện Biên Đông",
          "THPT Chuyên Điện Biên Đông",
          "THCS Điện Biên Đông"
        ]
      },
      {
        "name": "Huyện Mường Ảng",
        "schools": [
          "THPT Mường Ảng",
          "THPT Chuyên Mường Ảng",
          "THCS Mường Ảng"
        ]
      },
      {
        "name": "Huyện Nậm Pồ",
        "schools": [
          "THPT Nậm Pồ",
          "THPT Chuyên Nậm Pồ",
          "THCS Nậm Pồ"
        ]
      }
    ]
  },
  {
    "id": "tinh_dong_nai",
    "name": "Tỉnh Đồng Nai",
    "districts": [
      {
        "name": "Thành phố Biên Hòa",
        "schools": [
          "THPT Biên Hòa",
          "THPT Chuyên Biên Hòa",
          "THCS Biên Hòa"
        ]
      },
      {
        "name": "Thành phố Long Khánh",
        "schools": [
          "THPT Long Khánh",
          "THPT Chuyên Long Khánh",
          "THCS Long Khánh"
        ]
      },
      {
        "name": "Huyện Tân Phú",
        "schools": [
          "THPT Tân Phú",
          "THPT Chuyên Tân Phú",
          "THCS Tân Phú"
        ]
      },
      {
        "name": "Huyện Vĩnh Cửu",
        "schools": [
          "THPT Vĩnh Cửu",
          "THPT Chuyên Vĩnh Cửu",
          "THCS Vĩnh Cửu"
        ]
      },
      {
        "name": "Huyện Định Quán",
        "schools": [
          "THPT Định Quán",
          "THPT Chuyên Định Quán",
          "THCS Định Quán"
        ]
      },
      {
        "name": "Huyện Trảng Bom",
        "schools": [
          "THPT Trảng Bom",
          "THPT Chuyên Trảng Bom",
          "THCS Trảng Bom"
        ]
      },
      {
        "name": "Huyện Thống Nhất",
        "schools": [
          "THPT Thống Nhất",
          "THPT Chuyên Thống Nhất",
          "THCS Thống Nhất"
        ]
      },
      {
        "name": "Huyện Cẩm Mỹ",
        "schools": [
          "THPT Cẩm Mỹ",
          "THPT Chuyên Cẩm Mỹ",
          "THCS Cẩm Mỹ"
        ]
      },
      {
        "name": "Huyện Long Thành",
        "schools": [
          "THPT Long Thành",
          "THPT Chuyên Long Thành",
          "THCS Long Thành"
        ]
      },
      {
        "name": "Huyện Xuân Lộc",
        "schools": [
          "THPT Xuân Lộc",
          "THPT Chuyên Xuân Lộc",
          "THCS Xuân Lộc"
        ]
      },
      {
        "name": "Huyện Nhơn Trạch",
        "schools": [
          "THPT Nhơn Trạch",
          "THPT Chuyên Nhơn Trạch",
          "THCS Nhơn Trạch"
        ]
      }
    ]
  },
  {
    "id": "tinh_dong_thap",
    "name": "Tỉnh Đồng Tháp",
    "districts": [
      {
        "name": "Thành phố Cao Lãnh",
        "schools": [
          "THPT Cao Lãnh",
          "THPT Chuyên Cao Lãnh",
          "THCS Cao Lãnh"
        ]
      },
      {
        "name": "Thành phố Sa Đéc",
        "schools": [
          "THPT Sa Đéc",
          "THPT Chuyên Sa Đéc",
          "THCS Sa Đéc"
        ]
      },
      {
        "name": "Thành phố Hồng Ngự",
        "schools": [
          "THPT Hồng Ngự",
          "THPT Chuyên Hồng Ngự",
          "THCS Hồng Ngự"
        ]
      },
      {
        "name": "Huyện Tân Hồng",
        "schools": [
          "THPT Tân Hồng",
          "THPT Chuyên Tân Hồng",
          "THCS Tân Hồng"
        ]
      },
      {
        "name": "Huyện Hồng Ngự",
        "schools": [
          "THPT Hồng Ngự",
          "THPT Chuyên Hồng Ngự",
          "THCS Hồng Ngự"
        ]
      },
      {
        "name": "Huyện Tam Nông",
        "schools": [
          "THPT Tam Nông",
          "THPT Chuyên Tam Nông",
          "THCS Tam Nông"
        ]
      },
      {
        "name": "Huyện Tháp Mười",
        "schools": [
          "THPT Tháp Mười",
          "THPT Chuyên Tháp Mười",
          "THCS Tháp Mười"
        ]
      },
      {
        "name": "Huyện Cao Lãnh",
        "schools": [
          "THPT Cao Lãnh",
          "THPT Chuyên Cao Lãnh",
          "THCS Cao Lãnh"
        ]
      },
      {
        "name": "Huyện Thanh Bình",
        "schools": [
          "THPT Thanh Bình",
          "THPT Chuyên Thanh Bình",
          "THCS Thanh Bình"
        ]
      },
      {
        "name": "Huyện Lấp Vò",
        "schools": [
          "THPT Lấp Vò",
          "THPT Chuyên Lấp Vò",
          "THCS Lấp Vò"
        ]
      },
      {
        "name": "Huyện Lai Vung",
        "schools": [
          "THPT Lai Vung",
          "THPT Chuyên Lai Vung",
          "THCS Lai Vung"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      }
    ]
  },
  {
    "id": "tinh_gia_lai",
    "name": "Tỉnh Gia Lai",
    "districts": [
      {
        "name": "Thành phố Pleiku",
        "schools": [
          "THPT Pleiku",
          "THPT Chuyên Pleiku",
          "THCS Pleiku"
        ]
      },
      {
        "name": "Thị xã An Khê",
        "schools": [
          "THPT An Khê",
          "THPT Chuyên An Khê",
          "THCS An Khê"
        ]
      },
      {
        "name": "Thị xã Ayun Pa",
        "schools": [
          "THPT Ayun Pa",
          "THPT Chuyên Ayun Pa",
          "THCS Ayun Pa"
        ]
      },
      {
        "name": "Huyện KBang",
        "schools": [
          "THPT KBang",
          "THPT Chuyên KBang",
          "THCS KBang"
        ]
      },
      {
        "name": "Huyện Đăk Đoa",
        "schools": [
          "THPT Đăk Đoa",
          "THPT Chuyên Đăk Đoa",
          "THCS Đăk Đoa"
        ]
      },
      {
        "name": "Huyện Chư Păh",
        "schools": [
          "THPT Chư Păh",
          "THPT Chuyên Chư Păh",
          "THCS Chư Păh"
        ]
      },
      {
        "name": "Huyện Ia Grai",
        "schools": [
          "THPT Ia Grai",
          "THPT Chuyên Ia Grai",
          "THCS Ia Grai"
        ]
      },
      {
        "name": "Huyện Mang Yang",
        "schools": [
          "THPT Mang Yang",
          "THPT Chuyên Mang Yang",
          "THCS Mang Yang"
        ]
      },
      {
        "name": "Huyện Kông Chro",
        "schools": [
          "THPT Kông Chro",
          "THPT Chuyên Kông Chro",
          "THCS Kông Chro"
        ]
      },
      {
        "name": "Huyện Đức Cơ",
        "schools": [
          "THPT Đức Cơ",
          "THPT Chuyên Đức Cơ",
          "THCS Đức Cơ"
        ]
      },
      {
        "name": "Huyện Chư Prông",
        "schools": [
          "THPT Chư Prông",
          "THPT Chuyên Chư Prông",
          "THCS Chư Prông"
        ]
      },
      {
        "name": "Huyện Chư Sê",
        "schools": [
          "THPT Chư Sê",
          "THPT Chuyên Chư Sê",
          "THCS Chư Sê"
        ]
      },
      {
        "name": "Huyện Đăk Pơ",
        "schools": [
          "THPT Đăk Pơ",
          "THPT Chuyên Đăk Pơ",
          "THCS Đăk Pơ"
        ]
      },
      {
        "name": "Huyện Ia Pa",
        "schools": [
          "THPT Ia Pa",
          "THPT Chuyên Ia Pa",
          "THCS Ia Pa"
        ]
      },
      {
        "name": "Huyện Krông Pa",
        "schools": [
          "THPT Krông Pa",
          "THPT Chuyên Krông Pa",
          "THCS Krông Pa"
        ]
      },
      {
        "name": "Huyện Phú Thiện",
        "schools": [
          "THPT Phú Thiện",
          "THPT Chuyên Phú Thiện",
          "THCS Phú Thiện"
        ]
      },
      {
        "name": "Huyện Chư Pưh",
        "schools": [
          "THPT Chư Pưh",
          "THPT Chuyên Chư Pưh",
          "THCS Chư Pưh"
        ]
      }
    ]
  },
  {
    "id": "tinh_ha_giang",
    "name": "Tỉnh Hà Giang",
    "districts": [
      {
        "name": "Thành phố Hà Giang",
        "schools": [
          "THPT Hà Giang",
          "THPT Chuyên Hà Giang",
          "THCS Hà Giang"
        ]
      },
      {
        "name": "Huyện Đồng Văn",
        "schools": [
          "THPT Đồng Văn",
          "THPT Chuyên Đồng Văn",
          "THCS Đồng Văn"
        ]
      },
      {
        "name": "Huyện Mèo Vạc",
        "schools": [
          "THPT Mèo Vạc",
          "THPT Chuyên Mèo Vạc",
          "THCS Mèo Vạc"
        ]
      },
      {
        "name": "Huyện Yên Minh",
        "schools": [
          "THPT Yên Minh",
          "THPT Chuyên Yên Minh",
          "THCS Yên Minh"
        ]
      },
      {
        "name": "Huyện Quản Bạ",
        "schools": [
          "THPT Quản Bạ",
          "THPT Chuyên Quản Bạ",
          "THCS Quản Bạ"
        ]
      },
      {
        "name": "Huyện Vị Xuyên",
        "schools": [
          "THPT Vị Xuyên",
          "THPT Chuyên Vị Xuyên",
          "THCS Vị Xuyên"
        ]
      },
      {
        "name": "Huyện Bắc Mê",
        "schools": [
          "THPT Bắc Mê",
          "THPT Chuyên Bắc Mê",
          "THCS Bắc Mê"
        ]
      },
      {
        "name": "Huyện Hoàng Su Phì",
        "schools": [
          "THPT Hoàng Su Phì",
          "THPT Chuyên Hoàng Su Phì",
          "THCS Hoàng Su Phì"
        ]
      },
      {
        "name": "Huyện Xín Mần",
        "schools": [
          "THPT Xín Mần",
          "THPT Chuyên Xín Mần",
          "THCS Xín Mần"
        ]
      },
      {
        "name": "Huyện Bắc Quang",
        "schools": [
          "THPT Bắc Quang",
          "THPT Chuyên Bắc Quang",
          "THCS Bắc Quang"
        ]
      },
      {
        "name": "Huyện Quang Bình",
        "schools": [
          "THPT Quang Bình",
          "THPT Chuyên Quang Bình",
          "THCS Quang Bình"
        ]
      }
    ]
  },
  {
    "id": "tinh_ha_nam",
    "name": "Tỉnh Hà Nam",
    "districts": [
      {
        "name": "Thành phố Phủ Lý",
        "schools": [
          "THPT Phủ Lý",
          "THPT Chuyên Phủ Lý",
          "THCS Phủ Lý"
        ]
      },
      {
        "name": "Thị xã Duy Tiên",
        "schools": [
          "THPT Duy Tiên",
          "THPT Chuyên Duy Tiên",
          "THCS Duy Tiên"
        ]
      },
      {
        "name": "Thị xã Kim Bảng",
        "schools": [
          "THPT Kim Bảng",
          "THPT Chuyên Kim Bảng",
          "THCS Kim Bảng"
        ]
      },
      {
        "name": "Huyện Thanh Liêm",
        "schools": [
          "THPT Thanh Liêm",
          "THPT Chuyên Thanh Liêm",
          "THCS Thanh Liêm"
        ]
      },
      {
        "name": "Huyện Bình Lục",
        "schools": [
          "THPT Bình Lục",
          "THPT Chuyên Bình Lục",
          "THCS Bình Lục"
        ]
      },
      {
        "name": "Huyện Lý Nhân",
        "schools": [
          "THPT Lý Nhân",
          "THPT Chuyên Lý Nhân",
          "THCS Lý Nhân"
        ]
      }
    ]
  },
  {
    "id": "tinh_ha_tinh",
    "name": "Tỉnh Hà Tĩnh",
    "districts": [
      {
        "name": "Thành phố Hà Tĩnh",
        "schools": [
          "THPT Hà Tĩnh",
          "THPT Chuyên Hà Tĩnh",
          "THCS Hà Tĩnh"
        ]
      },
      {
        "name": "Thị xã Hồng Lĩnh",
        "schools": [
          "THPT Hồng Lĩnh",
          "THPT Chuyên Hồng Lĩnh",
          "THCS Hồng Lĩnh"
        ]
      },
      {
        "name": "Huyện Hương Sơn",
        "schools": [
          "THPT Hương Sơn",
          "THPT Chuyên Hương Sơn",
          "THCS Hương Sơn"
        ]
      },
      {
        "name": "Huyện Đức Thọ",
        "schools": [
          "THPT Đức Thọ",
          "THPT Chuyên Đức Thọ",
          "THCS Đức Thọ"
        ]
      },
      {
        "name": "Huyện Vũ Quang",
        "schools": [
          "THPT Vũ Quang",
          "THPT Chuyên Vũ Quang",
          "THCS Vũ Quang"
        ]
      },
      {
        "name": "Huyện Nghi Xuân",
        "schools": [
          "THPT Nghi Xuân",
          "THPT Chuyên Nghi Xuân",
          "THCS Nghi Xuân"
        ]
      },
      {
        "name": "Huyện Can Lộc",
        "schools": [
          "THPT Can Lộc",
          "THPT Chuyên Can Lộc",
          "THCS Can Lộc"
        ]
      },
      {
        "name": "Huyện Hương Khê",
        "schools": [
          "THPT Hương Khê",
          "THPT Chuyên Hương Khê",
          "THCS Hương Khê"
        ]
      },
      {
        "name": "Huyện Thạch Hà",
        "schools": [
          "THPT Thạch Hà",
          "THPT Chuyên Thạch Hà",
          "THCS Thạch Hà"
        ]
      },
      {
        "name": "Huyện Cẩm Xuyên",
        "schools": [
          "THPT Cẩm Xuyên",
          "THPT Chuyên Cẩm Xuyên",
          "THCS Cẩm Xuyên"
        ]
      },
      {
        "name": "Huyện Kỳ Anh",
        "schools": [
          "THPT Kỳ Anh",
          "THPT Chuyên Kỳ Anh",
          "THCS Kỳ Anh"
        ]
      },
      {
        "name": "Thị xã Kỳ Anh",
        "schools": [
          "THPT Kỳ Anh",
          "THPT Chuyên Kỳ Anh",
          "THCS Kỳ Anh"
        ]
      }
    ]
  },
  {
    "id": "tinh_hai_duong",
    "name": "Tỉnh Hải Dương",
    "districts": [
      {
        "name": "Thành phố Hải Dương",
        "schools": [
          "THPT Hải Dương",
          "THPT Chuyên Hải Dương",
          "THCS Hải Dương"
        ]
      },
      {
        "name": "Thành phố Chí Linh",
        "schools": [
          "THPT Chí Linh",
          "THPT Chuyên Chí Linh",
          "THCS Chí Linh"
        ]
      },
      {
        "name": "Huyện Nam Sách",
        "schools": [
          "THPT Nam Sách",
          "THPT Chuyên Nam Sách",
          "THCS Nam Sách"
        ]
      },
      {
        "name": "Thị xã Kinh Môn",
        "schools": [
          "THPT Kinh Môn",
          "THPT Chuyên Kinh Môn",
          "THCS Kinh Môn"
        ]
      },
      {
        "name": "Huyện Kim Thành",
        "schools": [
          "THPT Kim Thành",
          "THPT Chuyên Kim Thành",
          "THCS Kim Thành"
        ]
      },
      {
        "name": "Huyện Thanh Hà",
        "schools": [
          "THPT Thanh Hà",
          "THPT Chuyên Thanh Hà",
          "THCS Thanh Hà"
        ]
      },
      {
        "name": "Huyện Cẩm Giàng",
        "schools": [
          "THPT Cẩm Giàng",
          "THPT Chuyên Cẩm Giàng",
          "THCS Cẩm Giàng"
        ]
      },
      {
        "name": "Huyện Bình Giang",
        "schools": [
          "THPT Bình Giang",
          "THPT Chuyên Bình Giang",
          "THCS Bình Giang"
        ]
      },
      {
        "name": "Huyện Gia Lộc",
        "schools": [
          "THPT Gia Lộc",
          "THPT Chuyên Gia Lộc",
          "THCS Gia Lộc"
        ]
      },
      {
        "name": "Huyện Tứ Kỳ",
        "schools": [
          "THPT Tứ Kỳ",
          "THPT Chuyên Tứ Kỳ",
          "THCS Tứ Kỳ"
        ]
      },
      {
        "name": "Huyện Ninh Giang",
        "schools": [
          "THPT Ninh Giang",
          "THPT Chuyên Ninh Giang",
          "THCS Ninh Giang"
        ]
      },
      {
        "name": "Huyện Thanh Miện",
        "schools": [
          "THPT Thanh Miện",
          "THPT Chuyên Thanh Miện",
          "THCS Thanh Miện"
        ]
      }
    ]
  },
  {
    "id": "tinh_hau_giang",
    "name": "Tỉnh Hậu Giang",
    "districts": [
      {
        "name": "Thành phố Vị Thanh",
        "schools": [
          "THPT Vị Thanh",
          "THPT Chuyên Vị Thanh",
          "THCS Vị Thanh"
        ]
      },
      {
        "name": "Thành phố Ngã Bảy",
        "schools": [
          "THPT Ngã Bảy",
          "THPT Chuyên Ngã Bảy",
          "THCS Ngã Bảy"
        ]
      },
      {
        "name": "Huyện Châu Thành A",
        "schools": [
          "THPT Châu Thành A",
          "THPT Chuyên Châu Thành A",
          "THCS Châu Thành A"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Phụng Hiệp",
        "schools": [
          "THPT Phụng Hiệp",
          "THPT Chuyên Phụng Hiệp",
          "THCS Phụng Hiệp"
        ]
      },
      {
        "name": "Huyện Vị Thuỷ",
        "schools": [
          "THPT Vị Thuỷ",
          "THPT Chuyên Vị Thuỷ",
          "THCS Vị Thuỷ"
        ]
      },
      {
        "name": "Huyện Long Mỹ",
        "schools": [
          "THPT Long Mỹ",
          "THPT Chuyên Long Mỹ",
          "THCS Long Mỹ"
        ]
      },
      {
        "name": "Thị xã Long Mỹ",
        "schools": [
          "THPT Long Mỹ",
          "THPT Chuyên Long Mỹ",
          "THCS Long Mỹ"
        ]
      }
    ]
  },
  {
    "id": "tinh_hoa_binh",
    "name": "Tỉnh Hoà Bình",
    "districts": [
      {
        "name": "Thành phố Hòa Bình",
        "schools": [
          "THPT Hòa Bình",
          "THPT Chuyên Hòa Bình",
          "THCS Hòa Bình"
        ]
      },
      {
        "name": "Huyện Đà Bắc",
        "schools": [
          "THPT Đà Bắc",
          "THPT Chuyên Đà Bắc",
          "THCS Đà Bắc"
        ]
      },
      {
        "name": "Huyện Lương Sơn",
        "schools": [
          "THPT Lương Sơn",
          "THPT Chuyên Lương Sơn",
          "THCS Lương Sơn"
        ]
      },
      {
        "name": "Huyện Kim Bôi",
        "schools": [
          "THPT Kim Bôi",
          "THPT Chuyên Kim Bôi",
          "THCS Kim Bôi"
        ]
      },
      {
        "name": "Huyện Cao Phong",
        "schools": [
          "THPT Cao Phong",
          "THPT Chuyên Cao Phong",
          "THCS Cao Phong"
        ]
      },
      {
        "name": "Huyện Tân Lạc",
        "schools": [
          "THPT Tân Lạc",
          "THPT Chuyên Tân Lạc",
          "THCS Tân Lạc"
        ]
      },
      {
        "name": "Huyện Mai Châu",
        "schools": [
          "THPT Mai Châu",
          "THPT Chuyên Mai Châu",
          "THCS Mai Châu"
        ]
      },
      {
        "name": "Huyện Lạc Sơn",
        "schools": [
          "THPT Lạc Sơn",
          "THPT Chuyên Lạc Sơn",
          "THCS Lạc Sơn"
        ]
      },
      {
        "name": "Huyện Yên Thủy",
        "schools": [
          "THPT Yên Thủy",
          "THPT Chuyên Yên Thủy",
          "THCS Yên Thủy"
        ]
      },
      {
        "name": "Huyện Lạc Thủy",
        "schools": [
          "THPT Lạc Thủy",
          "THPT Chuyên Lạc Thủy",
          "THCS Lạc Thủy"
        ]
      }
    ]
  },
  {
    "id": "tinh_hung_yen",
    "name": "Tỉnh Hưng Yên",
    "districts": [
      {
        "name": "Thành phố Hưng Yên",
        "schools": [
          "THPT Hưng Yên",
          "THPT Chuyên Hưng Yên",
          "THCS Hưng Yên"
        ]
      },
      {
        "name": "Huyện Văn Lâm",
        "schools": [
          "THPT Văn Lâm",
          "THPT Chuyên Văn Lâm",
          "THCS Văn Lâm"
        ]
      },
      {
        "name": "Huyện Văn Giang",
        "schools": [
          "THPT Văn Giang",
          "THPT Chuyên Văn Giang",
          "THCS Văn Giang"
        ]
      },
      {
        "name": "Huyện Yên Mỹ",
        "schools": [
          "THPT Yên Mỹ",
          "THPT Chuyên Yên Mỹ",
          "THCS Yên Mỹ"
        ]
      },
      {
        "name": "Thị xã Mỹ Hào",
        "schools": [
          "THPT Mỹ Hào",
          "THPT Chuyên Mỹ Hào",
          "THCS Mỹ Hào"
        ]
      },
      {
        "name": "Huyện Ân Thi",
        "schools": [
          "THPT Ân Thi",
          "THPT Chuyên Ân Thi",
          "THCS Ân Thi"
        ]
      },
      {
        "name": "Huyện Khoái Châu",
        "schools": [
          "THPT Khoái Châu",
          "THPT Chuyên Khoái Châu",
          "THCS Khoái Châu"
        ]
      },
      {
        "name": "Huyện Kim Động",
        "schools": [
          "THPT Kim Động",
          "THPT Chuyên Kim Động",
          "THCS Kim Động"
        ]
      },
      {
        "name": "Huyện Tiên Lữ",
        "schools": [
          "THPT Tiên Lữ",
          "THPT Chuyên Tiên Lữ",
          "THCS Tiên Lữ"
        ]
      },
      {
        "name": "Huyện Phù Cừ",
        "schools": [
          "THPT Phù Cừ",
          "THPT Chuyên Phù Cừ",
          "THCS Phù Cừ"
        ]
      }
    ]
  },
  {
    "id": "tinh_khanh_hoa",
    "name": "Tỉnh Khánh Hòa",
    "districts": [
      {
        "name": "Thành phố Nha Trang",
        "schools": [
          "THPT Nha Trang",
          "THPT Chuyên Nha Trang",
          "THCS Nha Trang"
        ]
      },
      {
        "name": "Thành phố Cam Ranh",
        "schools": [
          "THPT Cam Ranh",
          "THPT Chuyên Cam Ranh",
          "THCS Cam Ranh"
        ]
      },
      {
        "name": "Huyện Cam Lâm",
        "schools": [
          "THPT Cam Lâm",
          "THPT Chuyên Cam Lâm",
          "THCS Cam Lâm"
        ]
      },
      {
        "name": "Huyện Vạn Ninh",
        "schools": [
          "THPT Vạn Ninh",
          "THPT Chuyên Vạn Ninh",
          "THCS Vạn Ninh"
        ]
      },
      {
        "name": "Thị xã Ninh Hòa",
        "schools": [
          "THPT Ninh Hòa",
          "THPT Chuyên Ninh Hòa",
          "THCS Ninh Hòa"
        ]
      },
      {
        "name": "Huyện Khánh Vĩnh",
        "schools": [
          "THPT Khánh Vĩnh",
          "THPT Chuyên Khánh Vĩnh",
          "THCS Khánh Vĩnh"
        ]
      },
      {
        "name": "Huyện Diên Khánh",
        "schools": [
          "THPT Diên Khánh",
          "THPT Chuyên Diên Khánh",
          "THCS Diên Khánh"
        ]
      },
      {
        "name": "Huyện Khánh Sơn",
        "schools": [
          "THPT Khánh Sơn",
          "THPT Chuyên Khánh Sơn",
          "THCS Khánh Sơn"
        ]
      },
      {
        "name": "Huyện Trường Sa",
        "schools": [
          "THPT Trường Sa",
          "THPT Chuyên Trường Sa",
          "THCS Trường Sa"
        ]
      }
    ]
  },
  {
    "id": "tinh_kien_giang",
    "name": "Tỉnh Kiên Giang",
    "districts": [
      {
        "name": "Thành phố Rạch Giá",
        "schools": [
          "THPT Rạch Giá",
          "THPT Chuyên Rạch Giá",
          "THCS Rạch Giá"
        ]
      },
      {
        "name": "Thành phố Hà Tiên",
        "schools": [
          "THPT Hà Tiên",
          "THPT Chuyên Hà Tiên",
          "THCS Hà Tiên"
        ]
      },
      {
        "name": "Huyện Kiên Lương",
        "schools": [
          "THPT Kiên Lương",
          "THPT Chuyên Kiên Lương",
          "THCS Kiên Lương"
        ]
      },
      {
        "name": "Huyện Hòn Đất",
        "schools": [
          "THPT Hòn Đất",
          "THPT Chuyên Hòn Đất",
          "THCS Hòn Đất"
        ]
      },
      {
        "name": "Huyện Tân Hiệp",
        "schools": [
          "THPT Tân Hiệp",
          "THPT Chuyên Tân Hiệp",
          "THCS Tân Hiệp"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Giồng Riềng",
        "schools": [
          "THPT Giồng Riềng",
          "THPT Chuyên Giồng Riềng",
          "THCS Giồng Riềng"
        ]
      },
      {
        "name": "Huyện Gò Quao",
        "schools": [
          "THPT Gò Quao",
          "THPT Chuyên Gò Quao",
          "THCS Gò Quao"
        ]
      },
      {
        "name": "Huyện An Biên",
        "schools": [
          "THPT An Biên",
          "THPT Chuyên An Biên",
          "THCS An Biên"
        ]
      },
      {
        "name": "Huyện An Minh",
        "schools": [
          "THPT An Minh",
          "THPT Chuyên An Minh",
          "THCS An Minh"
        ]
      },
      {
        "name": "Huyện Vĩnh Thuận",
        "schools": [
          "THPT Vĩnh Thuận",
          "THPT Chuyên Vĩnh Thuận",
          "THCS Vĩnh Thuận"
        ]
      },
      {
        "name": "Thành phố Phú Quốc",
        "schools": [
          "THPT Phú Quốc",
          "THPT Chuyên Phú Quốc",
          "THCS Phú Quốc"
        ]
      },
      {
        "name": "Huyện Kiên Hải",
        "schools": [
          "THPT Kiên Hải",
          "THPT Chuyên Kiên Hải",
          "THCS Kiên Hải"
        ]
      },
      {
        "name": "Huyện U Minh Thượng",
        "schools": [
          "THPT U Minh Thượng",
          "THPT Chuyên U Minh Thượng",
          "THCS U Minh Thượng"
        ]
      },
      {
        "name": "Huyện Giang Thành",
        "schools": [
          "THPT Giang Thành",
          "THPT Chuyên Giang Thành",
          "THCS Giang Thành"
        ]
      }
    ]
  },
  {
    "id": "tinh_kon_tum",
    "name": "Tỉnh Kon Tum",
    "districts": [
      {
        "name": "Thành phố Kon Tum",
        "schools": [
          "THPT Kon Tum",
          "THPT Chuyên Kon Tum",
          "THCS Kon Tum"
        ]
      },
      {
        "name": "Huyện Đắk Glei",
        "schools": [
          "THPT Đắk Glei",
          "THPT Chuyên Đắk Glei",
          "THCS Đắk Glei"
        ]
      },
      {
        "name": "Huyện Ngọc Hồi",
        "schools": [
          "THPT Ngọc Hồi",
          "THPT Chuyên Ngọc Hồi",
          "THCS Ngọc Hồi"
        ]
      },
      {
        "name": "Huyện Đắk Tô",
        "schools": [
          "THPT Đắk Tô",
          "THPT Chuyên Đắk Tô",
          "THCS Đắk Tô"
        ]
      },
      {
        "name": "Huyện Kon Plông",
        "schools": [
          "THPT Kon Plông",
          "THPT Chuyên Kon Plông",
          "THCS Kon Plông"
        ]
      },
      {
        "name": "Huyện Kon Rẫy",
        "schools": [
          "THPT Kon Rẫy",
          "THPT Chuyên Kon Rẫy",
          "THCS Kon Rẫy"
        ]
      },
      {
        "name": "Huyện Đắk Hà",
        "schools": [
          "THPT Đắk Hà",
          "THPT Chuyên Đắk Hà",
          "THCS Đắk Hà"
        ]
      },
      {
        "name": "Huyện Sa Thầy",
        "schools": [
          "THPT Sa Thầy",
          "THPT Chuyên Sa Thầy",
          "THCS Sa Thầy"
        ]
      },
      {
        "name": "Huyện Tu Mơ Rông",
        "schools": [
          "THPT Tu Mơ Rông",
          "THPT Chuyên Tu Mơ Rông",
          "THCS Tu Mơ Rông"
        ]
      },
      {
        "name": "Huyện Ia H' Drai",
        "schools": [
          "THPT Ia H' Drai",
          "THPT Chuyên Ia H' Drai",
          "THCS Ia H' Drai"
        ]
      }
    ]
  },
  {
    "id": "tinh_lai_chau",
    "name": "Tỉnh Lai Châu",
    "districts": [
      {
        "name": "Thành phố Lai Châu",
        "schools": [
          "THPT Lai Châu",
          "THPT Chuyên Lai Châu",
          "THCS Lai Châu"
        ]
      },
      {
        "name": "Huyện Tam Đường",
        "schools": [
          "THPT Tam Đường",
          "THPT Chuyên Tam Đường",
          "THCS Tam Đường"
        ]
      },
      {
        "name": "Huyện Mường Tè",
        "schools": [
          "THPT Mường Tè",
          "THPT Chuyên Mường Tè",
          "THCS Mường Tè"
        ]
      },
      {
        "name": "Huyện Sìn Hồ",
        "schools": [
          "THPT Sìn Hồ",
          "THPT Chuyên Sìn Hồ",
          "THCS Sìn Hồ"
        ]
      },
      {
        "name": "Huyện Phong Thổ",
        "schools": [
          "THPT Phong Thổ",
          "THPT Chuyên Phong Thổ",
          "THCS Phong Thổ"
        ]
      },
      {
        "name": "Huyện Than Uyên",
        "schools": [
          "THPT Than Uyên",
          "THPT Chuyên Than Uyên",
          "THCS Than Uyên"
        ]
      },
      {
        "name": "Huyện Tân Uyên",
        "schools": [
          "THPT Tân Uyên",
          "THPT Chuyên Tân Uyên",
          "THCS Tân Uyên"
        ]
      },
      {
        "name": "Huyện Nậm Nhùn",
        "schools": [
          "THPT Nậm Nhùn",
          "THPT Chuyên Nậm Nhùn",
          "THCS Nậm Nhùn"
        ]
      }
    ]
  },
  {
    "id": "tinh_lang_son",
    "name": "Tỉnh Lạng Sơn",
    "districts": [
      {
        "name": "Thành phố Lạng Sơn",
        "schools": [
          "THPT Lạng Sơn",
          "THPT Chuyên Lạng Sơn",
          "THCS Lạng Sơn"
        ]
      },
      {
        "name": "Huyện Tràng Định",
        "schools": [
          "THPT Tràng Định",
          "THPT Chuyên Tràng Định",
          "THCS Tràng Định"
        ]
      },
      {
        "name": "Huyện Bình Gia",
        "schools": [
          "THPT Bình Gia",
          "THPT Chuyên Bình Gia",
          "THCS Bình Gia"
        ]
      },
      {
        "name": "Huyện Văn Lãng",
        "schools": [
          "THPT Văn Lãng",
          "THPT Chuyên Văn Lãng",
          "THCS Văn Lãng"
        ]
      },
      {
        "name": "Huyện Cao Lộc",
        "schools": [
          "THPT Cao Lộc",
          "THPT Chuyên Cao Lộc",
          "THCS Cao Lộc"
        ]
      },
      {
        "name": "Huyện Văn Quan",
        "schools": [
          "THPT Văn Quan",
          "THPT Chuyên Văn Quan",
          "THCS Văn Quan"
        ]
      },
      {
        "name": "Huyện Bắc Sơn",
        "schools": [
          "THPT Bắc Sơn",
          "THPT Chuyên Bắc Sơn",
          "THCS Bắc Sơn"
        ]
      },
      {
        "name": "Huyện Hữu Lũng",
        "schools": [
          "THPT Hữu Lũng",
          "THPT Chuyên Hữu Lũng",
          "THCS Hữu Lũng"
        ]
      },
      {
        "name": "Huyện Chi Lăng",
        "schools": [
          "THPT Chi Lăng",
          "THPT Chuyên Chi Lăng",
          "THCS Chi Lăng"
        ]
      },
      {
        "name": "Huyện Lộc Bình",
        "schools": [
          "THPT Lộc Bình",
          "THPT Chuyên Lộc Bình",
          "THCS Lộc Bình"
        ]
      },
      {
        "name": "Huyện Đình Lập",
        "schools": [
          "THPT Đình Lập",
          "THPT Chuyên Đình Lập",
          "THCS Đình Lập"
        ]
      }
    ]
  },
  {
    "id": "tinh_lao_cai",
    "name": "Tỉnh Lào Cai",
    "districts": [
      {
        "name": "Thành phố Lào Cai",
        "schools": [
          "THPT Lào Cai",
          "THPT Chuyên Lào Cai",
          "THCS Lào Cai"
        ]
      },
      {
        "name": "Huyện Bát Xát",
        "schools": [
          "THPT Bát Xát",
          "THPT Chuyên Bát Xát",
          "THCS Bát Xát"
        ]
      },
      {
        "name": "Huyện Mường Khương",
        "schools": [
          "THPT Mường Khương",
          "THPT Chuyên Mường Khương",
          "THCS Mường Khương"
        ]
      },
      {
        "name": "Huyện Si Ma Cai",
        "schools": [
          "THPT Si Ma Cai",
          "THPT Chuyên Si Ma Cai",
          "THCS Si Ma Cai"
        ]
      },
      {
        "name": "Huyện Bắc Hà",
        "schools": [
          "THPT Bắc Hà",
          "THPT Chuyên Bắc Hà",
          "THCS Bắc Hà"
        ]
      },
      {
        "name": "Huyện Bảo Thắng",
        "schools": [
          "THPT Bảo Thắng",
          "THPT Chuyên Bảo Thắng",
          "THCS Bảo Thắng"
        ]
      },
      {
        "name": "Huyện Bảo Yên",
        "schools": [
          "THPT Bảo Yên",
          "THPT Chuyên Bảo Yên",
          "THCS Bảo Yên"
        ]
      },
      {
        "name": "Thị xã Sa Pa",
        "schools": [
          "THPT Sa Pa",
          "THPT Chuyên Sa Pa",
          "THCS Sa Pa"
        ]
      },
      {
        "name": "Huyện Văn Bàn",
        "schools": [
          "THPT Văn Bàn",
          "THPT Chuyên Văn Bàn",
          "THCS Văn Bàn"
        ]
      }
    ]
  },
  {
    "id": "tinh_lam_dong",
    "name": "Tỉnh Lâm Đồng",
    "districts": [
      {
        "name": "Thành phố Đà Lạt",
        "schools": [
          "THPT Đà Lạt",
          "THPT Chuyên Đà Lạt",
          "THCS Đà Lạt"
        ]
      },
      {
        "name": "Thành phố Bảo Lộc",
        "schools": [
          "THPT Bảo Lộc",
          "THPT Chuyên Bảo Lộc",
          "THCS Bảo Lộc"
        ]
      },
      {
        "name": "Huyện Đam Rông",
        "schools": [
          "THPT Đam Rông",
          "THPT Chuyên Đam Rông",
          "THCS Đam Rông"
        ]
      },
      {
        "name": "Huyện Lạc Dương",
        "schools": [
          "THPT Lạc Dương",
          "THPT Chuyên Lạc Dương",
          "THCS Lạc Dương"
        ]
      },
      {
        "name": "Huyện Lâm Hà",
        "schools": [
          "THPT Lâm Hà",
          "THPT Chuyên Lâm Hà",
          "THCS Lâm Hà"
        ]
      },
      {
        "name": "Huyện Đơn Dương",
        "schools": [
          "THPT Đơn Dương",
          "THPT Chuyên Đơn Dương",
          "THCS Đơn Dương"
        ]
      },
      {
        "name": "Huyện Đức Trọng",
        "schools": [
          "THPT Đức Trọng",
          "THPT Chuyên Đức Trọng",
          "THCS Đức Trọng"
        ]
      },
      {
        "name": "Huyện Di Linh",
        "schools": [
          "THPT Di Linh",
          "THPT Chuyên Di Linh",
          "THCS Di Linh"
        ]
      },
      {
        "name": "Huyện Bảo Lâm",
        "schools": [
          "THPT Bảo Lâm",
          "THPT Chuyên Bảo Lâm",
          "THCS Bảo Lâm"
        ]
      },
      {
        "name": "Huyện Đạ Huoai",
        "schools": [
          "THPT Đạ Huoai",
          "THPT Chuyên Đạ Huoai",
          "THCS Đạ Huoai"
        ]
      }
    ]
  },
  {
    "id": "tinh_long_an",
    "name": "Tỉnh Long An",
    "districts": [
      {
        "name": "Thành phố Tân An",
        "schools": [
          "THPT Tân An",
          "THPT Chuyên Tân An",
          "THCS Tân An"
        ]
      },
      {
        "name": "Thị xã Kiến Tường",
        "schools": [
          "THPT Kiến Tường",
          "THPT Chuyên Kiến Tường",
          "THCS Kiến Tường"
        ]
      },
      {
        "name": "Huyện Tân Hưng",
        "schools": [
          "THPT Tân Hưng",
          "THPT Chuyên Tân Hưng",
          "THCS Tân Hưng"
        ]
      },
      {
        "name": "Huyện Vĩnh Hưng",
        "schools": [
          "THPT Vĩnh Hưng",
          "THPT Chuyên Vĩnh Hưng",
          "THCS Vĩnh Hưng"
        ]
      },
      {
        "name": "Huyện Mộc Hóa",
        "schools": [
          "THPT Mộc Hóa",
          "THPT Chuyên Mộc Hóa",
          "THCS Mộc Hóa"
        ]
      },
      {
        "name": "Huyện Tân Thạnh",
        "schools": [
          "THPT Tân Thạnh",
          "THPT Chuyên Tân Thạnh",
          "THCS Tân Thạnh"
        ]
      },
      {
        "name": "Huyện Thạnh Hóa",
        "schools": [
          "THPT Thạnh Hóa",
          "THPT Chuyên Thạnh Hóa",
          "THCS Thạnh Hóa"
        ]
      },
      {
        "name": "Huyện Đức Huệ",
        "schools": [
          "THPT Đức Huệ",
          "THPT Chuyên Đức Huệ",
          "THCS Đức Huệ"
        ]
      },
      {
        "name": "Huyện Đức Hòa",
        "schools": [
          "THPT Đức Hòa",
          "THPT Chuyên Đức Hòa",
          "THCS Đức Hòa"
        ]
      },
      {
        "name": "Huyện Bến Lức",
        "schools": [
          "THPT Bến Lức",
          "THPT Chuyên Bến Lức",
          "THCS Bến Lức"
        ]
      },
      {
        "name": "Huyện Thủ Thừa",
        "schools": [
          "THPT Thủ Thừa",
          "THPT Chuyên Thủ Thừa",
          "THCS Thủ Thừa"
        ]
      },
      {
        "name": "Huyện Tân Trụ",
        "schools": [
          "THPT Tân Trụ",
          "THPT Chuyên Tân Trụ",
          "THCS Tân Trụ"
        ]
      },
      {
        "name": "Huyện Cần Đước",
        "schools": [
          "THPT Cần Đước",
          "THPT Chuyên Cần Đước",
          "THCS Cần Đước"
        ]
      },
      {
        "name": "Huyện Cần Giuộc",
        "schools": [
          "THPT Cần Giuộc",
          "THPT Chuyên Cần Giuộc",
          "THCS Cần Giuộc"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      }
    ]
  },
  {
    "id": "tinh_nam_dinh",
    "name": "Tỉnh Nam Định",
    "districts": [
      {
        "name": "Thành phố Nam Định",
        "schools": [
          "THPT Nam Định",
          "THPT Chuyên Nam Định",
          "THCS Nam Định"
        ]
      },
      {
        "name": "Huyện Vụ Bản",
        "schools": [
          "THPT Vụ Bản",
          "THPT Chuyên Vụ Bản",
          "THCS Vụ Bản"
        ]
      },
      {
        "name": "Huyện Ý Yên",
        "schools": [
          "THPT Ý Yên",
          "THPT Chuyên Ý Yên",
          "THCS Ý Yên"
        ]
      },
      {
        "name": "Huyện Nghĩa Hưng",
        "schools": [
          "THPT Nghĩa Hưng",
          "THPT Chuyên Nghĩa Hưng",
          "THCS Nghĩa Hưng"
        ]
      },
      {
        "name": "Huyện Nam Trực",
        "schools": [
          "THPT Nam Trực",
          "THPT Chuyên Nam Trực",
          "THCS Nam Trực"
        ]
      },
      {
        "name": "Huyện Trực Ninh",
        "schools": [
          "THPT Trực Ninh",
          "THPT Chuyên Trực Ninh",
          "THCS Trực Ninh"
        ]
      },
      {
        "name": "Huyện Xuân Trường",
        "schools": [
          "THPT Xuân Trường",
          "THPT Chuyên Xuân Trường",
          "THCS Xuân Trường"
        ]
      },
      {
        "name": "Huyện Giao Thủy",
        "schools": [
          "THPT Giao Thủy",
          "THPT Chuyên Giao Thủy",
          "THCS Giao Thủy"
        ]
      },
      {
        "name": "Huyện Hải Hậu",
        "schools": [
          "THPT Hải Hậu",
          "THPT Chuyên Hải Hậu",
          "THCS Hải Hậu"
        ]
      }
    ]
  },
  {
    "id": "tinh_nghe_an",
    "name": "Tỉnh Nghệ An",
    "districts": [
      {
        "name": "Thành phố Vinh",
        "schools": [
          "THPT Vinh",
          "THPT Chuyên Vinh",
          "THCS Vinh"
        ]
      },
      {
        "name": "Thị xã Thái Hoà",
        "schools": [
          "THPT Thái Hoà",
          "THPT Chuyên Thái Hoà",
          "THCS Thái Hoà"
        ]
      },
      {
        "name": "Huyện Quế Phong",
        "schools": [
          "THPT Quế Phong",
          "THPT Chuyên Quế Phong",
          "THCS Quế Phong"
        ]
      },
      {
        "name": "Huyện Quỳ Châu",
        "schools": [
          "THPT Quỳ Châu",
          "THPT Chuyên Quỳ Châu",
          "THCS Quỳ Châu"
        ]
      },
      {
        "name": "Huyện Kỳ Sơn",
        "schools": [
          "THPT Kỳ Sơn",
          "THPT Chuyên Kỳ Sơn",
          "THCS Kỳ Sơn"
        ]
      },
      {
        "name": "Huyện Tương Dương",
        "schools": [
          "THPT Tương Dương",
          "THPT Chuyên Tương Dương",
          "THCS Tương Dương"
        ]
      },
      {
        "name": "Huyện Nghĩa Đàn",
        "schools": [
          "THPT Nghĩa Đàn",
          "THPT Chuyên Nghĩa Đàn",
          "THCS Nghĩa Đàn"
        ]
      },
      {
        "name": "Huyện Quỳ Hợp",
        "schools": [
          "THPT Quỳ Hợp",
          "THPT Chuyên Quỳ Hợp",
          "THCS Quỳ Hợp"
        ]
      },
      {
        "name": "Huyện Quỳnh Lưu",
        "schools": [
          "THPT Quỳnh Lưu",
          "THPT Chuyên Quỳnh Lưu",
          "THCS Quỳnh Lưu"
        ]
      },
      {
        "name": "Huyện Con Cuông",
        "schools": [
          "THPT Con Cuông",
          "THPT Chuyên Con Cuông",
          "THCS Con Cuông"
        ]
      },
      {
        "name": "Huyện Tân Kỳ",
        "schools": [
          "THPT Tân Kỳ",
          "THPT Chuyên Tân Kỳ",
          "THCS Tân Kỳ"
        ]
      },
      {
        "name": "Huyện Anh Sơn",
        "schools": [
          "THPT Anh Sơn",
          "THPT Chuyên Anh Sơn",
          "THCS Anh Sơn"
        ]
      },
      {
        "name": "Huyện Diễn Châu",
        "schools": [
          "THPT Diễn Châu",
          "THPT Chuyên Diễn Châu",
          "THCS Diễn Châu"
        ]
      },
      {
        "name": "Huyện Yên Thành",
        "schools": [
          "THPT Yên Thành",
          "THPT Chuyên Yên Thành",
          "THCS Yên Thành"
        ]
      },
      {
        "name": "Huyện Đô Lương",
        "schools": [
          "THPT Đô Lương",
          "THPT Chuyên Đô Lương",
          "THCS Đô Lương"
        ]
      },
      {
        "name": "Huyện Thanh Chương",
        "schools": [
          "THPT Thanh Chương",
          "THPT Chuyên Thanh Chương",
          "THCS Thanh Chương"
        ]
      },
      {
        "name": "Huyện Nghi Lộc",
        "schools": [
          "THPT Nghi Lộc",
          "THPT Chuyên Nghi Lộc",
          "THCS Nghi Lộc"
        ]
      },
      {
        "name": "Huyện Nam Đàn",
        "schools": [
          "THPT Nam Đàn",
          "THPT Chuyên Nam Đàn",
          "THCS Nam Đàn"
        ]
      },
      {
        "name": "Huyện Hưng Nguyên",
        "schools": [
          "THPT Hưng Nguyên",
          "THPT Chuyên Hưng Nguyên",
          "THCS Hưng Nguyên"
        ]
      },
      {
        "name": "Thị xã Hoàng Mai",
        "schools": [
          "THPT Hoàng Mai",
          "THPT Chuyên Hoàng Mai",
          "THCS Hoàng Mai"
        ]
      }
    ]
  },
  {
    "id": "tinh_ninh_binh",
    "name": "Tỉnh Ninh Bình",
    "districts": [
      {
        "name": "Thành phố Tam Điệp",
        "schools": [
          "THPT Tam Điệp",
          "THPT Chuyên Tam Điệp",
          "THCS Tam Điệp"
        ]
      },
      {
        "name": "Huyện Nho Quan",
        "schools": [
          "THPT Nho Quan",
          "THPT Chuyên Nho Quan",
          "THCS Nho Quan"
        ]
      },
      {
        "name": "Huyện Gia Viễn",
        "schools": [
          "THPT Gia Viễn",
          "THPT Chuyên Gia Viễn",
          "THCS Gia Viễn"
        ]
      },
      {
        "name": "Thành phố Hoa Lư",
        "schools": [
          "THPT Hoa Lư",
          "THPT Chuyên Hoa Lư",
          "THCS Hoa Lư"
        ]
      },
      {
        "name": "Huyện Yên Khánh",
        "schools": [
          "THPT Yên Khánh",
          "THPT Chuyên Yên Khánh",
          "THCS Yên Khánh"
        ]
      },
      {
        "name": "Huyện Kim Sơn",
        "schools": [
          "THPT Kim Sơn",
          "THPT Chuyên Kim Sơn",
          "THCS Kim Sơn"
        ]
      },
      {
        "name": "Huyện Yên Mô",
        "schools": [
          "THPT Yên Mô",
          "THPT Chuyên Yên Mô",
          "THCS Yên Mô"
        ]
      }
    ]
  },
  {
    "id": "tinh_ninh_thuan",
    "name": "Tỉnh Ninh Thuận",
    "districts": [
      {
        "name": "Thành phố Phan Rang - Tháp Chàm",
        "schools": [
          "THPT Phan Rang - Tháp Chàm",
          "THPT Chuyên Phan Rang - Tháp Chàm",
          "THCS Phan Rang - Tháp Chàm"
        ]
      },
      {
        "name": "Huyện Bác Ái",
        "schools": [
          "THPT Bác Ái",
          "THPT Chuyên Bác Ái",
          "THCS Bác Ái"
        ]
      },
      {
        "name": "Huyện Ninh Sơn",
        "schools": [
          "THPT Ninh Sơn",
          "THPT Chuyên Ninh Sơn",
          "THCS Ninh Sơn"
        ]
      },
      {
        "name": "Huyện Ninh Hải",
        "schools": [
          "THPT Ninh Hải",
          "THPT Chuyên Ninh Hải",
          "THCS Ninh Hải"
        ]
      },
      {
        "name": "Huyện Ninh Phước",
        "schools": [
          "THPT Ninh Phước",
          "THPT Chuyên Ninh Phước",
          "THCS Ninh Phước"
        ]
      },
      {
        "name": "Huyện Thuận Bắc",
        "schools": [
          "THPT Thuận Bắc",
          "THPT Chuyên Thuận Bắc",
          "THCS Thuận Bắc"
        ]
      },
      {
        "name": "Huyện Thuận Nam",
        "schools": [
          "THPT Thuận Nam",
          "THPT Chuyên Thuận Nam",
          "THCS Thuận Nam"
        ]
      }
    ]
  },
  {
    "id": "tinh_phu_tho",
    "name": "Tỉnh Phú Thọ",
    "districts": [
      {
        "name": "Thành phố Việt Trì",
        "schools": [
          "THPT Việt Trì",
          "THPT Chuyên Việt Trì",
          "THCS Việt Trì"
        ]
      },
      {
        "name": "Thị xã Phú Thọ",
        "schools": [
          "THPT Phú Thọ",
          "THPT Chuyên Phú Thọ",
          "THCS Phú Thọ"
        ]
      },
      {
        "name": "Huyện Đoan Hùng",
        "schools": [
          "THPT Đoan Hùng",
          "THPT Chuyên Đoan Hùng",
          "THCS Đoan Hùng"
        ]
      },
      {
        "name": "Huyện Hạ Hoà",
        "schools": [
          "THPT Hạ Hoà",
          "THPT Chuyên Hạ Hoà",
          "THCS Hạ Hoà"
        ]
      },
      {
        "name": "Huyện Thanh Ba",
        "schools": [
          "THPT Thanh Ba",
          "THPT Chuyên Thanh Ba",
          "THCS Thanh Ba"
        ]
      },
      {
        "name": "Huyện Phù Ninh",
        "schools": [
          "THPT Phù Ninh",
          "THPT Chuyên Phù Ninh",
          "THCS Phù Ninh"
        ]
      },
      {
        "name": "Huyện Yên Lập",
        "schools": [
          "THPT Yên Lập",
          "THPT Chuyên Yên Lập",
          "THCS Yên Lập"
        ]
      },
      {
        "name": "Huyện Cẩm Khê",
        "schools": [
          "THPT Cẩm Khê",
          "THPT Chuyên Cẩm Khê",
          "THCS Cẩm Khê"
        ]
      },
      {
        "name": "Huyện Tam Nông",
        "schools": [
          "THPT Tam Nông",
          "THPT Chuyên Tam Nông",
          "THCS Tam Nông"
        ]
      },
      {
        "name": "Huyện Lâm Thao",
        "schools": [
          "THPT Lâm Thao",
          "THPT Chuyên Lâm Thao",
          "THCS Lâm Thao"
        ]
      },
      {
        "name": "Huyện Thanh Sơn",
        "schools": [
          "THPT Thanh Sơn",
          "THPT Chuyên Thanh Sơn",
          "THCS Thanh Sơn"
        ]
      },
      {
        "name": "Huyện Thanh Thuỷ",
        "schools": [
          "THPT Thanh Thuỷ",
          "THPT Chuyên Thanh Thuỷ",
          "THCS Thanh Thuỷ"
        ]
      },
      {
        "name": "Huyện Tân Sơn",
        "schools": [
          "THPT Tân Sơn",
          "THPT Chuyên Tân Sơn",
          "THCS Tân Sơn"
        ]
      }
    ]
  },
  {
    "id": "tinh_phu_yen",
    "name": "Tỉnh Phú Yên",
    "districts": [
      {
        "name": "Thành phố Tuy Hoà",
        "schools": [
          "THPT Tuy Hoà",
          "THPT Chuyên Tuy Hoà",
          "THCS Tuy Hoà"
        ]
      },
      {
        "name": "Thị xã Sông Cầu",
        "schools": [
          "THPT Sông Cầu",
          "THPT Chuyên Sông Cầu",
          "THCS Sông Cầu"
        ]
      },
      {
        "name": "Huyện Đồng Xuân",
        "schools": [
          "THPT Đồng Xuân",
          "THPT Chuyên Đồng Xuân",
          "THCS Đồng Xuân"
        ]
      },
      {
        "name": "Huyện Tuy An",
        "schools": [
          "THPT Tuy An",
          "THPT Chuyên Tuy An",
          "THCS Tuy An"
        ]
      },
      {
        "name": "Huyện Sơn Hòa",
        "schools": [
          "THPT Sơn Hòa",
          "THPT Chuyên Sơn Hòa",
          "THCS Sơn Hòa"
        ]
      },
      {
        "name": "Huyện Sông Hinh",
        "schools": [
          "THPT Sông Hinh",
          "THPT Chuyên Sông Hinh",
          "THCS Sông Hinh"
        ]
      },
      {
        "name": "Huyện Tây Hoà",
        "schools": [
          "THPT Tây Hoà",
          "THPT Chuyên Tây Hoà",
          "THCS Tây Hoà"
        ]
      },
      {
        "name": "Huyện Phú Hoà",
        "schools": [
          "THPT Phú Hoà",
          "THPT Chuyên Phú Hoà",
          "THCS Phú Hoà"
        ]
      },
      {
        "name": "Thị xã Đông Hòa",
        "schools": [
          "THPT Đông Hòa",
          "THPT Chuyên Đông Hòa",
          "THCS Đông Hòa"
        ]
      }
    ]
  },
  {
    "id": "tinh_quang_binh",
    "name": "Tỉnh Quảng Bình",
    "districts": [
      {
        "name": "Thành Phố Đồng Hới",
        "schools": [
          "THPT Thành Phố Đồng Hới",
          "THPT Chuyên Thành Phố Đồng Hới",
          "THCS Thành Phố Đồng Hới"
        ]
      },
      {
        "name": "Huyện Minh Hóa",
        "schools": [
          "THPT Minh Hóa",
          "THPT Chuyên Minh Hóa",
          "THCS Minh Hóa"
        ]
      },
      {
        "name": "Huyện Tuyên Hóa",
        "schools": [
          "THPT Tuyên Hóa",
          "THPT Chuyên Tuyên Hóa",
          "THCS Tuyên Hóa"
        ]
      },
      {
        "name": "Huyện Quảng Trạch",
        "schools": [
          "THPT Quảng Trạch",
          "THPT Chuyên Quảng Trạch",
          "THCS Quảng Trạch"
        ]
      },
      {
        "name": "Huyện Bố Trạch",
        "schools": [
          "THPT Bố Trạch",
          "THPT Chuyên Bố Trạch",
          "THCS Bố Trạch"
        ]
      },
      {
        "name": "Huyện Quảng Ninh",
        "schools": [
          "THPT Quảng Ninh",
          "THPT Chuyên Quảng Ninh",
          "THCS Quảng Ninh"
        ]
      },
      {
        "name": "Huyện Lệ Thủy",
        "schools": [
          "THPT Lệ Thủy",
          "THPT Chuyên Lệ Thủy",
          "THCS Lệ Thủy"
        ]
      },
      {
        "name": "Thị xã Ba Đồn",
        "schools": [
          "THPT Ba Đồn",
          "THPT Chuyên Ba Đồn",
          "THCS Ba Đồn"
        ]
      }
    ]
  },
  {
    "id": "tinh_quang_nam",
    "name": "Tỉnh Quảng Nam",
    "districts": [
      {
        "name": "Thành phố Tam Kỳ",
        "schools": [
          "THPT Tam Kỳ",
          "THPT Chuyên Tam Kỳ",
          "THCS Tam Kỳ"
        ]
      },
      {
        "name": "Thành phố Hội An",
        "schools": [
          "THPT Hội An",
          "THPT Chuyên Hội An",
          "THCS Hội An"
        ]
      },
      {
        "name": "Huyện Tây Giang",
        "schools": [
          "THPT Tây Giang",
          "THPT Chuyên Tây Giang",
          "THCS Tây Giang"
        ]
      },
      {
        "name": "Huyện Đông Giang",
        "schools": [
          "THPT Đông Giang",
          "THPT Chuyên Đông Giang",
          "THCS Đông Giang"
        ]
      },
      {
        "name": "Huyện Đại Lộc",
        "schools": [
          "THPT Đại Lộc",
          "THPT Chuyên Đại Lộc",
          "THCS Đại Lộc"
        ]
      },
      {
        "name": "Thị xã Điện Bàn",
        "schools": [
          "THPT Điện Bàn",
          "THPT Chuyên Điện Bàn",
          "THCS Điện Bàn"
        ]
      },
      {
        "name": "Huyện Duy Xuyên",
        "schools": [
          "THPT Duy Xuyên",
          "THPT Chuyên Duy Xuyên",
          "THCS Duy Xuyên"
        ]
      },
      {
        "name": "Huyện Quế Sơn",
        "schools": [
          "THPT Quế Sơn",
          "THPT Chuyên Quế Sơn",
          "THCS Quế Sơn"
        ]
      },
      {
        "name": "Huyện Nam Giang",
        "schools": [
          "THPT Nam Giang",
          "THPT Chuyên Nam Giang",
          "THCS Nam Giang"
        ]
      },
      {
        "name": "Huyện Phước Sơn",
        "schools": [
          "THPT Phước Sơn",
          "THPT Chuyên Phước Sơn",
          "THCS Phước Sơn"
        ]
      },
      {
        "name": "Huyện Hiệp Đức",
        "schools": [
          "THPT Hiệp Đức",
          "THPT Chuyên Hiệp Đức",
          "THCS Hiệp Đức"
        ]
      },
      {
        "name": "Huyện Thăng Bình",
        "schools": [
          "THPT Thăng Bình",
          "THPT Chuyên Thăng Bình",
          "THCS Thăng Bình"
        ]
      },
      {
        "name": "Huyện Tiên Phước",
        "schools": [
          "THPT Tiên Phước",
          "THPT Chuyên Tiên Phước",
          "THCS Tiên Phước"
        ]
      },
      {
        "name": "Huyện Bắc Trà My",
        "schools": [
          "THPT Bắc Trà My",
          "THPT Chuyên Bắc Trà My",
          "THCS Bắc Trà My"
        ]
      },
      {
        "name": "Huyện Nam Trà My",
        "schools": [
          "THPT Nam Trà My",
          "THPT Chuyên Nam Trà My",
          "THCS Nam Trà My"
        ]
      },
      {
        "name": "Huyện Núi Thành",
        "schools": [
          "THPT Núi Thành",
          "THPT Chuyên Núi Thành",
          "THCS Núi Thành"
        ]
      },
      {
        "name": "Huyện Phú Ninh",
        "schools": [
          "THPT Phú Ninh",
          "THPT Chuyên Phú Ninh",
          "THCS Phú Ninh"
        ]
      }
    ]
  },
  {
    "id": "tinh_quang_ngai",
    "name": "Tỉnh Quảng Ngãi",
    "districts": [
      {
        "name": "Thành phố Quảng Ngãi",
        "schools": [
          "THPT Quảng Ngãi",
          "THPT Chuyên Quảng Ngãi",
          "THCS Quảng Ngãi"
        ]
      },
      {
        "name": "Huyện Bình Sơn",
        "schools": [
          "THPT Bình Sơn",
          "THPT Chuyên Bình Sơn",
          "THCS Bình Sơn"
        ]
      },
      {
        "name": "Huyện Trà Bồng",
        "schools": [
          "THPT Trà Bồng",
          "THPT Chuyên Trà Bồng",
          "THCS Trà Bồng"
        ]
      },
      {
        "name": "Huyện Sơn Tịnh",
        "schools": [
          "THPT Sơn Tịnh",
          "THPT Chuyên Sơn Tịnh",
          "THCS Sơn Tịnh"
        ]
      },
      {
        "name": "Huyện Tư Nghĩa",
        "schools": [
          "THPT Tư Nghĩa",
          "THPT Chuyên Tư Nghĩa",
          "THCS Tư Nghĩa"
        ]
      },
      {
        "name": "Huyện Sơn Hà",
        "schools": [
          "THPT Sơn Hà",
          "THPT Chuyên Sơn Hà",
          "THCS Sơn Hà"
        ]
      },
      {
        "name": "Huyện Sơn Tây",
        "schools": [
          "THPT Sơn Tây",
          "THPT Chuyên Sơn Tây",
          "THCS Sơn Tây"
        ]
      },
      {
        "name": "Huyện Minh Long",
        "schools": [
          "THPT Minh Long",
          "THPT Chuyên Minh Long",
          "THCS Minh Long"
        ]
      },
      {
        "name": "Huyện Nghĩa Hành",
        "schools": [
          "THPT Nghĩa Hành",
          "THPT Chuyên Nghĩa Hành",
          "THCS Nghĩa Hành"
        ]
      },
      {
        "name": "Huyện Mộ Đức",
        "schools": [
          "THPT Mộ Đức",
          "THPT Chuyên Mộ Đức",
          "THCS Mộ Đức"
        ]
      },
      {
        "name": "Thị xã Đức Phổ",
        "schools": [
          "THPT Đức Phổ",
          "THPT Chuyên Đức Phổ",
          "THCS Đức Phổ"
        ]
      },
      {
        "name": "Huyện Ba Tơ",
        "schools": [
          "THPT Ba Tơ",
          "THPT Chuyên Ba Tơ",
          "THCS Ba Tơ"
        ]
      },
      {
        "name": "Huyện Lý Sơn",
        "schools": [
          "THPT Lý Sơn",
          "THPT Chuyên Lý Sơn",
          "THCS Lý Sơn"
        ]
      }
    ]
  },
  {
    "id": "tinh_quang_ninh",
    "name": "Tỉnh Quảng Ninh",
    "districts": [
      {
        "name": "Thành phố Hạ Long",
        "schools": [
          "THPT Hạ Long",
          "THPT Chuyên Hạ Long",
          "THCS Hạ Long"
        ]
      },
      {
        "name": "Thành phố Móng Cái",
        "schools": [
          "THPT Móng Cái",
          "THPT Chuyên Móng Cái",
          "THCS Móng Cái"
        ]
      },
      {
        "name": "Thành phố Cẩm Phả",
        "schools": [
          "THPT Cẩm Phả",
          "THPT Chuyên Cẩm Phả",
          "THCS Cẩm Phả"
        ]
      },
      {
        "name": "Thành phố Uông Bí",
        "schools": [
          "THPT Uông Bí",
          "THPT Chuyên Uông Bí",
          "THCS Uông Bí"
        ]
      },
      {
        "name": "Huyện Bình Liêu",
        "schools": [
          "THPT Bình Liêu",
          "THPT Chuyên Bình Liêu",
          "THCS Bình Liêu"
        ]
      },
      {
        "name": "Huyện Tiên Yên",
        "schools": [
          "THPT Tiên Yên",
          "THPT Chuyên Tiên Yên",
          "THCS Tiên Yên"
        ]
      },
      {
        "name": "Huyện Đầm Hà",
        "schools": [
          "THPT Đầm Hà",
          "THPT Chuyên Đầm Hà",
          "THCS Đầm Hà"
        ]
      },
      {
        "name": "Huyện Hải Hà",
        "schools": [
          "THPT Hải Hà",
          "THPT Chuyên Hải Hà",
          "THCS Hải Hà"
        ]
      },
      {
        "name": "Huyện Ba Chẽ",
        "schools": [
          "THPT Ba Chẽ",
          "THPT Chuyên Ba Chẽ",
          "THCS Ba Chẽ"
        ]
      },
      {
        "name": "Huyện Vân Đồn",
        "schools": [
          "THPT Vân Đồn",
          "THPT Chuyên Vân Đồn",
          "THCS Vân Đồn"
        ]
      },
      {
        "name": "Thành phố Đông Triều",
        "schools": [
          "THPT Đông Triều",
          "THPT Chuyên Đông Triều",
          "THCS Đông Triều"
        ]
      },
      {
        "name": "Thị xã Quảng Yên",
        "schools": [
          "THPT Quảng Yên",
          "THPT Chuyên Quảng Yên",
          "THCS Quảng Yên"
        ]
      },
      {
        "name": "Huyện Cô Tô",
        "schools": [
          "THPT Cô Tô",
          "THPT Chuyên Cô Tô",
          "THCS Cô Tô"
        ]
      }
    ]
  },
  {
    "id": "tinh_quang_tri",
    "name": "Tỉnh Quảng Trị",
    "districts": [
      {
        "name": "Thành phố Đông Hà",
        "schools": [
          "THPT Đông Hà",
          "THPT Chuyên Đông Hà",
          "THCS Đông Hà"
        ]
      },
      {
        "name": "Thị xã Quảng Trị",
        "schools": [
          "THPT Quảng Trị",
          "THPT Chuyên Quảng Trị",
          "THCS Quảng Trị"
        ]
      },
      {
        "name": "Huyện Vĩnh Linh",
        "schools": [
          "THPT Vĩnh Linh",
          "THPT Chuyên Vĩnh Linh",
          "THCS Vĩnh Linh"
        ]
      },
      {
        "name": "Huyện Hướng Hóa",
        "schools": [
          "THPT Hướng Hóa",
          "THPT Chuyên Hướng Hóa",
          "THCS Hướng Hóa"
        ]
      },
      {
        "name": "Huyện Gio Linh",
        "schools": [
          "THPT Gio Linh",
          "THPT Chuyên Gio Linh",
          "THCS Gio Linh"
        ]
      },
      {
        "name": "Huyện Đa Krông",
        "schools": [
          "THPT Đa Krông",
          "THPT Chuyên Đa Krông",
          "THCS Đa Krông"
        ]
      },
      {
        "name": "Huyện Cam Lộ",
        "schools": [
          "THPT Cam Lộ",
          "THPT Chuyên Cam Lộ",
          "THCS Cam Lộ"
        ]
      },
      {
        "name": "Huyện Triệu Phong",
        "schools": [
          "THPT Triệu Phong",
          "THPT Chuyên Triệu Phong",
          "THCS Triệu Phong"
        ]
      },
      {
        "name": "Huyện Hải Lăng",
        "schools": [
          "THPT Hải Lăng",
          "THPT Chuyên Hải Lăng",
          "THCS Hải Lăng"
        ]
      },
      {
        "name": "Huyện Cồn Cỏ",
        "schools": [
          "THPT Cồn Cỏ",
          "THPT Chuyên Cồn Cỏ",
          "THCS Cồn Cỏ"
        ]
      }
    ]
  },
  {
    "id": "tinh_soc_trang",
    "name": "Tỉnh Sóc Trăng",
    "districts": [
      {
        "name": "Thành phố Sóc Trăng",
        "schools": [
          "THPT Sóc Trăng",
          "THPT Chuyên Sóc Trăng",
          "THCS Sóc Trăng"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Kế Sách",
        "schools": [
          "THPT Kế Sách",
          "THPT Chuyên Kế Sách",
          "THCS Kế Sách"
        ]
      },
      {
        "name": "Huyện Mỹ Tú",
        "schools": [
          "THPT Mỹ Tú",
          "THPT Chuyên Mỹ Tú",
          "THCS Mỹ Tú"
        ]
      },
      {
        "name": "Huyện Cù Lao Dung",
        "schools": [
          "THPT Cù Lao Dung",
          "THPT Chuyên Cù Lao Dung",
          "THCS Cù Lao Dung"
        ]
      },
      {
        "name": "Huyện Long Phú",
        "schools": [
          "THPT Long Phú",
          "THPT Chuyên Long Phú",
          "THCS Long Phú"
        ]
      },
      {
        "name": "Huyện Mỹ Xuyên",
        "schools": [
          "THPT Mỹ Xuyên",
          "THPT Chuyên Mỹ Xuyên",
          "THCS Mỹ Xuyên"
        ]
      },
      {
        "name": "Thị xã Ngã Năm",
        "schools": [
          "THPT Ngã Năm",
          "THPT Chuyên Ngã Năm",
          "THCS Ngã Năm"
        ]
      },
      {
        "name": "Huyện Thạnh Trị",
        "schools": [
          "THPT Thạnh Trị",
          "THPT Chuyên Thạnh Trị",
          "THCS Thạnh Trị"
        ]
      },
      {
        "name": "Thị xã Vĩnh Châu",
        "schools": [
          "THPT Vĩnh Châu",
          "THPT Chuyên Vĩnh Châu",
          "THCS Vĩnh Châu"
        ]
      },
      {
        "name": "Huyện Trần Đề",
        "schools": [
          "THPT Trần Đề",
          "THPT Chuyên Trần Đề",
          "THCS Trần Đề"
        ]
      }
    ]
  },
  {
    "id": "tinh_son_la",
    "name": "Tỉnh Sơn La",
    "districts": [
      {
        "name": "Thành phố Sơn La",
        "schools": [
          "THPT Sơn La",
          "THPT Chuyên Sơn La",
          "THCS Sơn La"
        ]
      },
      {
        "name": "Huyện Quỳnh Nhai",
        "schools": [
          "THPT Quỳnh Nhai",
          "THPT Chuyên Quỳnh Nhai",
          "THCS Quỳnh Nhai"
        ]
      },
      {
        "name": "Huyện Thuận Châu",
        "schools": [
          "THPT Thuận Châu",
          "THPT Chuyên Thuận Châu",
          "THCS Thuận Châu"
        ]
      },
      {
        "name": "Huyện Mường La",
        "schools": [
          "THPT Mường La",
          "THPT Chuyên Mường La",
          "THCS Mường La"
        ]
      },
      {
        "name": "Huyện Bắc Yên",
        "schools": [
          "THPT Bắc Yên",
          "THPT Chuyên Bắc Yên",
          "THCS Bắc Yên"
        ]
      },
      {
        "name": "Huyện Phù Yên",
        "schools": [
          "THPT Phù Yên",
          "THPT Chuyên Phù Yên",
          "THCS Phù Yên"
        ]
      },
      {
        "name": "Huyện Mộc Châu",
        "schools": [
          "THPT Mộc Châu",
          "THPT Chuyên Mộc Châu",
          "THCS Mộc Châu"
        ]
      },
      {
        "name": "Huyện Yên Châu",
        "schools": [
          "THPT Yên Châu",
          "THPT Chuyên Yên Châu",
          "THCS Yên Châu"
        ]
      },
      {
        "name": "Huyện Mai Sơn",
        "schools": [
          "THPT Mai Sơn",
          "THPT Chuyên Mai Sơn",
          "THCS Mai Sơn"
        ]
      },
      {
        "name": "Huyện Sông Mã",
        "schools": [
          "THPT Sông Mã",
          "THPT Chuyên Sông Mã",
          "THCS Sông Mã"
        ]
      },
      {
        "name": "Huyện Sốp Cộp",
        "schools": [
          "THPT Sốp Cộp",
          "THPT Chuyên Sốp Cộp",
          "THCS Sốp Cộp"
        ]
      },
      {
        "name": "Huyện Vân Hồ",
        "schools": [
          "THPT Vân Hồ",
          "THPT Chuyên Vân Hồ",
          "THCS Vân Hồ"
        ]
      }
    ]
  },
  {
    "id": "tinh_tay_ninh",
    "name": "Tỉnh Tây Ninh",
    "districts": [
      {
        "name": "Thành phố Tây Ninh",
        "schools": [
          "THPT Tây Ninh",
          "THPT Chuyên Tây Ninh",
          "THCS Tây Ninh"
        ]
      },
      {
        "name": "Huyện Tân Biên",
        "schools": [
          "THPT Tân Biên",
          "THPT Chuyên Tân Biên",
          "THCS Tân Biên"
        ]
      },
      {
        "name": "Huyện Tân Châu",
        "schools": [
          "THPT Tân Châu",
          "THPT Chuyên Tân Châu",
          "THCS Tân Châu"
        ]
      },
      {
        "name": "Huyện Dương Minh Châu",
        "schools": [
          "THPT Dương Minh Châu",
          "THPT Chuyên Dương Minh Châu",
          "THCS Dương Minh Châu"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Thị xã Hòa Thành",
        "schools": [
          "THPT Hòa Thành",
          "THPT Chuyên Hòa Thành",
          "THCS Hòa Thành"
        ]
      },
      {
        "name": "Huyện Gò Dầu",
        "schools": [
          "THPT Gò Dầu",
          "THPT Chuyên Gò Dầu",
          "THCS Gò Dầu"
        ]
      },
      {
        "name": "Huyện Bến Cầu",
        "schools": [
          "THPT Bến Cầu",
          "THPT Chuyên Bến Cầu",
          "THCS Bến Cầu"
        ]
      },
      {
        "name": "Thị xã Trảng Bàng",
        "schools": [
          "THPT Trảng Bàng",
          "THPT Chuyên Trảng Bàng",
          "THCS Trảng Bàng"
        ]
      }
    ]
  },
  {
    "id": "tinh_thai_binh",
    "name": "Tỉnh Thái Bình",
    "districts": [
      {
        "name": "Thành phố Thái Bình",
        "schools": [
          "THPT Thái Bình",
          "THPT Chuyên Thái Bình",
          "THCS Thái Bình"
        ]
      },
      {
        "name": "Huyện Quỳnh Phụ",
        "schools": [
          "THPT Quỳnh Phụ",
          "THPT Chuyên Quỳnh Phụ",
          "THCS Quỳnh Phụ"
        ]
      },
      {
        "name": "Huyện Hưng Hà",
        "schools": [
          "THPT Hưng Hà",
          "THPT Chuyên Hưng Hà",
          "THCS Hưng Hà"
        ]
      },
      {
        "name": "Huyện Đông Hưng",
        "schools": [
          "THPT Đông Hưng",
          "THPT Chuyên Đông Hưng",
          "THCS Đông Hưng"
        ]
      },
      {
        "name": "Huyện Thái Thụy",
        "schools": [
          "THPT Thái Thụy",
          "THPT Chuyên Thái Thụy",
          "THCS Thái Thụy"
        ]
      },
      {
        "name": "Huyện Tiền Hải",
        "schools": [
          "THPT Tiền Hải",
          "THPT Chuyên Tiền Hải",
          "THCS Tiền Hải"
        ]
      },
      {
        "name": "Huyện Kiến Xương",
        "schools": [
          "THPT Kiến Xương",
          "THPT Chuyên Kiến Xương",
          "THCS Kiến Xương"
        ]
      },
      {
        "name": "Huyện Vũ Thư",
        "schools": [
          "THPT Vũ Thư",
          "THPT Chuyên Vũ Thư",
          "THCS Vũ Thư"
        ]
      }
    ]
  },
  {
    "id": "tinh_thai_nguyen",
    "name": "Tỉnh Thái Nguyên",
    "districts": [
      {
        "name": "Thành phố Thái Nguyên",
        "schools": [
          "THPT Thái Nguyên",
          "THPT Chuyên Thái Nguyên",
          "THCS Thái Nguyên"
        ]
      },
      {
        "name": "Thành phố Sông Công",
        "schools": [
          "THPT Sông Công",
          "THPT Chuyên Sông Công",
          "THCS Sông Công"
        ]
      },
      {
        "name": "Huyện Định Hóa",
        "schools": [
          "THPT Định Hóa",
          "THPT Chuyên Định Hóa",
          "THCS Định Hóa"
        ]
      },
      {
        "name": "Huyện Phú Lương",
        "schools": [
          "THPT Phú Lương",
          "THPT Chuyên Phú Lương",
          "THCS Phú Lương"
        ]
      },
      {
        "name": "Huyện Đồng Hỷ",
        "schools": [
          "THPT Đồng Hỷ",
          "THPT Chuyên Đồng Hỷ",
          "THCS Đồng Hỷ"
        ]
      },
      {
        "name": "Huyện Võ Nhai",
        "schools": [
          "THPT Võ Nhai",
          "THPT Chuyên Võ Nhai",
          "THCS Võ Nhai"
        ]
      },
      {
        "name": "Huyện Đại Từ",
        "schools": [
          "THPT Đại Từ",
          "THPT Chuyên Đại Từ",
          "THCS Đại Từ"
        ]
      },
      {
        "name": "Thành phố Phổ Yên",
        "schools": [
          "THPT Phổ Yên",
          "THPT Chuyên Phổ Yên",
          "THCS Phổ Yên"
        ]
      },
      {
        "name": "Huyện Phú Bình",
        "schools": [
          "THPT Phú Bình",
          "THPT Chuyên Phú Bình",
          "THCS Phú Bình"
        ]
      }
    ]
  },
  {
    "id": "tinh_thanh_hoa",
    "name": "Tỉnh Thanh Hóa",
    "districts": [
      {
        "name": "Thành phố Thanh Hóa",
        "schools": [
          "THPT Thanh Hóa",
          "THPT Chuyên Thanh Hóa",
          "THCS Thanh Hóa"
        ]
      },
      {
        "name": "Thị xã Bỉm Sơn",
        "schools": [
          "THPT Bỉm Sơn",
          "THPT Chuyên Bỉm Sơn",
          "THCS Bỉm Sơn"
        ]
      },
      {
        "name": "Thành phố Sầm Sơn",
        "schools": [
          "THPT Sầm Sơn",
          "THPT Chuyên Sầm Sơn",
          "THCS Sầm Sơn"
        ]
      },
      {
        "name": "Huyện Mường Lát",
        "schools": [
          "THPT Mường Lát",
          "THPT Chuyên Mường Lát",
          "THCS Mường Lát"
        ]
      },
      {
        "name": "Huyện Quan Hóa",
        "schools": [
          "THPT Quan Hóa",
          "THPT Chuyên Quan Hóa",
          "THCS Quan Hóa"
        ]
      },
      {
        "name": "Huyện Bá Thước",
        "schools": [
          "THPT Bá Thước",
          "THPT Chuyên Bá Thước",
          "THCS Bá Thước"
        ]
      },
      {
        "name": "Huyện Quan Sơn",
        "schools": [
          "THPT Quan Sơn",
          "THPT Chuyên Quan Sơn",
          "THCS Quan Sơn"
        ]
      },
      {
        "name": "Huyện Lang Chánh",
        "schools": [
          "THPT Lang Chánh",
          "THPT Chuyên Lang Chánh",
          "THCS Lang Chánh"
        ]
      },
      {
        "name": "Huyện Ngọc Lặc",
        "schools": [
          "THPT Ngọc Lặc",
          "THPT Chuyên Ngọc Lặc",
          "THCS Ngọc Lặc"
        ]
      },
      {
        "name": "Huyện Cẩm Thủy",
        "schools": [
          "THPT Cẩm Thủy",
          "THPT Chuyên Cẩm Thủy",
          "THCS Cẩm Thủy"
        ]
      },
      {
        "name": "Huyện Thạch Thành",
        "schools": [
          "THPT Thạch Thành",
          "THPT Chuyên Thạch Thành",
          "THCS Thạch Thành"
        ]
      },
      {
        "name": "Huyện Hà Trung",
        "schools": [
          "THPT Hà Trung",
          "THPT Chuyên Hà Trung",
          "THCS Hà Trung"
        ]
      },
      {
        "name": "Huyện Vĩnh Lộc",
        "schools": [
          "THPT Vĩnh Lộc",
          "THPT Chuyên Vĩnh Lộc",
          "THCS Vĩnh Lộc"
        ]
      },
      {
        "name": "Huyện Yên Định",
        "schools": [
          "THPT Yên Định",
          "THPT Chuyên Yên Định",
          "THCS Yên Định"
        ]
      },
      {
        "name": "Huyện Thọ Xuân",
        "schools": [
          "THPT Thọ Xuân",
          "THPT Chuyên Thọ Xuân",
          "THCS Thọ Xuân"
        ]
      },
      {
        "name": "Huyện Thường Xuân",
        "schools": [
          "THPT Thường Xuân",
          "THPT Chuyên Thường Xuân",
          "THCS Thường Xuân"
        ]
      },
      {
        "name": "Huyện Triệu Sơn",
        "schools": [
          "THPT Triệu Sơn",
          "THPT Chuyên Triệu Sơn",
          "THCS Triệu Sơn"
        ]
      },
      {
        "name": "Huyện Thiệu Hóa",
        "schools": [
          "THPT Thiệu Hóa",
          "THPT Chuyên Thiệu Hóa",
          "THCS Thiệu Hóa"
        ]
      },
      {
        "name": "Huyện Hoằng Hóa",
        "schools": [
          "THPT Hoằng Hóa",
          "THPT Chuyên Hoằng Hóa",
          "THCS Hoằng Hóa"
        ]
      },
      {
        "name": "Huyện Hậu Lộc",
        "schools": [
          "THPT Hậu Lộc",
          "THPT Chuyên Hậu Lộc",
          "THCS Hậu Lộc"
        ]
      },
      {
        "name": "Huyện Nga Sơn",
        "schools": [
          "THPT Nga Sơn",
          "THPT Chuyên Nga Sơn",
          "THCS Nga Sơn"
        ]
      },
      {
        "name": "Huyện Như Xuân",
        "schools": [
          "THPT Như Xuân",
          "THPT Chuyên Như Xuân",
          "THCS Như Xuân"
        ]
      },
      {
        "name": "Huyện Như Thanh",
        "schools": [
          "THPT Như Thanh",
          "THPT Chuyên Như Thanh",
          "THCS Như Thanh"
        ]
      },
      {
        "name": "Huyện Nông Cống",
        "schools": [
          "THPT Nông Cống",
          "THPT Chuyên Nông Cống",
          "THCS Nông Cống"
        ]
      },
      {
        "name": "Huyện Quảng Xương",
        "schools": [
          "THPT Quảng Xương",
          "THPT Chuyên Quảng Xương",
          "THCS Quảng Xương"
        ]
      },
      {
        "name": "Thị xã Nghi Sơn",
        "schools": [
          "THPT Nghi Sơn",
          "THPT Chuyên Nghi Sơn",
          "THCS Nghi Sơn"
        ]
      }
    ]
  },
  {
    "id": "tinh_tien_giang",
    "name": "Tỉnh Tiền Giang",
    "districts": [
      {
        "name": "Thành phố Mỹ Tho",
        "schools": [
          "THPT Mỹ Tho",
          "THPT Chuyên Mỹ Tho",
          "THCS Mỹ Tho"
        ]
      },
      {
        "name": "Thành phố Gò Công",
        "schools": [
          "THPT Gò Công",
          "THPT Chuyên Gò Công",
          "THCS Gò Công"
        ]
      },
      {
        "name": "Thị xã Cai Lậy",
        "schools": [
          "THPT Cai Lậy",
          "THPT Chuyên Cai Lậy",
          "THCS Cai Lậy"
        ]
      },
      {
        "name": "Huyện Tân Phước",
        "schools": [
          "THPT Tân Phước",
          "THPT Chuyên Tân Phước",
          "THCS Tân Phước"
        ]
      },
      {
        "name": "Huyện Cái Bè",
        "schools": [
          "THPT Cái Bè",
          "THPT Chuyên Cái Bè",
          "THCS Cái Bè"
        ]
      },
      {
        "name": "Huyện Cai Lậy",
        "schools": [
          "THPT Cai Lậy",
          "THPT Chuyên Cai Lậy",
          "THCS Cai Lậy"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Chợ Gạo",
        "schools": [
          "THPT Chợ Gạo",
          "THPT Chuyên Chợ Gạo",
          "THCS Chợ Gạo"
        ]
      },
      {
        "name": "Huyện Gò Công Tây",
        "schools": [
          "THPT Gò Công Tây",
          "THPT Chuyên Gò Công Tây",
          "THCS Gò Công Tây"
        ]
      },
      {
        "name": "Huyện Gò Công Đông",
        "schools": [
          "THPT Gò Công Đông",
          "THPT Chuyên Gò Công Đông",
          "THCS Gò Công Đông"
        ]
      },
      {
        "name": "Huyện Tân Phú Đông",
        "schools": [
          "THPT Tân Phú Đông",
          "THPT Chuyên Tân Phú Đông",
          "THCS Tân Phú Đông"
        ]
      }
    ]
  },
  {
    "id": "tinh_tra_vinh",
    "name": "Tỉnh Trà Vinh",
    "districts": [
      {
        "name": "Thành phố Trà Vinh",
        "schools": [
          "THPT Trà Vinh",
          "THPT Chuyên Trà Vinh",
          "THCS Trà Vinh"
        ]
      },
      {
        "name": "Huyện Càng Long",
        "schools": [
          "THPT Càng Long",
          "THPT Chuyên Càng Long",
          "THCS Càng Long"
        ]
      },
      {
        "name": "Huyện Cầu Kè",
        "schools": [
          "THPT Cầu Kè",
          "THPT Chuyên Cầu Kè",
          "THCS Cầu Kè"
        ]
      },
      {
        "name": "Huyện Tiểu Cần",
        "schools": [
          "THPT Tiểu Cần",
          "THPT Chuyên Tiểu Cần",
          "THCS Tiểu Cần"
        ]
      },
      {
        "name": "Huyện Châu Thành",
        "schools": [
          "THPT Châu Thành",
          "THPT Chuyên Châu Thành",
          "THCS Châu Thành"
        ]
      },
      {
        "name": "Huyện Cầu Ngang",
        "schools": [
          "THPT Cầu Ngang",
          "THPT Chuyên Cầu Ngang",
          "THCS Cầu Ngang"
        ]
      },
      {
        "name": "Huyện Trà Cú",
        "schools": [
          "THPT Trà Cú",
          "THPT Chuyên Trà Cú",
          "THCS Trà Cú"
        ]
      },
      {
        "name": "Huyện Duyên Hải",
        "schools": [
          "THPT Duyên Hải",
          "THPT Chuyên Duyên Hải",
          "THCS Duyên Hải"
        ]
      },
      {
        "name": "Thị xã Duyên Hải",
        "schools": [
          "THPT Duyên Hải",
          "THPT Chuyên Duyên Hải",
          "THCS Duyên Hải"
        ]
      }
    ]
  },
  {
    "id": "tinh_tuyen_quang",
    "name": "Tỉnh Tuyên Quang",
    "districts": [
      {
        "name": "Thành phố Tuyên Quang",
        "schools": [
          "THPT Tuyên Quang",
          "THPT Chuyên Tuyên Quang",
          "THCS Tuyên Quang"
        ]
      },
      {
        "name": "Huyện Lâm Bình",
        "schools": [
          "THPT Lâm Bình",
          "THPT Chuyên Lâm Bình",
          "THCS Lâm Bình"
        ]
      },
      {
        "name": "Huyện Na Hang",
        "schools": [
          "THPT Na Hang",
          "THPT Chuyên Na Hang",
          "THCS Na Hang"
        ]
      },
      {
        "name": "Huyện Chiêm Hóa",
        "schools": [
          "THPT Chiêm Hóa",
          "THPT Chuyên Chiêm Hóa",
          "THCS Chiêm Hóa"
        ]
      },
      {
        "name": "Huyện Hàm Yên",
        "schools": [
          "THPT Hàm Yên",
          "THPT Chuyên Hàm Yên",
          "THCS Hàm Yên"
        ]
      },
      {
        "name": "Huyện Yên Sơn",
        "schools": [
          "THPT Yên Sơn",
          "THPT Chuyên Yên Sơn",
          "THCS Yên Sơn"
        ]
      },
      {
        "name": "Huyện Sơn Dương",
        "schools": [
          "THPT Sơn Dương",
          "THPT Chuyên Sơn Dương",
          "THCS Sơn Dương"
        ]
      }
    ]
  },
  {
    "id": "tinh_vinh_long",
    "name": "Tỉnh Vĩnh Long",
    "districts": [
      {
        "name": "Thành phố Vĩnh Long",
        "schools": [
          "THPT Vĩnh Long",
          "THPT Chuyên Vĩnh Long",
          "THCS Vĩnh Long"
        ]
      },
      {
        "name": "Huyện Long Hồ",
        "schools": [
          "THPT Long Hồ",
          "THPT Chuyên Long Hồ",
          "THCS Long Hồ"
        ]
      },
      {
        "name": "Huyện Mang Thít",
        "schools": [
          "THPT Mang Thít",
          "THPT Chuyên Mang Thít",
          "THCS Mang Thít"
        ]
      },
      {
        "name": "Huyện Vũng Liêm",
        "schools": [
          "THPT Vũng Liêm",
          "THPT Chuyên Vũng Liêm",
          "THCS Vũng Liêm"
        ]
      },
      {
        "name": "Huyện Tam Bình",
        "schools": [
          "THPT Tam Bình",
          "THPT Chuyên Tam Bình",
          "THCS Tam Bình"
        ]
      },
      {
        "name": "Thị xã Bình Minh",
        "schools": [
          "THPT Bình Minh",
          "THPT Chuyên Bình Minh",
          "THCS Bình Minh"
        ]
      },
      {
        "name": "Huyện Trà Ôn",
        "schools": [
          "THPT Trà Ôn",
          "THPT Chuyên Trà Ôn",
          "THCS Trà Ôn"
        ]
      },
      {
        "name": "Huyện Bình Tân",
        "schools": [
          "THPT Bình Tân",
          "THPT Chuyên Bình Tân",
          "THCS Bình Tân"
        ]
      }
    ]
  },
  {
    "id": "tinh_vinh_phuc",
    "name": "Tỉnh Vĩnh Phúc",
    "districts": [
      {
        "name": "Thành phố Vĩnh Yên",
        "schools": [
          "THPT Vĩnh Yên",
          "THPT Chuyên Vĩnh Yên",
          "THCS Vĩnh Yên"
        ]
      },
      {
        "name": "Thành phố Phúc Yên",
        "schools": [
          "THPT Phúc Yên",
          "THPT Chuyên Phúc Yên",
          "THCS Phúc Yên"
        ]
      },
      {
        "name": "Huyện Lập Thạch",
        "schools": [
          "THPT Lập Thạch",
          "THPT Chuyên Lập Thạch",
          "THCS Lập Thạch"
        ]
      },
      {
        "name": "Huyện Tam Dương",
        "schools": [
          "THPT Tam Dương",
          "THPT Chuyên Tam Dương",
          "THCS Tam Dương"
        ]
      },
      {
        "name": "Huyện Tam Đảo",
        "schools": [
          "THPT Tam Đảo",
          "THPT Chuyên Tam Đảo",
          "THCS Tam Đảo"
        ]
      },
      {
        "name": "Huyện Bình Xuyên",
        "schools": [
          "THPT Bình Xuyên",
          "THPT Chuyên Bình Xuyên",
          "THCS Bình Xuyên"
        ]
      },
      {
        "name": "Huyện Yên Lạc",
        "schools": [
          "THPT Yên Lạc",
          "THPT Chuyên Yên Lạc",
          "THCS Yên Lạc"
        ]
      },
      {
        "name": "Huyện Vĩnh Tường",
        "schools": [
          "THPT Vĩnh Tường",
          "THPT Chuyên Vĩnh Tường",
          "THCS Vĩnh Tường"
        ]
      },
      {
        "name": "Huyện Sông Lô",
        "schools": [
          "THPT Sông Lô",
          "THPT Chuyên Sông Lô",
          "THCS Sông Lô"
        ]
      }
    ]
  },
  {
    "id": "tinh_yen_bai",
    "name": "Tỉnh Yên Bái",
    "districts": [
      {
        "name": "Thành phố Yên Bái",
        "schools": [
          "THPT Yên Bái",
          "THPT Chuyên Yên Bái",
          "THCS Yên Bái"
        ]
      },
      {
        "name": "Thị xã Nghĩa Lộ",
        "schools": [
          "THPT Nghĩa Lộ",
          "THPT Chuyên Nghĩa Lộ",
          "THCS Nghĩa Lộ"
        ]
      },
      {
        "name": "Huyện Lục Yên",
        "schools": [
          "THPT Lục Yên",
          "THPT Chuyên Lục Yên",
          "THCS Lục Yên"
        ]
      },
      {
        "name": "Huyện Văn Yên",
        "schools": [
          "THPT Văn Yên",
          "THPT Chuyên Văn Yên",
          "THCS Văn Yên"
        ]
      },
      {
        "name": "Huyện Mù Căng Chải",
        "schools": [
          "THPT Mù Căng Chải",
          "THPT Chuyên Mù Căng Chải",
          "THCS Mù Căng Chải"
        ]
      },
      {
        "name": "Huyện Trấn Yên",
        "schools": [
          "THPT Trấn Yên",
          "THPT Chuyên Trấn Yên",
          "THCS Trấn Yên"
        ]
      },
      {
        "name": "Huyện Trạm Tấu",
        "schools": [
          "THPT Trạm Tấu",
          "THPT Chuyên Trạm Tấu",
          "THCS Trạm Tấu"
        ]
      },
      {
        "name": "Huyện Văn Chấn",
        "schools": [
          "THPT Văn Chấn",
          "THPT Chuyên Văn Chấn",
          "THCS Văn Chấn"
        ]
      },
      {
        "name": "Huyện Yên Bình",
        "schools": [
          "THPT Yên Bình",
          "THPT Chuyên Yên Bình",
          "THCS Yên Bình"
        ]
      }
    ]
  }
];
