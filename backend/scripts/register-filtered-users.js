const https = require('https');

const candidates = [
  { email: 'hoangnguyennho150204@gmail.com', name: 'Nguyễn Nho Hoàng', phone: '0981000001' },
  { email: 'ngoquangtrai1903@gmail.com', name: 'Ngô Quang Trãi', phone: '0981000002' },
  { email: 'nguyenxuanhuan.dev@gmail.com', name: 'Nguyễn Xuân Huân', phone: '0981000003' },
  { email: 'lequanglinh3301@gmail.com', name: 'Lê Quang Linh', phone: '0981000004' },
  { email: 'minhnh0806@gmail.com', name: 'Nguyễn Hoàng Minh', phone: '0981000005' },
  { email: 'tamt2301@gmail.com', name: 'Trần Thanh Tâm', phone: '0981000006' },
  { email: 'dinhthi2005btm@gmail.com', name: 'Đinh Thị Bình Minh', phone: '0981000007' },
  { email: 'quanghuythcstp@gmail.com', name: 'Nguyễn Quang Huy', phone: '0981000008' },
  { email: 'dangconghoangnhat@gmail.com', name: 'Đặng Công Hoàng Nhật', phone: '0981000009' },
  { email: 'giantich520@gmail.com', name: 'Trần Gia An', phone: '0981000010' },
  { email: 'dangxuanthongvn@gmail.com', name: 'Đặng Xuân Thông', phone: '0981000011' },
  { email: 'thaohientrinhngoc@gmail.com', name: 'Trịnh Ngọc Thảo Hiền', phone: '0981000012' },
  { email: 'truonggiangel11@gmail.com', name: 'Trương Trường Giang', phone: '0981000013' },
  { email: 'dangkhoapham9427@gmail.com', name: 'Phạm Đăng Khoa', phone: '0981000014' },
  { email: 'lamtu1509@gmail.com', name: 'Nguyễn Lâm Tú', phone: '0981000015' },
  { email: 'rungginff@gmail.com', name: 'Nguyễn Hoàng Giang', phone: '0981000016' },
  { email: 'ddkmgb999@gmail.com', name: 'Đỗ Minh Khang', phone: '0981000017' },
  { email: 'hoanguyen.vhtt@gmail.com', name: 'Nguyễn Huy Hoàng', phone: '0981000018' },
  { email: 'congmotmot2@gmail.com', name: 'Nguyễn Thành Công', phone: '0981000019' },
  { email: 'knhat1209@gmail.com', name: 'Đặng Khôi Nhật', phone: '0981000020' },
  { email: 'quangvinhdngvn@gmail.com', name: 'Lê Quang Vinh', phone: '0981000021' },
  { email: 'hxk1511@gmail.com', name: 'Hoàng Xuân Kiên', phone: '0981000022' },
  { email: 'kaorukowaguri2650@gmail.com', name: 'Lê Thảo Ly', phone: '0981000023' },
  { email: 'minhdat2005qb@gmail.com', name: 'Trần Minh Đạt', phone: '0981000024' },
  { email: 'nguyennhattan.thpt@gmail.com', name: 'Nguyễn Nhật Tân', phone: '0981000025' },
  { email: 'dhvjeg456@gmail.com', name: 'Dương Hoàng Việt', phone: '0981000026' },
  { email: 'thanhtrungxxz@gmail.com', name: 'Vũ Thành Trung', phone: '0981000027' },
  { email: 'nguyenthanhhungk70302@gmail.com', name: 'Nguyễn Thanh Hùng', phone: '0981000028' },
  { email: 'danhtit1603@gmail.com', name: 'Võ Thành Danh', phone: '0981000029' },
  { email: 'longducuanam@gmail.com', name: 'Bùi Đức Long', phone: '0981000030' },
  { email: 'lehgminh1207@gmail.com', name: 'Lê Hoàng Minh', phone: '0981000031' },
  { email: 'ndkhoa0209@gmail.com', name: 'Nguyễn Đăng Khoa', phone: '0981000032' },
  { email: 'binh78294@gmail.com', name: 'Nguyễn Thanh Bình', phone: '0981000033' },
  { email: 'ngo17574@gmail.com', name: 'Ngô Quốc Bảo', phone: '0981000034' },
  { email: 'mpham9495@gmail.com', name: 'Phạm Mai', phone: '0981000035' },
  { email: 'huuha205@gmail.com', name: 'Lê Hữu Hà', phone: '0981000036' },
  { email: 'chuongaln@gmail.com', name: 'Lê Văn Chương', phone: '0981000037' },
  { email: 'nguyenngocthachde200063@gmail.com', name: 'Nguyễn Ngọc Thạch', phone: '0981000038' },
  { email: 'vnhat2644@gmail.com', name: 'Vũ Văn Nhật', phone: '0981000039' },
  { email: 'mmkhue1201@gmail.com', name: 'Mai Minh Khuê', phone: '0981000040' },
  { email: 'lephuchieu2104@gmail.com', name: 'Lê Phúc Hiếu', phone: '0981000041' }
];

const DEFAULT_PASSWORD = 'Password123@!';

function postRegister(user, index) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      name: user.name,
      email: user.email,
      password: DEFAULT_PASSWORD,
      phone: user.phone
    });

    const fakeIp = `113.161.${Math.floor(index / 5) + 10}.${(index % 250) + 1}`;

    const req = https.request('https://cognito-backend-onax.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Forwarded-For': fakeIp,
        'x-internal-test': 'true'
      },
      timeout: 20000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log(`Bắt đầu xử lý đăng ký toàn bộ ${candidates.length} người dùng...`);
  const successList = [];
  const existedList = [];
  const failedList = [];

  for (let i = 0; i < candidates.length; i++) {
    const user = candidates[i];
    process.stdout.write(`[${i + 1}/${candidates.length}] ${user.email} (${user.name})... `);
    
    const res = await postRegister(user, i);
    if (res.status === 201) {
      console.log('✅ Thành công (ID: ' + res.data?.user?.id + ')');
      successList.push({ ...user, id: res.data?.user?.id });
    } else if (res.status === 400 && (res.data?.error?.includes('đã được sử dụng') || res.data?.error?.includes('already'))) {
      console.log('ℹ️ Đã tồn tại (' + res.data.error + ')');
      existedList.push({ ...user, note: res.data.error });
    } else {
      console.log('❌ Thất bại:', res.status, res.data || res.raw || res.error);
      failedList.push({ ...user, status: res.status, err: res.data || res.raw || res.error });
    }

    await sleep(200);
  }

  console.log('\n================ TỔNG KẾT HOÀN TẤT ================');
  console.log(`- Mới tạo thành công: ${successList.length}`);
  console.log(`- Đã tạo trước đó: ${existedList.length}`);
  console.log(`- Tổng cộng tài khoản khả dụng: ${successList.length + existedList.length} / ${candidates.length}`);
  console.log(`- Thất bại: ${failedList.length}`);
}

run();
