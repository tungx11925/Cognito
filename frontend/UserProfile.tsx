import { useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Shield,
  Bell,
  Key,
  Globe,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Save,
  X,
  Star,
  Activity,
  Users,
  Zap,
} from "lucide-react";

const TABS = ["Thông tin", "Bảo mật", "Thông báo", "Hoạt động"];

const SKILLS = [
  { name: "React & TypeScript", level: 88 },
  { name: "UI/UX Design", level: 72 },
  { name: "Node.js", level: 65 },
  { name: "Data Analysis", level: 54 },
];

const RECENT_ACTIVITIES = [
  { icon: <BookOpen size={14} />, text: "Hoàn thành khóa học React Advanced", time: "2 giờ trước", color: "text-emerald-600 bg-emerald-50" },
  { icon: <Award size={14} />, text: "Đạt huy hiệu \"Top Learner\"", time: "1 ngày trước", color: "text-amber-600 bg-amber-50" },
  { icon: <Users size={14} />, text: "Tham gia nhóm học AI/ML", time: "3 ngày trước", color: "text-blue-600 bg-blue-50" },
  { icon: <CheckCircle2 size={14} />, text: "Nộp bài tập Flashcard #14", time: "5 ngày trước", color: "text-purple-600 bg-purple-50" },
  { icon: <Star size={14} />, text: "Đánh giá 5 sao khóa học Python", time: "1 tuần trước", color: "text-orange-600 bg-orange-50" },
];

const ACHIEVEMENTS = [
  { label: "Khóa học hoàn thành", value: "24", icon: <BookOpen size={16} />, color: "bg-emerald-50 text-emerald-700" },
  { label: "Flashcard tạo ra", value: "312", icon: <Zap size={16} />, color: "bg-amber-50 text-amber-700" },
  { label: "Giờ học tích lũy", value: "148h", icon: <Clock size={16} />, color: "bg-blue-50 text-blue-700" },
  { label: "Điểm thành tích", value: "2.4K", icon: <Star size={16} />, color: "bg-purple-50 text-purple-700" },
];

const NOTIFICATION_SETTINGS = [
  { label: "Nhắc nhở học tập hàng ngày", desc: "Gửi thông báo vào 8:00 sáng mỗi ngày", enabled: true },
  { label: "Cập nhật khóa học mới", desc: "Khi có nội dung mới từ khóa học đã đăng ký", enabled: true },
  { label: "Tin nhắn từ cộng đồng", desc: "Thông báo khi có người nhắn tin hoặc trả lời", enabled: false },
  { label: "Báo cáo tiến độ tuần", desc: "Tổng kết học tập gửi mỗi Chủ nhật", enabled: true },
  { label: "Thông báo khuyến mãi", desc: "Ưu đãi và chương trình đặc biệt", enabled: false },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${enabled ? "bg-[#2a4a38]" : "bg-gray-200"}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SkillBar({ name, level }: { name: string; level: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] text-[#1a2e23]">{name}</span>
        <span className="text-[12px] text-[#5a7a66] font-medium">{level}%</span>
      </div>
      <div className="h-1.5 bg-[#e8f0ec] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2a4a38] to-[#3d6b52] rounded-full transition-all duration-700"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}

export function UserProfile() {
  const [activeTab, setActiveTab] = useState("Thông tin");
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATION_SETTINGS);
  const [form, setForm] = useState({
    name: "Nguyễn Minh Phúc",
    email: "minhphuc.nguyen@gmail.com",
    phone: "0901 234 567",
    location: "Hồ Chí Minh, Việt Nam",
    website: "minhphuc.dev",
    bio: "Kỹ sư phần mềm với 4 năm kinh nghiệm. Đam mê học hỏi công nghệ mới và chia sẻ kiến thức với cộng đồng.",
    dob: "1998-05-15",
  });
  const [tempForm, setTempForm] = useState(form);

  const handleEdit = () => { setTempForm(form); setEditing(true); };
  const handleSave = () => { setForm(tempForm); setEditing(false); };
  const handleCancel = () => { setEditing(false); };

  const toggleNotif = (idx: number) => {
    setNotifications((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, enabled: !n.enabled } : n))
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Hero Card */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-br from-[#1a3328] via-[#2a4a38] to-[#3d6b52] relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6aaf89 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4d8a68 0%, transparent 40%)" }}
          />
          {/* Decorative circles */}
          <div className="absolute top-4 right-6 w-20 h-20 rounded-full border border-white/10" />
          <div className="absolute top-8 right-14 w-10 h-10 rounded-full border border-white/10" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2a4a38] to-[#4d8a68] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                MP
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#2a4a38] border-2 border-white flex items-center justify-center text-white hover:bg-[#1a3328] transition-colors">
                <Camera size={12} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:mb-0">
              {editing ? (
                <>
                  <button onClick={handleCancel} className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-[#5a7a66] bg-[#f0f5f2] rounded-xl hover:bg-[#e4ede8] transition-colors">
                    <X size={14} /> Hủy
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-white bg-[#2a4a38] rounded-xl hover:bg-[#1a3328] transition-colors">
                    <Save size={14} /> Lưu thay đổi
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-white bg-[#2a4a38] rounded-xl hover:bg-[#1a3328] transition-colors">
                  <Edit3 size={14} /> Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          </div>

          {/* Name & meta */}
          <div className="space-y-2">
            <div>
              <h2 className="text-[#1a2e23]">{form.name}</h2>
              <p className="text-[13px] text-[#5a7a66] mt-0.5">Kỹ sư Phần mềm · Thành viên từ tháng 1, 2024</p>
            </div>
            <p className="text-[13px] text-[#4a6b58] leading-relaxed max-w-xl">{form.bio}</p>
            <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#5a7a66] pt-1">
              <span className="flex items-center gap-1.5"><MapPin size={12} />{form.location}</span>
              <span className="flex items-center gap-1.5"><Globe size={12} />{form.website}</span>
              <span className="flex items-center gap-1.5"><Mail size={12} />{form.email}</span>
            </div>
          </div>

          {/* Achievement stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.label} className={`rounded-xl p-3 flex items-center gap-3 ${a.color.split(" ")[0]}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color}`}>
                  {a.icon}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1a2e23]">{a.value}</p>
                  <p className="text-[11px] text-[#5a7a66] leading-tight">{a.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex border-b border-[rgba(0,0,0,0.06)] px-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-[13px] border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-[#2a4a38] text-[#2a4a38] font-medium"
                  : "border-transparent text-[#5a7a66] hover:text-[#2a4a38]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB: Thông tin */}
          {activeTab === "Thông tin" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: form */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <h3 className="text-[#1a2e23] mb-4">Thông tin cá nhân</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Họ và tên", key: "name", icon: null, type: "text" },
                      { label: "Ngày sinh", key: "dob", icon: null, type: "date" },
                      { label: "Email", key: "email", icon: <Mail size={14} />, type: "email" },
                      { label: "Số điện thoại", key: "phone", icon: <Phone size={14} />, type: "tel" },
                      { label: "Vị trí", key: "location", icon: <MapPin size={14} />, type: "text" },
                      { label: "Website", key: "website", icon: <Globe size={14} />, type: "text" },
                    ].map(({ label, key, icon, type }) => (
                      <div key={key}>
                        <label className="block text-[12px] text-[#5a7a66] mb-1.5">{label}</label>
                        {editing ? (
                          <div className="relative">
                            {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a7a66]">{icon}</span>}
                            <input
                              type={type}
                              value={tempForm[key as keyof typeof tempForm]}
                              onChange={(e) => setTempForm({ ...tempForm, [key]: e.target.value })}
                              className={`w-full py-2.5 text-[13px] text-[#1a2e23] bg-[#f0f5f2] rounded-xl border border-transparent focus:outline-none focus:border-[#2a4a38]/30 focus:bg-white transition-all ${icon ? "pl-9 pr-3.5" : "px-3.5"}`}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-2.5 px-3.5 bg-[#f9faf9] rounded-xl">
                            {icon && <span className="text-[#5a7a66]">{icon}</span>}
                            <span className="text-[13px] text-[#1a2e23]">
                              {key === "dob" ? new Date(form.dob).toLocaleDateString("vi-VN") : form[key as keyof typeof form]}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <label className="block text-[12px] text-[#5a7a66] mb-1.5">Giới thiệu bản thân</label>
                    {editing ? (
                      <textarea
                        rows={3}
                        value={tempForm.bio}
                        onChange={(e) => setTempForm({ ...tempForm, bio: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-[13px] text-[#1a2e23] bg-[#f0f5f2] rounded-xl border border-transparent focus:outline-none focus:border-[#2a4a38]/30 focus:bg-white transition-all resize-none"
                      />
                    ) : (
                      <div className="py-2.5 px-3.5 bg-[#f9faf9] rounded-xl">
                        <p className="text-[13px] text-[#1a2e23] leading-relaxed">{form.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: skills + progress */}
              <div className="space-y-5">
                <div className="bg-[#f9faf9] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[#1a2e23]">Kỹ năng</h4>
                    <TrendingUp size={14} className="text-[#5a7a66]" />
                  </div>
                  <div className="space-y-3.5">
                    {SKILLS.map((s) => <SkillBar key={s.name} {...s} />)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1a3328] to-[#2a4a38] rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white/90 text-[14px]">Mức độ học tập</h4>
                    <Activity size={14} className="text-white/60" />
                  </div>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-3xl font-bold">98%</span>
                    <span className="text-[12px] text-white/60 mb-1">tỉ lệ hoàn thành</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full" style={{ width: "98%" }} />
                  </div>
                  <p className="text-[11px] text-white/50 mt-2">Top 3% toàn nền tảng</p>
                </div>

                <div className="border border-[rgba(0,0,0,0.07)] rounded-xl divide-y divide-[rgba(0,0,0,0.05)]">
                  {[
                    { label: "Chuỗi học liên tiếp", value: "14 ngày 🔥" },
                    { label: "Khóa học đang học", value: "3 khóa" },
                    { label: "Bạn học", value: "127 người" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-[#5a7a66]">{label}</span>
                      <span className="text-[13px] font-medium text-[#1a2e23]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Bảo mật */}
          {activeTab === "Bảo mật" && (
            <div className="max-w-xl space-y-5">
              <h3 className="text-[#1a2e23]">Bảo mật tài khoản</h3>

              {[
                {
                  icon: <Key size={18} className="text-[#2a4a38]" />,
                  title: "Đổi mật khẩu",
                  desc: "Cập nhật lần cuối 3 tháng trước",
                  action: "Đổi ngay",
                },
                {
                  icon: <Shield size={18} className="text-[#2a4a38]" />,
                  title: "Xác thực 2 yếu tố (2FA)",
                  desc: "Chưa được kích hoạt — bảo vệ tài khoản của bạn",
                  action: "Kích hoạt",
                  badge: "Khuyến nghị",
                },
                {
                  icon: <Activity size={18} className="text-[#2a4a38]" />,
                  title: "Phiên đăng nhập",
                  desc: "2 thiết bị đang hoạt động",
                  action: "Xem tất cả",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-4 p-4 bg-[#f9faf9] rounded-xl hover:bg-[#f0f5f2] transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-[#e8f0ec] flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-[#1a2e23]">{item.title}</p>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">{item.badge}</span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#5a7a66] mt-0.5">{item.desc}</p>
                  </div>
                  <button className="flex items-center gap-1 text-[12px] text-[#2a4a38] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.action} <ChevronRight size={13} />
                  </button>
                </div>
              ))}

              <div className="mt-6 p-4 border border-red-100 bg-red-50 rounded-xl">
                <p className="text-[13px] font-medium text-red-700 mb-0.5">Vùng nguy hiểm</p>
                <p className="text-[12px] text-red-500 mb-3">Xóa tài khoản sẽ không thể khôi phục. Mọi dữ liệu học tập sẽ bị mất.</p>
                <button className="text-[13px] text-red-600 hover:text-red-700 font-medium transition-colors">
                  Yêu cầu xóa tài khoản →
                </button>
              </div>
            </div>
          )}

          {/* TAB: Thông báo */}
          {activeTab === "Thông báo" && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[#1a2e23]">Tùy chọn thông báo</h3>
                <span className="text-[12px] text-[#5a7a66]">{notifications.filter((n) => n.enabled).length}/{notifications.length} đang bật</span>
              </div>
              <div className="space-y-2">
                {notifications.map((notif, idx) => (
                  <div key={notif.label} className="flex items-center gap-4 p-4 bg-[#f9faf9] rounded-xl hover:bg-[#f0f5f2] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1a2e23]">{notif.label}</p>
                      <p className="text-[12px] text-[#5a7a66] mt-0.5">{notif.desc}</p>
                    </div>
                    <Toggle enabled={notif.enabled} onChange={() => toggleNotif(idx)} />
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-3 text-[13px] text-white bg-[#2a4a38] rounded-xl hover:bg-[#1a3328] transition-colors">
                Lưu cài đặt thông báo
              </button>
            </div>
          )}

          {/* TAB: Hoạt động */}
          {activeTab === "Hoạt động" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[#1a2e23]">Lịch sử hoạt động</h3>
                <button className="text-[12px] text-[#5a7a66] hover:text-[#2a4a38] transition-colors">Xem tất cả</button>
              </div>

              {/* Heatmap mini */}
              <div className="mb-6 p-4 bg-[#f9faf9] rounded-xl">
                <p className="text-[12px] text-[#5a7a66] mb-3">Biểu đồ học tập — 4 tuần gần nhất</p>
                <div className="flex gap-1">
                  {Array.from({ length: 28 }, (_, i) => {
                    const level = Math.floor(Math.random() * 5);
                    const bg = ["bg-[#e8f0ec]", "bg-[#b8d4c3]", "bg-[#88b89a]", "bg-[#4d8a68]", "bg-[#2a4a38]"][level];
                    return <div key={i} className={`flex-1 h-8 rounded-sm ${bg}`} title={`${level * 25}% hoạt động`} />;
                  })}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-[#5a7a66]">Ít</span>
                  {["bg-[#e8f0ec]", "bg-[#b8d4c3]", "bg-[#88b89a]", "bg-[#4d8a68]", "bg-[#2a4a38]"].map((bg) => (
                    <div key={bg} className={`w-3 h-3 rounded-sm ${bg}`} />
                  ))}
                  <span className="text-[11px] text-[#5a7a66]">Nhiều</span>
                </div>
              </div>

              {/* Activity feed */}
              <div className="space-y-2">
                {RECENT_ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-[#f9faf9] rounded-xl hover:bg-[#f0f5f2] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#1a2e23]">{a.text}</p>
                    </div>
                    <span className="text-[11px] text-[#5a7a66] flex-shrink-0 flex items-center gap-1">
                      <Clock size={11} /> {a.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
