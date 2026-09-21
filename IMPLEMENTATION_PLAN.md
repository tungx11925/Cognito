Cognito là một nền tảng học tập trực tuyến kết hợp quản lý tài liệu và AI, phục vụ đồng thời người học cá nhân và các tổ chức giáo dục/trường học. Về nghiệp vụ, hệ thống có thể hiểu theo một luồng chính: trường học tổ chức việc học → giáo viên quản lý lớp và tạo nội dung → sinh viên học và làm bài → hệ thống ghi nhận kết quả → nhà trường theo dõi và chuyển tiếp sang học kỳ mới.

Đối với nhà trường, School Admin tạo năm học, học kỳ, ngành, môn học và lớp học, sau đó quản lý danh sách giáo viên và sinh viên, phân công giáo viên vào từng lớp và đưa sinh viên vào lớp. Khi kết thúc học kỳ, hệ thống hỗ trợ chuẩn bị học kỳ mới, tạo lớp mới, chuyển sinh viên và phân công lại giáo viên, nhưng vẫn giữ nguyên lịch sử dữ liệu của các học kỳ cũ. Đối với giáo viên, sau khi được phân công vào lớp, giáo viên có thể xem danh sách sinh viên, quản lý tài liệu và slide bài giảng, trình chiếu trực tiếp trên web, đồng thời sử dụng AI để tạo bộ câu hỏi từ nội dung slide/tài liệu. Giáo viên có thể chọn model AI, số lượng câu hỏi, dạng câu hỏi, độ khó và prompt riêng; kết quả AI chỉ là bản nháp để giáo viên kiểm tra, chỉnh sửa và phê duyệt trước khi sử dụng. Sau đó giáo viên tạo bài tập/bài kiểm tra, cấu hình thời gian, số lần làm, mã truy cập hoặc mật khẩu rồi chia sẻ trực tiếp cho lớp.

Đối với sinh viên, sau khi đăng nhập, hệ thống xác định các lớp và môn học mà sinh viên đang tham gia. Sinh viên có thể xem tài liệu, slide, bài tập và các bài kiểm tra được giáo viên giao. Khi mở một bài kiểm tra, hệ thống kiểm tra quyền truy cập và có thể yêu cầu mã truy cập/mật khẩu, sau đó sinh viên làm bài trực tiếp trên web với timer, tự động lưu câu trả lời và nộp bài. Các câu hỏi có thể được chấm tự động, kết quả được lưu lại để sinh viên xem lịch sử và tiến độ học tập; giáo viên có thể xem kết quả và thống kê của lớp.

Bên cạnh nghiệp vụ trường học, Cognito vẫn giữ hệ thống học tập cá nhân hiện có: người dùng có thể upload và đọc PDF/Word/hình ảnh, sử dụng AI để giải thích hoặc tóm tắt tài liệu, chat với AI theo nội dung đang học, tạo câu hỏi, làm bài kiểm tra, ghi chú, flashcard, mindmap, Pomodoro/timer và theo dõi tiến độ. Vì vậy, Cognito không chỉ là một hệ thống quản lý trường học mà là một learning platform kết hợp Personal Learning + School Learning. Người dùng cá nhân có thể học độc lập, còn khi thuộc một tổ chức thì họ có thêm lớp học, môn học, giáo viên, bài tập và kết quả học tập theo học kỳ.

Hiểu nghiệp vụ theo một chuỗi đơn giản

School Admin
→ Tạo Năm học
→ Tạo Học kỳ
→ Tạo Ngành + Môn học
→ Tạo Lớp học
→ Thêm Giáo viên + Sinh viên
→ Phân công giáo viên vào lớp
→ Xếp sinh viên vào lớp

Teacher
→ Vào lớp được phân công
→ Upload tài liệu/slide
→ Trình chiếu bài giảng
→ Dùng AI tạo câu hỏi
→ Giáo viên kiểm tra/chỉnh sửa
→ Tạo Question Set/Test
→ Giao bài cho lớp
→ Cấu hình thời gian/mã truy cập/số lần làm

Student
→ Đăng nhập
→ Xem lớp + môn học
→ Xem tài liệu/slide
→ Mở bài kiểm tra
→ Nhập mã nếu cần
→ Làm bài trực tiếp trên web
→ Nộp bài
→ Xem kết quả

Teacher / School Admin
→ Xem kết quả + thống kê + tiến độ
→ Theo dõi tình hình học tập

Cuối học kỳ
→ Đóng học kỳ cũ
→ Tạo học kỳ mới
→ Tạo/phân bổ lớp mới
→ Chuyển sinh viên
→ Phân công giáo viên
→ Tiếp tục chu kỳ học tập mới

Điểm quan trọng nhất về nghiệp vụ: sinh viên không thuộc cố định một lớp suốt đời. Quan hệ sinh viên–lớp phải gắn với học kỳ/năm học, vì sang học kỳ mới sinh viên có thể được chuyển sang lớp khác, trong khi kết quả, bài tập và lịch sử của lớp cũ vẫn phải được giữ lại. Giáo viên cũng được phân công theo từng lớp/học kỳ chứ không phải cố định với một lớp. 