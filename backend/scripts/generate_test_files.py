import os
from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.util import Inches, Pt

output_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "test_fixtures")
os.makedirs(output_dir, exist_ok=True)

# 1. Tạo file_2_scanned_image.pdf (ảnh chứa text tiếng Việt, không có text layer)
img = Image.new("RGB", (1200, 800), color=(255, 255, 255))
draw = ImageDraw.Draw(img)

# Thử dùng font mặc định hoặc arial
text_lines = [
    "CHỦ NGHĨA DUY VẬT BIỆN CHỨNG VÀ PHÉP BIỆN CHỨNG",
    "Vật chất là một phạm trù triết học dùng để chỉ thực tại khách quan.",
    "Ý thức là sự phản ánh thế giới khách quan vào bộ óc con người một cách năng động sáng tạo.",
    "Quy luật lượng chất: Sự thay đổi về lượng dẫn đến sự thay đổi về chất và ngược lại.",
    "Khái niệm Độ, Điểm nút và Bước nhảy là các phạm trù cơ bản của quy luật này."
]

y = 100
for line in text_lines:
    draw.text((100, y), line, fill=(0, 0, 0))
    y += 80

scanned_pdf_path = os.path.join(output_dir, "file_2_scanned_image.pdf")
img.save(scanned_pdf_path, "PDF", resolution=150.0)
print(f"Generated: {scanned_pdf_path}")

# 2. Tạo file_3_presentation.pptx (slide PPTX thật)
prs = Presentation()
slide_layout = prs.slide_layouts[1] # Title and Content

# Slide 1
slide1 = prs.slides.add_slide(slide_layout)
slide1.shapes.title.text = "Tổng quan về Điện toán đám mây (Cloud Computing)"
tf1 = slide1.shapes.placeholders[1].text_frame
tf1.text = "Điện toán đám mây là mô hình cung cấp tài nguyên điện toán qua Internet theo yêu cầu."
p1 = tf1.add_paragraph()
p1.text = "Người dùng không cần quản lý phần cứng vật lý trực tiếp, thanh toán theo mức độ sử dụng."

# Slide 2
slide2 = prs.slides.add_slide(slide_layout)
slide2.shapes.title.text = "Các mô hình dịch vụ đám mây cốt lõi"
tf2 = slide2.shapes.placeholders[1].text_frame
tf2.text = "1. IaaS (Infrastructure as a Service): Cung cấp máy chủ ảo, lưu trữ, mạng (vd: AWS EC2, GCP Compute Engine)."
p2 = tf2.add_paragraph()
p2.text = "2. PaaS (Platform as a Service): Nền tảng phát triển và triển khai ứng dụng (vd: Heroku, Google App Engine)."
p3 = tf2.add_paragraph()
p3.text = "3. SaaS (Software as a Service): Ứng dụng hoàn chỉnh sẵn sàng phục vụ người dùng cuối (vd: Gmail, Office 365)."

# Slide 3
slide3 = prs.slides.add_slide(slide_layout)
slide3.shapes.title.text = "Lợi ích và Thách thức bảo mật"
tf3 = slide3.shapes.placeholders[1].text_frame
tf3.text = "Ưu điểm: Khả năng co giãn linh hoạt (scalability), độ tin cậy cao, tiết kiệm chi phí đầu tư ban đầu."
p4 = tf3.add_paragraph()
p4.text = "Thách thức: Quyền riêng tư dữ liệu, tuân thủ pháp lý, phụ thuộc vào nhà cung cấp (vendor lock-in)."

pptx_path = os.path.join(output_dir, "file_3_presentation.pptx")
prs.save(pptx_path)
print(f"Generated: {pptx_path}")

# 3. Copy file_1_text_layer.pdf từ uploads
src_pdf = os.path.join(os.path.dirname(__file__), "..", "uploads", "1781875267332-666955481.pdf")
dst_pdf = os.path.join(output_dir, "file_1_text_layer.pdf")
if os.path.exists(src_pdf):
    with open(src_pdf, "rb") as f_in, open(dst_pdf, "wb") as f_out:
        f_out.write(f_in.read())
    print(f"Copied: {dst_pdf}")
